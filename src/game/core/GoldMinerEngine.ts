import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { ActiveBuffs, FloatingPopupItem, GameScreen, GameStateSnapshot, ItemType } from '../types';
import { SoundEngine } from '../audio/SoundEngine';
import { PBRTextureGenerator } from '../gfx/PBRTextureGenerator';
import { MinerCharacter3D } from '../entities/MinerCharacter3D';
import { Item3DFactory } from '../entities/Item3DFactory';
import { VFXPoolManager } from '../gfx/VFXPoolManager';
import { CameraDirector } from '../gfx/CameraDirector';
import { HookController } from '../entities/HookController';

export class GoldMinerEngine {
  private container: HTMLElement;
  public sound: SoundEngine;

  // Scene & Rendering
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;

  // Game Entities & Subsystems
  private minerCharacter!: MinerCharacter3D;
  private itemFactory!: Item3DFactory;
  private vfxPool!: VFXPoolManager;
  private cameraDirector!: CameraDirector;
  public hookController!: HookController;

  // Lights & Dynamic FX
  private lanternLights: THREE.PointLight[] = [];
  private explosionFlashLight!: THREE.PointLight;

  // State Management
  public state: GameScreen = 'HOME';
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
  public minerSpeech: string = '👨‍🏭 Ông Thợ Mỏ: "Chào mừng bạn! Sẵn sàng đào kho báu chưa?"';
  public lastResultPassed: boolean = true;
  public highScore: number = 500;

  public worldItems: THREE.Group[] = [];

  // Callback to React
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
    this.buildOpenTopMineEnvironment3D();

    // Create 3D Miner Character sitting on cart at (0, 3.6, -0.35)
    this.minerCharacter = new MinerCharacter3D(this.scene, new THREE.Vector3(0, 3.6, -0.35));

    this.itemFactory = new Item3DFactory();
    this.vfxPool = new VFXPoolManager(this.scene);
    this.cameraDirector = new CameraDirector(this.camera);
    this.hookController = new HookController(
      this.scene,
      this.vfxPool,
      this.cameraDirector,
      this.sound,
      this.minerCharacter,
      (item) => this.handleItemScored(item)
    );

