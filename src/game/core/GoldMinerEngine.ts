/**
 * GoldMinerEngine - High-Definition (1280x720) Game Core Engine
 * Powered by HD720Renderer with full RPG exploration and arcade mining.
 * Zero 8-pixel boxy shapes, pure 720p HD stylized art!
 */

import {
  ActiveBuffs,
  FloatingPopupItem,
  GameScreen,
  GameStateSnapshot,
  InteractionPrompt,
  ItemType,
} from '../types';
import { SoundEngine } from '../audio/SoundEngine';
import {
  HD720Renderer,
  MiningHookState,
  RenderContext,
  UndergroundItem,
  VFXParticle,
} from '../renderer/HD720Renderer';

export class GoldMinerEngine {
  private container: HTMLElement;
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public sound: SoundEngine;

  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private elapsed: number = 0;

  // Screen shake
  private shakeTime: number = 0;
  private shakeMagnitude: number = 0;

  // Game State
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
  public minerSpeech: string = '👨‍🏭 "Chào mừng bạn đến với Đào Vàng HD! Nhấn Bắt Đầu để tới khách sạn."';
  public lastResultPassed: boolean = true;
  public highScore: number = 500;
  public currentZoneName: string = 'Sảnh Khởi Hành';
  public questText: string = 'Nhấn Bắt Đầu để xuất hiện tại khách sạn';
  public activePrompt: InteractionPrompt | null = null;

  // RPG Player Avatar State
  public player = {
    x: 480,
    y: 560,
    dir: 1, // 1 = right, -1 = left
    isWalking: false,
    walkCycle: 0,
    speed: 260, // px per sec
    targetX: null as number | null,
    targetY: null as number | null,
  };

  public moveInputState = { dx: 0, dz: 0 };
  public blastCountdown: number = 0;

  // Underground Mining State
  public hook: MiningHookState = {
    angle: 0,
    length: 50,
    state: 'SWINGING',
    attachedItem: null,
    dynamiteInFlight: false,
    dynamiteDist: 0,
  };

  private hookAngleDir: number = 1; // 1 = clockwise, -1 = counter
  private hookSwingSpeed: number = 1.35;
  private readonly hookMinAngle = -1.18; // ~-68 deg
  private readonly hookMaxAngle = 1.18; // ~+68 deg
  private readonly hookMinLength = 50;

  public undergroundItems: UndergroundItem[] = [];
  public vfxParticles: VFXParticle[] = [];

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

