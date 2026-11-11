import * as THREE from 'three';
import { GameScreen } from '../types';

/**
 * CameraDirector - Manages framing, smooth transitions,
 * and rock-solid gameplay stability without disorienting auto-zooms.
 */
export class CameraDirector {
  public camera: THREE.PerspectiveCamera;
  public mode: GameScreen = 'HOME';

  private currentPos: THREE.Vector3 = new THREE.Vector3(0, 3.8, 9.2);
  private currentLook: THREE.Vector3 = new THREE.Vector3(0, 3.4, 0);

  private targetPos: THREE.Vector3 = new THREE.Vector3();
  private targetLook: THREE.Vector3 = new THREE.Vector3();
  private targetFov: number = 50;

  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.setMode('HOME');
  }

  public setMode(mode: GameScreen): void {
    this.mode = mode;
    this.updateTargetFraming();
  }

  public updateTargetFraming(): void {
    const aspect = this.camera.aspect || 1.6;

    if (this.mode === 'HOME' || this.mode === 'SHOP') {
      // Showcase view: close and warm on the 3D Miner, machine, and glowing lanterns
      this.targetPos.set(0, 3.6, 9.0);
      this.targetLook.set(0, 3.4, 0);
      this.targetFov = 44;
    } else {
      // Gameplay view: Perfect arcade framing!
      // Miner's helmet (y=5.6) has clean headroom at top; deepest items (y=-7.6) fit comfortably.
      const baseHeight = 14.8;
      const baseFovRad = THREE.MathUtils.degToRad(52);
      const halfTan = Math.tan(baseFovRad / 2);

      let requiredZ = baseHeight / (2 * halfTan); // ~15.2
      // For narrow mobile portrait screens (aspect < 0.9), ensure horizontal width fits
      const requiredWidth = 13.5;
      const zForWidth = requiredWidth / (2 * halfTan * aspect);
      requiredZ = Math.max(requiredZ, zForWidth);

      this.targetPos.set(0, -1.0, requiredZ);
      this.targetLook.set(0, -1.0, 0);
      this.targetFov = 52;
    }
  }

  public triggerShake(intensity: number = 0.25, duration: number = 0.2): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  // Left stable so aiming hook is accurate and enjoyable
  public setStrainZoom(_heavyFactor: number): void {}

  public update(dt: number): void {
    // Smooth transition
    this.currentPos.lerp(this.targetPos, dt * 5.0);
    this.currentLook.lerp(this.targetLook, dt * 5.0);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, dt * 4.0);
    this.camera.updateProjectionMatrix();

    // Micro impact bump on explosion, zero drift
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = Math.max(0, this.shakeTimer / 0.2);
      const cur = this.shakeIntensity * decay;

      const ox = (Math.random() - 0.5) * cur;
      const oy = (Math.random() - 0.5) * cur;

      this.camera.position.set(this.currentPos.x + ox, this.currentPos.y + oy, this.currentPos.z);
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    } else {
      this.camera.position.copy(this.currentPos);
    }

    this.camera.lookAt(this.currentLook);
  }
}