    this.spawnLevelItems(1);
    this.emitState();

    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  private initThreePBRScene(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0806);
    this.scene.fog = new THREE.FogExp2(0x0b0806, 0.011);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 120);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // PMREM Environment Map for realistic Gold & Metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // UnrealBloomPass Post-Processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.35, 0.85);
    this.composer.addPass(this.bloomPass);
  }

  private buildOpenTopMineEnvironment3D(): void {
    const stoneBump = PBRTextureGenerator.createStoneBumpMap();
    stoneBump.repeat.set(6, 4);

    // 1. Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x292018, 1.05);
    this.scene.add(hemiLight);

    // Dedicated Spotlight on the 3D Miner Character
    const minerKeyLight = new THREE.SpotLight(0xfff4d6, 6.5, 25, Math.PI / 2.6, 0.35, 1);
    minerKeyLight.position.set(0, 9.2, 7.5);
    minerKeyLight.target.position.set(0, 4.6, 0);
    this.scene.add(minerKeyLight);
    this.scene.add(minerKeyLight.target);

    // Main Directional Sunlight
    const dirLight = new THREE.DirectionalLight(0xfff1d6, 1.75);
    dirLight.position.set(8, 18, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 18;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Explosion Flash Light
    this.explosionFlashLight = new THREE.PointLight(0xff4500, 0, 35);
    this.explosionFlashLight.position.set(0, -3, 3);
    this.scene.add(this.explosionFlashLight);

    // 2. Timber Mine Arch & Lanterns
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x5c2d0c, roughness: 0.85 });
    [-4.8, 4.8].forEach((xPillar) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 0.65), timberMat);
      pillar.position.set(xPillar, 4.6, 0);
      pillar.castShadow = true;
      this.scene.add(pillar);

      // Hanging Lantern
      const lanternMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 0.36, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
      );
      lanternMesh.position.set(xPillar * 0.82, 5.5, 0.5);
      this.scene.add(lanternMesh);

      const pLight = new THREE.PointLight(0xff9900, 2.5, 9.5);
      pLight.position.copy(lanternMesh.position);
      this.scene.add(pLight);
      this.lanternLights.push(pLight);
    });

    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.55, 0.7), timberMat);
    crossBeam.position.set(0, 6.4, 0);
    this.scene.add(crossBeam);

    // Ground Platform at y = 3.6
    const groundGeom = new THREE.BoxGeometry(22, 1.2, 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x261a12,
      roughness: 0.9,
      bumpMap: stoneBump,
      bumpScale: 0.12,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, 3.0, 0);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Underground Mine Chamber Back Wall
    const backWallGeom = new THREE.PlaneGeometry(24, 16);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x17120e,
      roughness: 0.95,
      bumpMap: stoneBump,
      bumpScale: 0.35,
    });
    const backWall = new THREE.Mesh(backWallGeom, backWallMat);
    backWall.position.set(0, -4.5, -2.5);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Mine Shaft Rails
    [-0.7, 0.7].forEach((zOff) => {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.1, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
      );
      rail.position.set(0, 3.65, zOff);
      this.scene.add(rail);
    });
  }

  public spawnLevelItems(levelNum: number): void {
    // Clear existing items
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
    } else if (levelNum === 2) {
      configs.push(
        { type: 'GOLD_LARGE', x: -3.8, y: -4.8 },
        { type: 'GOLD_LARGE', x: 3.8, y: -5.2 },
        { type: 'DIAMOND', x: -5.0, y: -7.2 },
        { type: 'DIAMOND', x: 4.8, y: -7.0 },
        { type: 'MYSTERY_BAG', x: -1.8, y: -3.5 },
        { type: 'MYSTERY_BAG', x: 1.8, y: -3.5 },
        { type: 'TNT', x: -2.8, y: -6.0 },
        { type: 'TNT', x: 2.8, y: -6.0 },
        { type: 'ROCK_LARGE', x: 0.0, y: -4.0 },
        { type: 'ROCK_SMALL', x: -4.2, y: -2.5 },
        { type: 'GOLD_MEDIUM', x: 0.0, y: -7.2 }
      );
    } else {
      // Procedural level scaling
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
    this.cameraDirector.triggerShake(0.8, 0.55);

    this.explosionFlashLight.position.copy(pos);
    this.explosionFlashLight.intensity = 8.5;

    const idx = this.worldItems.indexOf(tntItem);
    if (idx !== -1) this.worldItems.splice(idx, 1);
    this.scene.remove(tntItem);

    const radius = tntItem.userData.explosionRadius || 3.8;
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
    this.setMinerSpeech(`👨‍🏭 Ông Thợ Mỏ: "Tuyệt vời! Thu về +$${reward}!"`);

    // Emit 2D screen coordinate floating popup
    this.emitFloatingPopup(new THREE.Vector3(0, 4.2, 0), popupText, popupColor);
    this.emitState();

    if (this.worldItems.length === 0) {
      this.finishLevel();
    }
  }

  public emitFloatingPopup(worldPos: THREE.Vector3, text: string, color: string = '#fde047'): void {
    if (!this.onFloatingPopup) return;
    const v = worldPos.clone().project(this.camera);
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    const x = (v.x * 0.5 + 0.5) * width;
    const y = (-(v.y * 0.5) + 0.5) * height;

    this.popupSeq++;
    this.onFloatingPopup({
      id: this.popupSeq,
      text,
      color,
      x,
      y,
    });
  }

  public setMinerSpeech(text: string): void {
    this.minerSpeech = text;
    this.emitState();
  }

  public startPureGameplay(): void {
    this.sound.init();
    this.state = 'PLAYING';
    this.remainingTime = 60;
    if (this.level === 1 && this.targetScore < 900) {
      this.targetScore = 1050;
    }

    this.hookController.resetHook();
    this.cameraDirector.setMode('PLAYING');
    this.setMinerSpeech('👨‍🏭 Ông Thợ Mỏ: "Nhấn Chuột hoặc Phím Space để phóng móc!"');
    this.emitState();
  }

  public goToHomeScreen(): void {
    this.state = 'HOME';
    this.hookController.resetHook();
    this.cameraDirector.setMode('HOME');
    this.emitState();
  }

  public openShopScreen(): void {
    this.sound.init();
    this.state = 'SHOP';
    this.hookController.resetHook();
    this.cameraDirector.setMode('HOME');
    this.emitState();
  }

  public finishLevel(): void {
    this.hookController.resetHook();
    const passed = this.walletGold >= this.targetScore;
    this.lastResultPassed = passed;

    // Clear single-level buffs
    this.buffs = { strength: false, clover: false, polish: false, magnet: false };
    this.state = 'RESULT';

    if (passed) {
      this.level++;
      this.targetScore = Math.floor(this.walletGold + 650 + this.level * 220);
      this.spawnLevelItems(this.level);
    } else {
      this.level = 1;
      this.walletGold = 500;
      this.targetScore = 1050;
      this.dynamiteCount = 2;
      this.spawnLevelItems(1);
    }

    this.emitState();
  }

  public launchHook(): void {
    if (this.state !== 'PLAYING') return;
    this.hookController.launch(this.buffs.magnet);
    this.emitState();
  }

  public tryUseDynamite(): void {
    if (this.state !== 'PLAYING' || this.dynamiteCount <= 0) return;
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

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || !this.composer) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  public emitState(): void {
    if (!this.onStateChange) return;
    const canUseDyn =
      this.state === 'PLAYING' &&
      this.dynamiteCount > 0 &&
      this.hookController.state === 'RETURNING' &&
      this.hookController.attachedItem !== null;

    const canFinishEarly = this.state === 'PLAYING' && this.walletGold >= this.targetScore;

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
    });
  }

  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    if (this.state === 'PLAYING') {
      this.remainingTime -= dt;
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.finishLevel();
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
      this.emitState();
    } else {
      // Background idle movement for Home/Shop/Result
      this.hookController.swingTime += dt * 1.1;
      this.hookController.currentAngle = Math.sin(this.hookController.swingTime) * 0.45;
      this.hookController.pivotGroup.rotation.z = this.hookController.currentAngle;
      this.minerCharacter.update(dt, elapsed, 'SWINGING', this.hookController.currentAngle, null, 1.0);
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
      this.explosionFlashLight.intensity = Math.max(0, this.explosionFlashLight.intensity - dt * 28);
    }

    this.lanternLights.forEach((light, idx) => {
      light.intensity = 2.4 + Math.sin(elapsed * 8 + idx * 3) * 0.2;
    });

    this.vfxPool.update(dt);
    this.cameraDirector.update(dt);
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

