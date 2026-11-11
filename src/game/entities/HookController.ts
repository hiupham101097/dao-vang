import * as THREE from 'three';
import { ActiveBuffs } from '../types';
import { SoundEngine } from '../audio/SoundEngine';
import { VFXPoolManager } from '../gfx/VFXPoolManager';
import { CameraDirector } from '../gfx/CameraDirector';
import { MinerCharacter3D } from './MinerCharacter3D';

export class HookController {
  private scene: THREE.Scene;
  private vfxPool: VFXPoolManager;
  private cameraDirector: CameraDirector;
  private sound: SoundEngine;
  private miner: MinerCharacter3D;
  private onItemRetrieved: (item: THREE.Group) => void;

  public pivotPos: THREE.Vector3 = new THREE.Vector3(0, 3.3, 0);
  public maxSwingAngle: number = THREE.MathUtils.degToRad(65);
  public swingFrequency: number = 1.65;
  public baseLaunchSpeed: number = 14.5;
  public baseReturnSpeed: number = 12.0;
  public maxReachDistance: number = 13.2;
  public restLength: number = 1.15;

  public state: 'SWINGING' | 'LAUNCHING' | 'RETURNING' = 'SWINGING';
  public swingTime: number = 0;
  public currentAngle: number = 0;
  public currentLength: number = 1.15;
  public attachedItem: THREE.Group | null = null;
  public dynamiteProjectile: { mesh: THREE.Group; progress: number } | null = null;

  public cartGroup!: THREE.Group;
  public winchDrum!: THREE.Mesh;
  public winchGear!: THREE.Group;
  public pivotGroup!: THREE.Group;
  public cableMesh!: THREE.Mesh;
  public hookHead!: THREE.Group;
  private claws: THREE.Group[] = [];
  private clawOpenAngle: number = 0.22;
  private targetClawAngle: number = 0.22;

  constructor(
    scene: THREE.Scene,
    vfxPool: VFXPoolManager,
    cameraDirector: CameraDirector,
    sound: SoundEngine,
    minerCharacter: MinerCharacter3D,
    onItemRetrieved: (item: THREE.Group) => void
  ) {
    this.scene = scene;
    this.vfxPool = vfxPool;
    this.cameraDirector = cameraDirector;
    this.sound = sound;
    this.miner = minerCharacter;
    this.onItemRetrieved = onItemRetrieved;

    this.buildWinchCartAndHook();
  }

