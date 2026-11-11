import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { ActiveBuffs, FloatingPopupItem, GameScreen, GameStateSnapshot, InteractionPrompt, ItemType } from '../types';
import { SoundEngine } from '../audio/SoundEngine';
import { WorldBuilder } from '../world/WorldBuilder';
import { PlayerAvatar } from '../entities/PlayerAvatar';
import { MinerCharacter3D } from '../entities/MinerCharacter3D';
import { Item3DFactory } from '../entities/Item3DFactory';
import { VFXPoolManager } from '../gfx/VFXPoolManager';
import { CameraDirector } from '../gfx/CameraDirector';
import { HookController } from '../entities/HookController';

export class GoldMinerEngine {
  private container: HTMLElement;
  public sound: SoundEngine;

  // Three.js Core
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;

  // World & Entities
  public worldBuilder!: WorldBuilder;
  public playerAvatar!: PlayerAvatar;
  public hookController!: HookController;
  public minerCharacter!: MinerCharacter3D;
  private itemFactory!: Item3DFactory;
  public vfxPool!: VFXPoolManager;
  public cameraDirector!: CameraDirector;

  // Dynamic Lighting
  private ambientCavernLight!: THREE.HemisphereLight;
  private mainSunLight!: THREE.DirectionalLight;
  private explosionFlashLight!: THREE.PointLight;

  // Game State
  public state: GameScreen = 'HOTEL';
  public level: number = 1;
  public walletGold: number = 500;
  public targetScore: number = 1050;
  public remainingTime: number = 60;
  public dynamiteCount: number = 2;
  public buffs: ActiveBuffs = {
    strength: false,
    clover: false,
    polish: false,
    magnet: false,
  };
  public minerSpeech: string = '👨‍🏭 "Chào buổi sáng! Hãy rời khách sạn ra thị trấn chuẩn bị đồ nghề."';
  public lastResultPassed: boolean = true;
  public highScore: number = 500;
  public currentZoneName: string = 'Khách Sạn Thợ Mỏ';
  public questText: string = 'Rời khỏi khách sạn để ra thị trấn';
  public activePrompt: InteractionPrompt | null = null;

  // RPG Movement Inputs
  public moveInputState = { dx: 0, dz: 0 };
  public blastCountdown: number = 0;

  public worldItems: THREE.Group[] = [];

  // React Callbacks
  private onStateChange?: (snapshot: GameStateSnapshot) => void;
  private onFloatingPopup?: (popup: FloatingPopupItem) => void;
  private popupSeq: number = 0;

  constructor(
    container: HTMLElement,
    onStateChange?: (snapshot: GameStateSnapshot) => void,
    onFloatingPopup?: (popup: FloatingPopupItem) => void
  ) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.onFloatingPopup = onFloatingPopup;
    this.sound = new SoundEngine();

    const savedHighScore = localStorage.getItem('daovang_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 500;
    }

    this.initThreePBRScene();

    // 1. Build the 3D World (Hotel, Town, Mine Exterior, Cavern, Blasting Area)
    this.worldBuilder = new WorldBuilder(this.scene);

    // 2. Build the Walking 3D Player Avatar for exploration
    this.playerAvatar = new PlayerAvatar(this.scene);

    // 3. Subsystems
    this.vfxPool = new VFXPoolManager(this.scene);
    this.cameraDirector = new CameraDirector(this.camera);
    this.itemFactory = new Item3DFactory();

    // 4. Miner character and Hook Crane for underground mining
    this.minerCharacter = new MinerCharacter3D(this.scene, new THREE.Vector3(0, 3.6, -0.35));
    this.hookController = new HookController(
      this.scene,
      this.vfxPool,
      this.cameraDirector,
      this.sound,
      this.minerCharacter,
      (item) => this.handleItemScored(item)
    );