    // Create 720p HD Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = HD720Renderer.V_WIDTH;
    this.canvas.height = HD720Renderer.V_HEIGHT;
    this.canvas.style.display = 'block';
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.maxHeight = '100%';
    this.canvas.style.aspectRatio = '16 / 9';
    this.canvas.style.objectFit = 'contain';
    this.canvas.style.imageRendering = 'auto';
    this.container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    // Start on the Home Screen
    this.setZone('HOME');
    this.spawnLevelItems(1);

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);
  }

  // =========================================================================
  // ZONE & SCENE NAVIGATION
  // =========================================================================
  public setZone(zone: GameScreen): void {
    this.state = zone;

    if (zone === 'HOME') {
      this.currentZoneName = 'Sảnh Khởi Hành';
      this.questText = 'Nhấn Bắt Đầu để xuất hiện tại khách sạn';
      this.setMinerSpeech('👨‍🏭 "Chào mừng bạn đến với Đào Vàng HD! Nhấn Bắt Đầu để tới khách sạn."');
      this.player.x = 420;
      this.player.y = 550;
      this.player.dir = 1;
    } else if (zone === 'HOTEL') {
      this.currentZoneName = '🏨 Khách Sạn Thợ Mỏ';
      this.questText = 'Rời khách sạn để bước ra thị trấn';
      this.setMinerSpeech('👨‍🏭 "Chào buổi sáng! Hãy rời khách sạn ra thị trấn chuẩn bị đồ nghề."');
      this.player.x = 420;
      this.player.y = 550;
      this.player.dir = 1;
      this.player.targetX = null;
      this.player.targetY = null;
    } else if (zone === 'TOWN') {
      this.sound.playDoor();
      this.currentZoneName = '🏘️ Thị Trấn Thợ Mỏ Miền Tây';
      this.questText = 'Vào Cửa Hàng mua trang bị hoặc Đi bộ ra Mỏ Vàng';
      this.setMinerSpeech('👨‍🏭 "Thị trấn tấp nập! Ghé Cửa Hàng mua Thuốc Nổ rồi ra Mỏ Vàng nhé."');
      this.player.x = 1040;
      this.player.y = 480;
      this.player.dir = -1;
      this.player.targetX = null;
      this.player.targetY = null;
    } else if (zone === 'SHOP') {
      this.currentZoneName = '🏪 Cửa Hàng Vật Phẩm Thợ Mỏ';
      this.questText = 'Mua sắm trang bị cần thiết trước khi xuống mỏ';
      this.setMinerSpeech('🛍️ Chủ quán: "Cần Thuốc Nổ hay Nước Tăng Lực không bác thợ mỏ ơi?"');
    } else if (zone === 'MINE_EXTERIOR') {
      this.sound.playDoor();
      this.currentZoneName = '⛰️ Lối Vào Mỏ Vàng';
      this.questText = 'Tiến vào cửa hầm mỏ để vận hành máy đào';
      this.setMinerSpeech('👨‍🏭 "Đã tới cửa mỏ vàng! Tiến vào trong cửa hầm nào."');
      this.player.x = 280;
      this.player.y = 560;
      this.player.dir = 1;
      this.player.targetX = null;
      this.player.targetY = null;
    } else if (zone === 'MINING') {
      this.sound.playDoor();
      this.currentZoneName = `⛏️ Lòng Mỏ Vàng (Màn ${this.level})`;
      this.questText = `Đào vàng đạt chỉ tiêu $${this.targetScore.toLocaleString()}!`;
      this.setMinerSpeech('👨‍🏭 "Đã ngồi vào Máy Đào! Nhấn Chuột hoặc Space để phóng móc câu!"');
      this.resetHook();
      this.remainingTime = 60;
    } else if (zone === 'BLASTING') {
      this.currentZoneName = '💥 Khu Vực Phá Núi Mở Mỏ';
      this.questText = 'Chuẩn bị kích nổ thuốc nổ phá núi mở tầng mỏ mới!';
      this.blastCountdown = 3.2;
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
    if (dx !== 0 || dz !== 0) {
      this.player.targetX = null;
      this.player.targetY = null;
    }
  }

  // Handle pointer down on 720p virtual canvas
  public handlePointerDown(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = HD720Renderer.V_WIDTH / rect.width;
    const scaleY = HD720Renderer.V_HEIGHT / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (this.state === 'MINING') {
      if (e.button === 2) {
        this.tryUseDynamite();
      } else {
        this.launchHook();
      }
    } else if (
      this.state === 'HOTEL' ||
      this.state === 'TOWN' ||
      this.state === 'MINE_EXTERIOR'
    ) {
      // If prompt active and clicked, trigger it
      if (this.activePrompt) {
        this.interactCurrentPrompt();
      } else {
        // Set walk destination
        this.player.targetX = Math.max(100, Math.min(1180, clickX));
        this.player.targetY = Math.max(400, Math.min(660, clickY));
      }
    }
  }

  // =========================================================================
  // MINING ITEMS GENERATION
  // =========================================================================
  public spawnLevelItems(levelNum: number): void {
    this.undergroundItems = [];
    let seq = 1;

    const addItem = (
      type: ItemType,
      x: number,
      y: number,
      radius: number,
      baseValue: number,
      mass: number,
      isExplosive: boolean = false,
      explosionRadius?: number
    ) => {
      this.undergroundItems.push({
        id: seq++,
        type,
        x,
        y,
        radius,
        baseValue,
        mass,
        isExplosive,
        explosionRadius,
        rotation: (Math.random() - 0.5) * 0.4,
        isAttached: false,
      });
    };

    if (levelNum === 1) {
      addItem('GOLD_MEDIUM', 380, 360, 32, 250, 2.5);
      addItem('GOLD_SMALL', 520, 480, 18, 50, 1.0);
      addItem('GOLD_LARGE', 920, 520, 52, 500, 6.0);
      addItem('ROCK_SMALL', 740, 340, 22, 20, 3.0);
      addItem('ROCK_LARGE', 280, 580, 48, 45, 8.5);
      addItem('DIAMOND', 220, 300, 18, 600, 0.4);
      addItem('MYSTERY_BAG', 1050, 380, 26, 150, 1.5);
      addItem('TNT', 640, 540, 24, 1, 1.0, true, 180);
      addItem('GOLD_SMALL', 680, 640, 18, 50, 1.0);
    } else {
      const count = 9 + Math.min(7, levelNum * 2);
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
        const type = types[Math.floor(Math.random() * types.length)];
        const rx = 120 + Math.random() * 1040;
        const ry = 220 + Math.random() * 460;

        let r = 24;
        let val = 100;
        let mass = 2;
        let isExp = false;
        let expRad = undefined;

        if (type === 'GOLD_SMALL') {
          r = 18;
          val = 50;
          mass = 1.0;
        } else if (type === 'GOLD_MEDIUM') {
          r = 32;
          val = 250;
          mass = 2.5;
        } else if (type === 'GOLD_LARGE') {
          r = 52;
          val = 500;
          mass = 6.0;
        } else if (type === 'DIAMOND') {
          r = 18;
          val = 600;
          mass = 0.4;
        } else if (type === 'ROCK_SMALL') {
          r = 22;
          val = 20;
          mass = 3.2;
        } else if (type === 'ROCK_LARGE') {
          r = 48;
          val = 45;
          mass = 8.5;
        } else if (type === 'MYSTERY_BAG') {
          r = 26;
          val = 150;
          mass = 1.5;
        } else if (type === 'TNT') {
          r = 24;
          val = 1;
          mass = 1.0;
          isExp = true;
          expRad = 190;
        }

        addItem(type, rx, ry, r, val, mass, isExp, expRad);
      }
    }
  }

  // =========================================================================
  // HOOK PHYSICS & ARCADE CONTROLS
  // =========================================================================
  public launchHook(): void {
    if (this.state !== 'MINING') return;
    if (this.hook.state !== 'SWINGING') return;

    this.hook.state = 'EXTENDING';
    this.sound.playLaunch();
    this.emitState();
  }

  public resetHook(): void {
    this.hook.state = 'SWINGING';
    this.hook.length = this.hookMinLength;
    this.hook.attachedItem = null;
    this.hook.dynamiteInFlight = false;
    this.hook.dynamiteDist = 0;
  }

  public tryUseDynamite(): void {
    if (this.state !== 'MINING' || this.dynamiteCount <= 0) return;
    if (this.hook.state !== 'RETURNING' || !this.hook.attachedItem) return;
    if (this.hook.dynamiteInFlight) return;

    this.dynamiteCount--;
    this.hook.dynamiteInFlight = true;
    this.hook.dynamiteDist = 0;
    this.emitState();
  }

  private handleDynamiteExplosion(): void {
    if (!this.hook.attachedItem) return;

    const item = this.hook.attachedItem;
    const hx = 640 + Math.sin(this.hook.angle) * this.hook.length;
    const hy = 125 + Math.cos(this.hook.angle) * this.hook.length;

    // Spawn explosion VFX
    this.spawnExplosionVFX(hx, hy);
    this.sound.playExplosion();
    this.triggerShake(0.45, 18);

    // Remove item and free hook to return fast!
    const idx = this.undergroundItems.findIndex((it) => it.id === item.id);
    if (idx !== -1) this.undergroundItems.splice(idx, 1);

    this.hook.attachedItem = null;
    this.hook.dynamiteInFlight = false;
    this.setMinerSpeech('💣 "Đã ném Thuốc Nổ phá tan tảng đá nặng!"');
    this.emitState();
  }

  public triggerTNTExplosion(tntItem: UndergroundItem): void {
    this.spawnExplosionVFX(tntItem.x, tntItem.y);
    this.sound.playExplosion();
    this.triggerShake(0.65, 26);

    const idx = this.undergroundItems.findIndex((it) => it.id === tntItem.id);
    if (idx !== -1) this.undergroundItems.splice(idx, 1);

    const radius = tntItem.explosionRadius || 180;
    const victims = this.undergroundItems.filter((it) => {
      const dist = Math.hypot(it.x - tntItem.x, it.y - tntItem.y);
      return dist <= radius;
    });

    victims.forEach((victim) => {
      if (victim.isExplosive) {
        setTimeout(() => this.triggerTNTExplosion(victim), 140);
      } else {
        this.spawnRockDebrisVFX(victim.x, victim.y);
        const vIdx = this.undergroundItems.findIndex((it) => it.id === victim.id);
        if (vIdx !== -1) this.undergroundItems.splice(vIdx, 1);
      }
    });

    this.resetHook();
    this.emitState();
  }

  private handleItemScored(item: UndergroundItem): void {
    let reward = item.baseValue;
    let popupText = `+$${reward}`;
    let popupColor = '#fde047';

    if (item.type === 'MYSTERY_BAG') {
      const roll = Math.random();
      if (this.buffs.clover) {
        reward = Math.floor(500 + Math.random() * 450);
        popupText = `🍀 TÚI MAY MẮN +$${reward}`;
        popupColor = '#34d399';
      } else if (roll > 0.72) {
        this.dynamiteCount++;
        reward = 180;
        popupText = `🧨 +1 TNT & +$180`;
        popupColor = '#fb923c';
      } else {
        reward = Math.floor(80 + Math.random() * 620);
        popupText = `💰 TÚI BÍ ẨN +$${reward}`;
      }
    } else if (item.type === 'DIAMOND') {
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
    this.setMinerSpeech(`👨‍🏭 "Tuyệt vời! Kéo thành công, thu về +$${reward}!"`);
    this.emitFloatingPopup(640, 180, popupText, popupColor);

    // Remove scored item from list
    const idx = this.undergroundItems.findIndex((it) => it.id === item.id);
    if (idx !== -1) this.undergroundItems.splice(idx, 1);

    this.resetHook();
    this.emitState();

    if (this.undergroundItems.length === 0) {
      this.finishMiningLevel();
    }
  }

  public finishMiningLevel(): void {
    this.resetHook();
    const passed = this.walletGold >= this.targetScore;
    this.lastResultPassed = passed;
    this.buffs = { strength: false, clover: false, polish: false, magnet: false };

    if (passed) {
      // Transition to mountain blasting scene!
      this.setZone('BLASTING');
    } else {
      this.setMinerSpeech(
        '👨‍🏭 "Tiếc quá, chưa đủ chỉ tiêu! Hãy về khách sạn nghỉ ngơi và thử lại từ Màn 1."'
      );
      this.level = 1;
      this.walletGold = 500;
      this.targetScore = 1050;
      this.dynamiteCount = 2;
      this.spawnLevelItems(1);
      this.setZone('HOTEL');
    }

    this.emitState();
  }

  // =========================================================================
  // SHOP & SOUND
  // =========================================================================
  public buyItem(
    key: 'dynamite' | 'strength' | 'clover' | 'polish' | 'magnet',
    price: number
  ): boolean {
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

  public setMinerSpeech(text: string): void {
    this.minerSpeech = text;
    this.emitState();
  }

  public emitFloatingPopup(x: number, y: number, text: string, color: string = '#fde047'): void {
    if (!this.onFloatingPopup) return;
    const rect = this.canvas.getBoundingClientRect();
    const screenX = rect.left + (x / HD720Renderer.V_WIDTH) * rect.width;
    const screenY = rect.top + (y / HD720Renderer.V_HEIGHT) * rect.height;

    this.popupSeq++;
    this.onFloatingPopup({ id: this.popupSeq, text, color, x: screenX, y: screenY });
  }

  public triggerShake(duration: number, magnitude: number): void {
    this.shakeTime = duration;
    this.shakeMagnitude = magnitude;
  }

  // VFX generators
  public spawnExplosionVFX(x: number, y: number): void {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 260;
      this.vfxParticles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 14 + Math.random() * 22,
        color: ['#fde047', '#fb923c', '#ea580c', '#ef4444'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        type: 'fire',
      });
    }

    for (let s = 0; s < 18; s++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 180;
      this.vfxParticles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 30,
        size: 18 + Math.random() * 28,
        color: 'rgba(55, 65, 81, 0.75)',
        alpha: 0.8,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        type: 'smoke',
      });
    }
  }

  public spawnRockDebrisVFX(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 220;
      this.vfxParticles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 5 + Math.random() * 8,
        color: '#64748b',
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
        type: 'rock',
      });
    }
  }

  // =========================================================================
  // MAIN ANIMATION & UPDATE LOOP (60 FPS)
  // =========================================================================
  private animate(): void {
    this.animFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.elapsed += dt;

    // Update screen shake
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime < 0) this.shakeTime = 0;
    }

    // Update VFX
    for (let i = this.vfxParticles.length - 1; i >= 0; i--) {
      const p = this.vfxParticles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.vfxParticles.splice(i, 1);
      }
    }

    // =========================================================================
    // RPG PLAYER EXPLORATION MOVEMENT & PROMPT DETECTION
    // =========================================================================
    let detectedPrompt: InteractionPrompt | null = null;

    if (
      this.state === 'HOTEL' ||
      this.state === 'TOWN' ||
      this.state === 'MINE_EXTERIOR'
    ) {
      // 1. Keyboard WASD movement
      let moveX = this.moveInputState.dx;
      let moveY = -this.moveInputState.dz; // W is up (-y), S is down (+y)

      // 2. Click-to-move destination
      if (this.player.targetX !== null && this.player.targetY !== null) {
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 6) {
          moveX = dx / dist;
          moveY = dy / dist;
        } else {
          this.player.targetX = null;
          this.player.targetY = null;
        }
      }

      const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveY) > 0.05;
      this.player.isWalking = isMoving;

      if (isMoving) {
        this.player.x += moveX * this.player.speed * dt;
        this.player.y += moveY * this.player.speed * dt;
        this.player.walkCycle += dt * 10;
        if (moveX > 0.1) this.player.dir = 1;
        else if (moveX < -0.1) this.player.dir = -1;
      } else {
        this.player.walkCycle = 0;
      }

      // Constrain player within walkable zone bounds
      if (this.state === 'HOTEL') {
        this.player.x = Math.max(120, Math.min(1080, this.player.x));
        this.player.y = Math.max(450, Math.min(680, this.player.y));

        // Distance to exit door (1040, 460)
        if (this.player.x > 940) {
          detectedPrompt = {
            actionKey: 'E',
            title: 'Bước Ra Thị Trấn',
            description: 'Rời khách sạn để tiến vào phố thị trấn miền Tây',
            onTrigger: () => this.setZone('TOWN'),
          };
        }
      } else if (this.state === 'TOWN') {
        this.player.x = Math.max(80, Math.min(1200, this.player.x));
        this.player.y = Math.max(400, Math.min(680, this.player.y));

        // 1. Near General Store (left building: x < 320, y < 480)
        if (this.player.x < 320 && this.player.y < 480) {
          detectedPrompt = {
            actionKey: 'E',
            title: 'Vào Cửa Hàng Trang Bị',
            description: 'Ghé tiệm mua Thuốc Nổ TNT, Nước Tăng Lực và Cỏ May Mắn',
            onTrigger: () => this.setZone('SHOP'),
          };
        }
        // 2. Near Mountain Mine Road (center-north: x between 520 and 760, y < 440)
        else if (this.player.x >= 500 && this.player.x <= 780 && this.player.y < 440) {
          detectedPrompt = {
            actionKey: 'E',
            title: 'Đi Bộ Ra Mỏ Vàng',
            description: 'Rời thị trấn theo lối mòn leo lên hầm mỏ trên núi',
            onTrigger: () => this.setZone('MINE_EXTERIOR'),
          };
        }
        // 3. Near Hotel (right building: x > 960, y < 480)
        else if (this.player.x > 960 && this.player.y < 480) {
          detectedPrompt = {
            actionKey: 'E',
            title: 'Trở Lại Khách Sạn',
            description: 'Vào lại phòng nghỉ ấm cúng của khách sạn thợ mỏ',
            onTrigger: () => this.setZone('HOTEL'),
          };
        }
      } else if (this.state === 'MINE_EXTERIOR') {
        this.player.x = Math.max(120, Math.min(1160, this.player.x));
        this.player.y = Math.max(420, Math.min(680, this.player.y));

        // 1. Near Cave Portal (center: x between 480 and 800, y < 450)
        if (this.player.x >= 480 && this.player.x <= 800 && this.player.y < 450) {
          detectedPrompt = {
            actionKey: 'E',
            title: 'Vào Hầm Mỏ Vận Hành Máy Đào',
            description: 'Tiến vào lòng núi và bắt đầu kéo vàng',
            onTrigger: () => this.setZone('MINING'),
          };
        }
        // 2. Near Road Back to Town (left: x < 240, y > 540)
        else if (this.player.x < 240 && this.player.y > 540) {
          detectedPrompt = {
            actionKey: 'E',
            title: 'Quay Về Thị Trấn',
            description: 'Đi ngược lại con đường về thị trấn',
            onTrigger: () => this.setZone('TOWN'),
          };
        }
      }
    } else if (this.state === 'MINING') {
      // Countdown Timer
      this.remainingTime -= dt;
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.finishMiningLevel();
        return;
      }

      // =========================================================================
      // ARCADE HOOK PHYSICS (SWINGING, EXTENDING, RETURNING)
      // =========================================================================
      if (this.hook.state === 'SWINGING') {
        this.hook.angle += this.hookAngleDir * this.hookSwingSpeed * dt;
        if (this.hook.angle >= this.hookMaxAngle) {
          this.hook.angle = this.hookMaxAngle;
          this.hookAngleDir = -1;
        } else if (this.hook.angle <= this.hookMinAngle) {
          this.hook.angle = this.hookMinAngle;
          this.hookAngleDir = 1;
        }
      } else if (this.hook.state === 'EXTENDING') {
        const extendSpeed = 440; // px / sec
        this.hook.length += extendSpeed * dt;

        const hx = 640 + Math.sin(this.hook.angle) * this.hook.length;
        const hy = 125 + Math.cos(this.hook.angle) * this.hook.length;

        // Check screen boundaries
        if (hx < 20 || hx > 1260 || hy > 710) {
          this.hook.state = 'RETURNING';
        }

        // Check collision with underground items
        for (let i = 0; i < this.undergroundItems.length; i++) {
          const item = this.undergroundItems[i];
          const dist = Math.hypot(hx - item.x, hy - item.y);
          if (dist <= item.radius + 14) {
            // HIT!
            if (item.isExplosive) {
              this.triggerTNTExplosion(item);
              return;
            } else {
              this.hook.attachedItem = item;
              item.isAttached = true;
              this.hook.state = 'RETURNING';
              this.sound.playHit();
              this.setMinerSpeech(
                `👨‍🏭 "Đã tóm được ${item.type.replace('_', ' ')}! Đang kéo lên..."`
              );
              break;
            }
          }
        }
      } else if (this.hook.state === 'RETURNING') {
        // Base return speed
        let returnSpeed = 360; // px / sec

        if (this.hook.attachedItem) {
          const mass = this.hook.attachedItem.mass;
          const strengthFactor = this.buffs.strength ? 0.45 : 1.0;
          returnSpeed = Math.max(55, returnSpeed / (1 + (mass - 1) * 0.75 * strengthFactor));
        }

        this.hook.length -= returnSpeed * dt;

        // Sound ticking
        this.sound.playWinchTick(returnSpeed / 360);

        // Dynamite in flight
        if (this.hook.dynamiteInFlight) {
          this.hook.dynamiteDist += 680 * dt;
          if (this.hook.dynamiteDist >= this.hook.length) {
            this.handleDynamiteExplosion();
          }
        }

        if (this.hook.length <= this.hookMinLength) {
          // Reached cart!
          this.hook.length = this.hookMinLength;
          if (this.hook.attachedItem) {
            this.handleItemScored(this.hook.attachedItem);
          } else {
            this.resetHook();
          }
        }
      }
    } else if (this.state === 'BLASTING') {
      this.blastCountdown -= dt;
      if (this.blastCountdown <= 0 && this.blastCountdown > -10) {
        this.blastCountdown = -99; // trigger once
        this.spawnExplosionVFX(640, 340);
        this.spawnRockDebrisVFX(500, 340);
        this.spawnRockDebrisVFX(780, 340);
        this.sound.playExplosion();
        this.triggerShake(0.85, 32);

        // Advance to next mine level!
        this.level++;
        this.targetScore = Math.floor(this.walletGold + 650 + this.level * 250);
        this.spawnLevelItems(this.level);
        this.setMinerSpeech(
          `🎉 "ĐÃ PHÁ NÚI THÀNH CÔNG! Phát hiện mỏ vàng Màn ${this.level} phong phú hơn!"`
        );
      }
    }

    if (this.activePrompt !== detectedPrompt) {
      this.activePrompt = detectedPrompt;
      this.emitState();
    }

    // =========================================================================
    // RENDER SCENE VIA HD720Renderer
    // =========================================================================
    this.ctx.save();

    // Screen Shake Offset
    if (this.shakeTime > 0) {
      const sx = (Math.random() - 0.5) * this.shakeMagnitude;
      const sy = (Math.random() - 0.5) * this.shakeMagnitude;
      this.ctx.translate(sx, sy);
    }

    const rc: RenderContext = {
      ctx: this.ctx,
      width: HD720Renderer.V_WIDTH,
      height: HD720Renderer.V_HEIGHT,
      elapsed: this.elapsed,
      dt,
    };

    if (this.state === 'HOTEL' || this.state === 'HOME') {
      HD720Renderer.renderHotel(rc, this.player, this.vfxParticles);
    } else if (this.state === 'TOWN' || this.state === 'SHOP') {
      HD720Renderer.renderTown(rc, this.player, this.vfxParticles);
    } else if (this.state === 'MINE_EXTERIOR') {
      HD720Renderer.renderMineExterior(rc, this.player, this.vfxParticles);
    } else if (this.state === 'MINING') {
      HD720Renderer.renderMining(
        rc,
        this.hook,
        this.undergroundItems,
        this.vfxParticles,
        this.level
      );
    } else if (this.state === 'BLASTING') {
      HD720Renderer.renderBlasting(rc, this.blastCountdown, this.vfxParticles, this.level);
    }

    this.ctx.restore();
  }

  public resize(width: number, height: number): void {
    // 720p virtual canvas is kept intact (1280x720) and styled via CSS object-fit: contain
  }

  public emitState(): void {
    if (!this.onStateChange) return;

    const canUseDyn =
      this.state === 'MINING' &&
      this.dynamiteCount > 0 &&
      this.hook.state === 'RETURNING' &&
      this.hook.attachedItem !== null &&
      !this.hook.dynamiteInFlight;

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

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}