  private buildWinchCartAndHook(): void {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.28 });
    const goldBrassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.18 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x613612, roughness: 0.7 });
    const clawTipMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
    });

    // 1. Heavy Industrial Timber Minecart Platform (y = 3.6)
    this.cartGroup = new THREE.Group();
    this.cartGroup.position.set(0, 3.6, 0);
    this.scene.add(this.cartGroup);

    // Sturdy wooden chassis
    const cartDeck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.42, 2.5), woodMat);
    cartDeck.position.set(0, 0.21, -0.35);
    cartDeck.castShadow = true;
    this.cartGroup.add(cartDeck);

    // Brass & Steel Trim plates with bolts
    const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.16, 0.08), goldBrassMat);
    frontTrim.position.set(0, 0.21, 0.9);
    this.cartGroup.add(frontTrim);

    // 4 Heavy Cast Iron Spoked Wheels
    [-1.6, 1.6].forEach((xOff) => {
      [-1.1, 0.4].forEach((zOff) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(xOff, 0.02, zOff);

        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 24), darkIronMat);
        tire.rotation.z = Math.PI / 2;
        wheelGroup.add(tire);

        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 16), goldBrassMat);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);

        this.cartGroup.add(wheelGroup);
      });
    });

    // A-Frame Steel Crane Boom with reinforced struts
    [-0.65, 0.65].forEach((xOff) => {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.45, 12), darkIronMat);
      strut.position.set(xOff * 0.65, 0.26, -0.12);
      strut.rotation.x = 0.65;
      strut.rotation.z = xOff < 0 ? -0.25 : 0.25;
      this.cartGroup.add(strut);
    });

    // Massive Industrial Cable Winch Drum
    const drumGeom = new THREE.CylinderGeometry(0.55, 0.55, 1.65, 24);
    drumGeom.rotateZ(Math.PI / 2);
    this.winchDrum = new THREE.Mesh(drumGeom, darkIronMat);
    this.winchDrum.position.set(0, 0.72, 0.08);
    this.cartGroup.add(this.winchDrum);

    // Cable coils wrapped around the drum
    for (let c = -0.65; c <= 0.65; c += 0.22) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.065, 8, 24), steelMat);
      coil.rotation.y = Math.PI / 2;
      coil.position.set(c, 0.72, 0.08);
      this.cartGroup.add(coil);
    }

    // Interlocking Giant Brass Gear Wheel & Crank Handle
    this.winchGear = new THREE.Group();
    this.winchGear.position.set(0.98, 0.72, 0.08);

    const gearRim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 12, 32), goldBrassMat);
    gearRim.rotation.y = Math.PI / 2;
    this.winchGear.add(gearRim);

    // 16 Gear Cog Teeth around the circumference
    for (let g = 0; g < 16; g++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), goldBrassMat);
      const angle = (g * Math.PI * 2) / 16;
      tooth.position.set(0, Math.sin(angle) * 0.76, Math.cos(angle) * 0.76);
      tooth.rotation.x = -angle;
      this.winchGear.add(tooth);
    }

    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.4, 8), steelMat);
      spoke.rotation.x = (s * Math.PI) / 6;
      this.winchGear.add(spoke);
    }

    // Crank handle peg
    const crankPin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12), steelMat);
    crankPin.rotation.z = Math.PI / 2;
    crankPin.position.set(0.18, 0.5, 0);
    this.winchGear.add(crankPin);

    this.cartGroup.add(this.winchGear);

    // 2. Rotating Hook Pivot at Pulley Wheel (0, 3.3, 0)
    this.pivotGroup = new THREE.Group();
    this.pivotGroup.position.copy(this.pivotPos);
    this.scene.add(this.pivotGroup);

    // Pulley Sheave Wheel
    const pulleyWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24), goldBrassMat);
    pulleyWheel.rotation.x = Math.PI / 2;
    this.pivotGroup.add(pulleyWheel);

    // Gleaming High-Visibility Steel Cable
    const cableGeom = new THREE.CylinderGeometry(0.065, 0.065, 1, 10);
    cableGeom.translate(0, -0.5, 0);
    this.cableMesh = new THREE.Mesh(cableGeom, steelMat);
    this.pivotGroup.add(this.cableMesh);

    // 3. 3D Titanium Mechanical Hook Head & 3 Articulated Claws
    this.hookHead = new THREE.Group();
    this.hookHead.position.set(0, -this.restLength, 0);
    this.pivotGroup.add(this.hookHead);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.5, 20), goldBrassMat);
    this.hookHead.add(collar);

    for (let i = 0; i < 3; i++) {
      const clawMount = new THREE.Group();
      clawMount.rotation.y = (i * Math.PI * 2) / 3;

      const clawPivot = new THREE.Group();
      clawPivot.position.set(0.22, -0.18, 0);
      clawMount.add(clawPivot);

      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.16), steelMat);
      upperArm.position.set(0.1, -0.26, 0);
      upperArm.rotation.z = -0.35;
      clawPivot.add(upperArm);

      // Glowing High-Contrast Claw Tip
      const clawTip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 4), clawTipMat);
      clawTip.position.set(0.28, -0.5, 0);
      clawTip.rotation.z = -1.45;
      clawPivot.add(clawTip);

      this.hookHead.add(clawMount);
      this.claws.push(clawPivot);
    }
  }

  public launch(hasMagnet: boolean = false): boolean {
    if (this.state !== 'SWINGING') return false;
    this.state = 'LAUNCHING';
    this.sound.playLaunch();
    this.targetClawAngle = 0.55; // Open claws wide during launch
    return true;
  }

  public resetHook(): void {
    this.state = 'SWINGING';
    this.currentLength = this.restLength;
    this.targetClawAngle = 0.22;
    if (this.attachedItem) {
      this.scene.remove(this.attachedItem);
      this.attachedItem = null;
    }
    this.cableMesh.scale.set(1, this.currentLength, 1);
    this.hookHead.position.set(0, -this.currentLength, 0);
    this.cameraDirector.setStrainZoom(0);
  }

  public getHookTipWorldPos(): THREE.Vector3 {
    const tip = new THREE.Vector3(0, -this.currentLength - 0.45, 0);
    tip.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.currentAngle);
    return tip.add(this.pivotPos);
  }

  public throwDynamiteOnAttachedItem(): boolean {
    if (this.state !== 'RETURNING' || !this.attachedItem || this.dynamiteProjectile) {
      return false;
    }

    const tntGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12);
    const tntMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const dynMesh = new THREE.Mesh(tntGeom, tntMat);
    const dynGroup = new THREE.Group();
    dynGroup.add(dynMesh);
    dynGroup.position.copy(this.pivotPos);
    this.scene.add(dynGroup);

    this.dynamiteProjectile = {
      mesh: dynGroup,
      progress: 0,
    };
    return true;
  }

  public update(
    dt: number,
    elapsed: number,
    worldItems: THREE.Group[],
    buffs: ActiveBuffs,
    onExplodeItem: (item: THREE.Group) => void,
    onMinerSpeech: (msg: string) => void
  ): void {
    // Smooth animated claw opening/closing
    this.clawOpenAngle = THREE.MathUtils.lerp(this.clawOpenAngle, this.targetClawAngle, dt * 14);
    this.claws.forEach((claw) => {
      claw.rotation.z = this.clawOpenAngle;
    });

    // Animate dynamite projectile along the cable
    if (this.dynamiteProjectile) {
      this.dynamiteProjectile.progress += dt * 4.5;
      const startP = this.pivotPos;
      const endP = this.getHookTipWorldPos();
      this.dynamiteProjectile.mesh.position.lerpVectors(startP, endP, Math.min(1, this.dynamiteProjectile.progress));
      this.dynamiteProjectile.mesh.rotation.z += dt * 18;

      if (this.dynamiteProjectile.progress >= 1) {
        this.vfxPool.spawnVFX('TNTExplosion', endP);
        this.sound.playExplosion();
        this.cameraDirector.triggerShake(0.65, 0.45);
        this.scene.remove(this.dynamiteProjectile.mesh);
        this.dynamiteProjectile = null;

        if (this.attachedItem) {
          onMinerSpeech('💥 Thuốc Nổ: Đã phá nát chướng ngại vật!');
          this.scene.remove(this.attachedItem);
          this.attachedItem = null;
          this.cameraDirector.setStrainZoom(0);
        }
      }
    }

    if (this.state === 'SWINGING') {
      this.swingTime += dt * this.swingFrequency;
      this.currentAngle = Math.sin(this.swingTime) * this.maxSwingAngle;
      this.pivotGroup.rotation.z = this.currentAngle;

      this.currentLength = this.restLength;
      this.cableMesh.scale.set(1, this.currentLength, 1);
      this.hookHead.position.set(0, -this.currentLength, 0);

      this.miner.update(dt, elapsed, this.state, this.currentAngle, null, 1.0);
    } else if (this.state === 'LAUNCHING') {
      const launchSpeed = buffs.magnet ? this.baseLaunchSpeed * 1.25 : this.baseLaunchSpeed;
      this.currentLength += launchSpeed * dt;
      this.cableMesh.scale.set(1, this.currentLength, 1);
      this.hookHead.position.set(0, -this.currentLength, 0);

      // Rotate winch drum
      this.winchDrum.rotation.x += launchSpeed * dt * 2;
      this.winchGear.rotation.x += launchSpeed * dt * 2;

      const hookPos = this.getHookTipWorldPos();
      const magnetBonus = buffs.magnet ? 0.35 : 0;

      // Check collision with underground items
      for (let i = 0; i < worldItems.length; i++) {
        const item = worldItems[i];
        const dist = hookPos.distanceTo(item.position);
        const radiusCheck = item.userData.colliderRadius + 0.32 + magnetBonus;

        if (dist <= radiusCheck) {
          // Attached to item!
          this.attachedItem = item;
          worldItems.splice(i, 1);
          this.state = 'RETURNING';
          this.targetClawAngle = -0.15; // Clench claws tightly around the mineral

          if (item.userData.isExplosive) {
            onExplodeItem(item);
            this.scene.remove(item);
            this.attachedItem = null;
            this.resetHook();
            return;
          }

          const isHighVal = item.userData.type === 'DIAMOND' || item.userData.type === 'GOLD_LARGE';
          this.sound.playHit(isHighVal);
          this.vfxPool.spawnVFX('ImpactSparks', hookPos);
          this.cameraDirector.triggerShake(0.2, 0.2);

          // Update Miner speech
          onMinerSpeech(`⛏️ Đã gắp: ${item.userData.name}! Đang kéo lên...`);
          break;
        }
      }

      // Reached boundary: automatically return empty
      if (this.currentLength >= this.maxReachDistance) {
        this.state = 'RETURNING';
        this.targetClawAngle = 0.22;
      }

      this.miner.update(dt, elapsed, this.state, this.currentAngle, null, 1.0);
    } else if (this.state === 'RETURNING') {
      let speed = this.baseReturnSpeed;
      let massRatio = 1.0;

      if (this.attachedItem) {
        const mass = this.attachedItem.userData.mass || 1.0;
        const strengthMultiplier = buffs.strength ? 1.85 : 1.0;
        speed = Math.max(2.2, (this.baseReturnSpeed / Math.pow(mass, 0.85)) * strengthMultiplier);
        massRatio = speed / this.baseReturnSpeed;
        this.cameraDirector.setStrainZoom(Math.min(1.0, (mass - 1) / 4));
      } else {
        this.cameraDirector.setStrainZoom(0);
      }

      this.currentLength -= speed * dt;
      this.sound.playWinchTick(massRatio);

      // Rotate winch drum & crank in reverse
      this.winchDrum.rotation.x -= speed * dt * 2.2;
      this.winchGear.rotation.x -= speed * dt * 2.2;

      if (this.currentLength <= this.restLength) {
        this.currentLength = this.restLength;
        this.state = 'SWINGING';
        this.targetClawAngle = 0.22;

        if (this.attachedItem) {
          const itemScored = this.attachedItem;
          this.attachedItem = null;
          this.scene.remove(itemScored);
          this.onItemRetrieved(itemScored);
        }
      }

      this.cableMesh.scale.set(1, this.currentLength, 1);
      this.hookHead.position.set(0, -this.currentLength, 0);

      if (this.attachedItem) {
        this.attachedItem.position.copy(this.getHookTipWorldPos());
      }

      this.miner.update(dt, elapsed, this.state, this.currentAngle, this.attachedItem, massRatio);
    }
  }
}