    // Start in the Hotel!
    this.setZone('HOTEL');
    this.spawnLevelItems(1);

    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private initThreePBRScene(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 2);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a120c);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 140);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width * pr, height * pr), 0.32, 0.25, 0.88);
    this.composer.addPass(this.bloomPass);

    // Scene lights
    this.ambientCavernLight = new THREE.HemisphereLight(0xfff8ee, 0x3d2719, 1.4);
    this.scene.add(this.ambientCavernLight);

    this.mainSunLight = new THREE.DirectionalLight(0xfff6dd, 2.2);
    this.mainSunLight.position.set(10, 18, 12);
    this.mainSunLight.castShadow = true;
    this.scene.add(this.mainSunLight);

    this.explosionFlashLight = new THREE.PointLight(0xff4500, 0, 45);
    this.explosionFlashLight.position.set(0, 0, 3);
    this.scene.add(this.explosionFlashLight);
  }

  /**
   * Set Zone & Seamlessly Transition Character, Camera, and World
   */
  public setZone(zone: GameScreen): void {
    this.state = zone;
    this.worldBuilder.setVisibleZone(
      zone === 'SHOP' ? 'TOWN' : (zone as 'HOTEL' | 'TOWN' | 'MINE_EXTERIOR' | 'MINING' | 'BLASTING')
    );

    // Hide Crane & Miner seated atop the cart unless MINING
    const isMining = zone === 'MINING';
    this.hookController.cartGroup.visible = isMining;
    this.hookController.pivotGroup.visible = isMining;
    this.minerCharacter.root.visible = isMining;
    this.worldItems.forEach((it) => (it.visible = isMining));

    // Show walking player avatar in exploration zones
    this.playerAvatar.root.visible = !isMining && zone !== 'BLASTING';

    if (zone === 'HOTEL') {
      this.currentZoneName = '🏨 Khách Sạn Thợ Mỏ';
      this.questText = 'Rời khách sạn để bước ra thị trấn';
      this.setMinerSpeech('👨‍🏭 "Chào buổi sáng! Hãy rời khách sạn ra thị trấn chuẩn bị đồ nghề."');
      this.playerAvatar.setPosition(-1.5, 0, -1.0, 0);

      // Camera view inside the cozy hotel
      this.camera.position.set(0, 6.2, -7.2);
      this.camera.lookAt(0, 1.2, 0);
      this.camera.fov = 46;
      this.camera.updateProjectionMatrix();
    } else if (zone === 'TOWN') {
      this.sound.playDoor();
      this.currentZoneName = '🏘️ Thị Trấn Thợ Mỏ Miền Tây';
      this.questText = 'Vào Cửa Hàng mua trang bị hoặc Đi bộ ra Mỏ Vàng';
      this.setMinerSpeech('👨‍🏭 "Thị trấn tấp nập! Ghé Cửa Hàng mua Thuốc nổ TNT rồi ra Mỏ Vàng nhé."');
      this.playerAvatar.setPosition(0, 0, -9.5, 0);

      // Camera view framing the town street
      this.camera.position.set(0, 8.5, -18.0);
      this.camera.lookAt(0, 2.0, 0);
      this.camera.fov = 48;
      this.camera.updateProjectionMatrix();
    } else if (zone === 'SHOP') {
      this.currentZoneName = '🏪 Cửa Hàng Vật Phẩm Thợ Mỏ';
      this.questText = 'Mua sắm trang bị cần thiết trước khi xuống mỏ';
      this.setMinerSpeech('🛍️ Chủ quán: "Cần Thuốc Nổ hay Nước Tăng Lực không bác thợ mỏ ơi?"');
    } else if (zone === 'MINE_EXTERIOR') {
      this.currentZoneName = '⛰️ Lối Vào Mỏ Vàng';
      this.questText = 'Tiến vào cửa hầm mỏ để vận hành máy đào';
      this.setMinerSpeech('👨‍🏭 "Đã tới cửa mỏ vàng! Tiến vào trong cửa hầm nào."');
      this.playerAvatar.setPosition(0, 0, -6.5, 0);

      this.camera.position.set(0, 7.5, -14.5);
      this.camera.lookAt(0, 2.8, 3.5);
      this.camera.fov = 48;
      this.camera.updateProjectionMatrix();
    } else if (zone === 'MINING') {
      this.sound.playDoor();
      this.currentZoneName = `⛏️ Lòng Mỏ Vàng (Màn ${this.level})`;
      this.questText = `Đào vàng đạt chỉ tiêu $${this.targetScore.toLocaleString()}!`;
      this.setMinerSpeech('👨‍🏭 "Đã ngồi vào Máy Đào! Nhấn Chuột hoặc Space để phóng móc câu!"');
      this.hookController.resetHook();

      // Perfectly framed rock-solid mining arcade camera
      this.cameraDirector.setMode('PLAYING');
      this.remainingTime = 60;
    } else if (zone === 'BLASTING') {
      this.currentZoneName = '💥 Khu Vực Phá Núi Mở Mỏ';
      this.questText = 'Chuẩn bị kích nổ thuốc nổ phá núi mở tầng mỏ mới!';
      this.blastCountdown = 3.2;
      this.camera.position.set(0, 0.5, 8.5);
      this.camera.lookAt(0, 0, 0);
      this.camera.fov = 44;
      this.camera.updateProjectionMatrix();
    }

    this.emitState();
  }

  public interactCurrentPrompt(): void {
    if (this.activePrompt) {
      this.sound.playClick();
      this.activePrompt.onTrigger();
    }
  }

  public setMoveInput(dx: number, dz: number): void {
    this.moveInputState.dx = dx;
    this.moveInputState.dz = dz;
  }

  public spawnLevelItems(levelNum: number): void {
    this.worldItems.forEach((item) => this.scene.remove(item));
    this.worldItems = [];

    const configs: Array<{ type: ItemType; x: number; y: number }> = [];

    if (levelNum === 1) {
      configs.push(
        { type: 'GOLD_MEDIUM', x: -4.2, y: -2.8 },
        { type: 'GOLD_SMALL', x: -2.1, y: -4.5 },
        { type: 'GOLD_LARGE', x: 2.8, y: -5.5 },
        { type: 'ROCK_SMALL', x: -1.2, y: -3.2 },
        { type: 'ROCK_LARGE', x: 1.5, y: -3.8 },
        { type: 'DIAMOND', x: -4.5, y: -7.0 },
        { type: 'MYSTERY_BAG', x: 4.5, y: -3.2 },
        { type: 'TNT', x: 0.0, y: -5.2 },
        { type: 'GOLD_SMALL', x: 0.4, y: -7.5 }
      );
    } else {
      const count = 9 + Math.min(6, levelNum);
      const types: ItemType[] = [
        'GOLD_SMALL',
        'GOLD_MEDIUM',
        'GOLD_LARGE',
        'ROCK_SMALL',
        'ROCK_LARGE',
        'DIAMOND',
        'MYSTERY_BAG',
        'TNT',
      ];
      for (let i = 0; i < count; i++) {
        const randType = types[Math.floor(Math.random() * types.length)];
        const rx = (Math.random() - 0.5) * 10.5;
        const ry = -2.2 - Math.random() * 5.8;
        configs.push({ type: randType, x: rx, y: ry });
      }
    }

    configs.forEach((cfg) => {
      const mesh = this.itemFactory.createItemMesh(cfg.type);
      mesh.position.set(cfg.x, cfg.y, (Math.random() - 0.5) * 0.4);
      mesh.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(mesh);
      this.worldItems.push(mesh);
    });
  }

  public triggerTNTExplosion(tntItem: THREE.Group): void {
    const pos = tntItem.position.clone();
    this.vfxPool.spawnVFX('TNTExplosion', pos);
    this.sound.playExplosion();
    this.cameraDirector.triggerShake(0.55, 0.35);

    this.explosionFlashLight.position.copy(pos);
    this.explosionFlashLight.intensity = 8.5;

    const idx = this.worldItems.indexOf(tntItem);
    if (idx !== -1) this.worldItems.splice(idx, 1);
    this.scene.remove(tntItem);

    const radius = tntItem.userData.explosionRadius || 4.2;
    const victims = this.worldItems.filter((it) => it.position.distanceTo(pos) <= radius);

    victims.forEach((victim) => {
      if (victim.userData.isExplosive) {
        setTimeout(() => this.triggerTNTExplosion(victim), 130);
      } else {
        this.vfxPool.spawnVFX('RockDebris', victim.position);
        const vIdx = this.worldItems.indexOf(victim);
        if (vIdx !== -1) this.worldItems.splice(vIdx, 1);
        this.scene.remove(victim);
      }
    });

    this.emitState();
  }

  private handleItemScored(item: THREE.Group): void {
    let reward = item.userData.baseValue;
    let popupText = `+$${reward}`;
    let popupColor = '#fde047';

    if (item.userData.type === 'MYSTERY_BAG') {
      const roll = Math.random();
      if (this.buffs.clover) {
        reward = Math.floor(500 + Math.random() * 450);
        popupText = `🍀 TÚI MAY MẮN +$${reward}`;
        popupColor = '#34d399';
      } else if (roll > 0.76) {
        this.dynamiteCount++;
        reward = 180;
        popupText = `🧨 +1 TNT & +$180`;
        popupColor = '#fb923c';
      } else {
        reward = Math.floor(80 + Math.random() * 620);
        popupText = `💰 TÚI BÍ ẨN +$${reward}`;
      }
    } else if (item.userData.type === 'DIAMOND') {
      if (this.buffs.polish) reward = Math.round(reward * 1.5);
      popupColor = '#38bdf8';
      popupText = `💎 KIM CƯƠNG +$${reward}`;
    }

    this.walletGold += reward;
    if (this.walletGold > this.highScore) {
      this.highScore = this.walletGold;
      localStorage.setItem('daovang_highscore', String(this.highScore));
    }

    this.sound.playCoin(reward);
    this.minerCharacter.triggerCheer();
    this.setMinerSpeech(`👨‍🏭 "Tuyệt vời! Kéo thành công, thu về +$${reward}!"`);

    this.emitFloatingPopup(new THREE.Vector3(0, 4.2, 0), popupText, popupColor);
    this.emitState();

    if (this.worldItems.length === 0) {
      this.finishMiningLevel();
    }
  }

  public finishMiningLevel(): void {
    this.hookController.resetHook();
    const passed = this.walletGold >= this.targetScore;
    this.lastResultPassed = passed;

    this.buffs = { strength: false, clover: false, polish: false, magnet: false };

    if (passed) {
      // Transition to mountain blasting scene!
      this.setZone('BLASTING');
    } else {
      this.setMinerSpeech('👨‍🏭 "Tiếc quá, chưa đủ chỉ tiêu! Hãy về khách sạn nghỉ ngơi và thử lại từ Màn 1."');
      this.level = 1;
      this.walletGold = 500;
      this.targetScore = 1050;
      this.dynamiteCount = 2;
      this.spawnLevelItems(1);
      this.setZone('HOTEL');
    }

    this.emitState();
  }

  public launchHook(): void {
    if (this.state !== 'MINING') return;
    this.hookController.launch(this.buffs.magnet);
    this.emitState();
  }

  public tryUseDynamite(): void {
    if (this.state !== 'MINING' || this.dynamiteCount <= 0) return;
    if (this.hookController.throwDynamiteOnAttachedItem()) {
      this.dynamiteCount--;
      this.emitState();
    }
  }

  public buyItem(key: 'dynamite' | 'strength' | 'clover' | 'polish' | 'magnet', price: number): boolean {
    if (this.walletGold < price) return false;

    if (key === 'dynamite') {
      this.walletGold -= price;
      this.dynamiteCount++;
      this.sound.playCoin(price);
      this.emitState();
      return true;
    }

    if (!this.buffs[key]) {
      this.walletGold -= price;
      this.buffs[key] = true;
      this.sound.playCoin(price);
      this.emitState();
      return true;
    }

    return false;
  }

  public toggleAudio(): boolean {
    const isMuted = this.sound.toggleMute();
    this.emitState();
    return isMuted;
  }

  public emitFloatingPopup(worldPos: THREE.Vector3, text: string, color: string = '#fde047'): void {
    if (!this.onFloatingPopup) return;
    const v = worldPos.clone().project(this.camera);
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    const x = (v.x * 0.5 + 0.5) * width;
    const y = (-(v.y * 0.5) + 0.5) * height;

    this.popupSeq++;
    this.onFloatingPopup({ id: this.popupSeq, text, color, x, y });
  }

  public setMinerSpeech(text: string): void {
    this.minerSpeech = text;
    this.emitState();
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || !this.composer) return;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pr);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(width, height);
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width * pr, height * pr);
    }
    this.cameraDirector.updateTargetFraming();
  }

  public emitState(): void {
    if (!this.onStateChange) return;
    const canUseDyn =
      this.state === 'MINING' &&
      this.dynamiteCount > 0 &&
      this.hookController.state === 'RETURNING' &&
      this.hookController.attachedItem !== null;

    const canFinishEarly = this.state === 'MINING' && this.walletGold >= this.targetScore;

    this.onStateChange({
      screen: this.state,
      level: this.level,
      walletGold: this.walletGold,
      targetScore: this.targetScore,
      remainingTime: this.remainingTime,
      dynamiteCount: this.dynamiteCount,
      buffs: { ...this.buffs },
      canUseDynamite: canUseDyn,
      canFinishEarly: canFinishEarly,
      minerSpeech: this.minerSpeech,
      isMuted: this.sound.muted,
      lastResultPassed: this.lastResultPassed,
      highScore: this.highScore,
      currentZoneName: this.currentZoneName,
      interactionPrompt: this.activePrompt,
      questText: this.questText,
    });
  }

  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // ==========================================
    // 1. EXPLORATION MOVEMENT & INTERACTION CHECKS
    // ==========================================
    let detectedPrompt: InteractionPrompt | null = null;

    if (this.state === 'HOTEL') {
      this.playerAvatar.moveInput(this.moveInputState.dx, this.moveInputState.dz, dt, {
        minX: -3.6,
        maxX: 3.6,
        minZ: -3.6,
        maxZ: 4.0,
      });
      this.playerAvatar.update(dt, elapsed);

      // Distance to Hotel Exit Door (0, 0, 3.8)
      if (this.playerAvatar.position.distanceTo(new THREE.Vector3(0, 0, 3.8)) < 1.6) {
        detectedPrompt = {
          actionKey: 'E',
          title: 'Bước Ra Thị Trấn',
          description: 'Rời khách sạn để tiến vào phố thị trấn miền Tây',
          onTrigger: () => this.setZone('TOWN'),
        };
      }
    } else if (this.state === 'TOWN') {
      this.playerAvatar.moveInput(this.moveInputState.dx, this.moveInputState.dz, dt, {
        minX: -5.8,
        maxX: 5.8,
        minZ: -11.0,
        maxZ: 12.0,
      });
      this.playerAvatar.update(dt, elapsed);

      // Dynamic Camera follow in Town
      this.camera.position.z = this.playerAvatar.position.z - 8.5;
      this.camera.position.x = this.playerAvatar.position.x * 0.4;
      this.camera.lookAt(this.playerAvatar.position.x * 0.2, 1.8, this.playerAvatar.position.z + 4.5);

      // 1. Near General Store (-5.2, 0, 0)
      if (this.playerAvatar.position.distanceTo(new THREE.Vector3(-4.8, 0, 0)) < 2.2) {
        detectedPrompt = {
          actionKey: 'E',
          title: 'Vào Cửa Hàng Trang Bị',
          description: 'Ghé tiệm mua thuốc nổ TNT, nước tăng lực và cỏ may mắn',
          onTrigger: () => this.setZone('SHOP'),
        };
      }
      // 2. Near Mountain Mine Trail (0, 0, 11.0)
      else if (this.playerAvatar.position.distanceTo(new THREE.Vector3(0, 0, 10.8)) < 2.2) {
        detectedPrompt = {
          actionKey: 'E',
          title: 'Đi Bộ Ra Mỏ Vàng',
          description: 'Rời thị trấn theo lối mòn leo lên mỏ vàng trên núi',
          onTrigger: () => this.setZone('MINE_EXTERIOR'),
        };
      }
      // 3. Near Hotel Door (0, 0, -10.0)
      else if (this.playerAvatar.position.distanceTo(new THREE.Vector3(0, 0, -10.0)) < 2.0) {
        detectedPrompt = {
          actionKey: 'E',
          title: 'Trở Lại Khách Sạn',
          description: 'Vào lại phòng nghỉ khách sạn thợ mỏ',
          onTrigger: () => this.setZone('HOTEL'),
        };
      }
    } else if (this.state === 'MINE_EXTERIOR') {
      this.playerAvatar.moveInput(this.moveInputState.dx, this.moveInputState.dz, dt, {
        minX: -4.5,
        maxX: 4.5,
        minZ: -8.0,
        maxZ: 5.2,
      });
      this.playerAvatar.update(dt, elapsed);

      // Near Mountain Mine Portal (0, 0, 4.8)
      if (this.playerAvatar.position.distanceTo(new THREE.Vector3(0, 0, 4.5)) < 2.2) {
        detectedPrompt = {
          actionKey: 'E',
          title: 'Vào Hầm Mỏ Vàng',
          description: 'Bước vào hầm mỏ và khởi động máy đào',
          onTrigger: () => this.setZone('MINING'),
        };
      }
      // Path back to town (0, 0, -7.5)
      else if (this.playerAvatar.position.distanceTo(new THREE.Vector3(0, 0, -7.0)) < 1.8) {
        detectedPrompt = {
          actionKey: 'E',
          title: 'Quay Về Thị Trấn',
          description: 'Đi ngược lại con đường về thị trấn',
          onTrigger: () => this.setZone('TOWN'),
        };
      }
    } else if (this.state === 'MINING') {
      this.remainingTime -= dt;
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.finishMiningLevel();
        return;
      }

      this.hookController.update(
        dt,
        elapsed,
        this.worldItems,
        this.buffs,
        (tntItem) => this.triggerTNTExplosion(tntItem),
        (msg) => this.setMinerSpeech(msg)
      );
    } else if (this.state === 'BLASTING') {
      // Countdown and explode the mountain wall!
      this.blastCountdown -= dt;
      if (this.blastCountdown <= 0 && this.blastCountdown > -10) {
        this.blastCountdown = -99; // trigger once
        this.vfxPool.spawnVFX('TNTExplosion', new THREE.Vector3(0, 0, 1.5));
        this.vfxPool.spawnVFX('RockDebris', new THREE.Vector3(-1.5, 0, 1.5));
        this.vfxPool.spawnVFX('RockDebris', new THREE.Vector3(1.5, 0, 1.5));
        this.sound.playExplosion();
        this.cameraDirector.triggerShake(0.85, 0.65);
        this.explosionFlashLight.intensity = 15;

        // Advance to next mine level!
        this.level++;
        this.targetScore = Math.floor(this.walletGold + 650 + this.level * 250);
        this.spawnLevelItems(this.level);
        this.setMinerSpeech(`🎉 "ĐÃ PHÁ NÚI THÀNH CÔNG! Phát hiện mỏ vàng Màn ${this.level} phong phú hơn!"`);
      }
    }

    if (this.activePrompt !== detectedPrompt) {
      this.activePrompt = detectedPrompt;
      this.emitState();
    }

    // Dynamic rotation on Diamonds & TNT fuse sparks
    for (let i = 0; i < this.worldItems.length; i++) {
      const item = this.worldItems[i];
      if (item.userData.type === 'DIAMOND') {
        item.rotation.y += dt * 1.6;
      } else if (item.userData.type === 'TNT') {
        const spark = item.getObjectByName('tntFuseSpark');
        if (spark) {
          spark.scale.setScalar(0.85 + Math.sin(elapsed * 28 + i) * 0.35);
        }
      }
    }

    if (this.explosionFlashLight && this.explosionFlashLight.intensity > 0) {
      this.explosionFlashLight.intensity = Math.max(0, this.explosionFlashLight.intensity - dt * 25);
    }

    this.vfxPool.update(dt);
    if (this.state === 'MINING') {
      this.cameraDirector.update(dt);
    }
    this.composer.render();
  }

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}
