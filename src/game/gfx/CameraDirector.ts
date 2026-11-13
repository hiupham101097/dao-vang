import * as THREE from 'three';
import { GameScreen } from '../types';

export class CameraDirector {
  public camera: THREE.PerspectiveCamera;
  public mode: GameScreen = 'HOME';
  private currentPos: THREE.Vector3 = new THREE.Vector3(0, 4.4, 9.5);
  private currentLook: THREE.Vector3 = new THREE.Vector3(0, 4.0, 0);

  private targetPos: THREE.Vector3 = new THREE.Vector3();
  private targetLook: THREE.Vector3 = new THREE.Vector3();
  private targetFov: number = 40;

  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;
  private strainOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.setMode('HOME');
  }

  public setMode(mode: GameScreen): void {
    this.mode = mode;
    if (mode === 'HOME' || mode === 'SHOP') {
      // Zoomed in comfortably on the 3D Miner and Winch Cart
      this.targetPos.set(0, 4.25, 6.2);
      this.targetLook.set(0, 4.0, 0);
      this.targetFov = 38;
    } else {
      // Full Mine cross-section view: Miner at top (y=3.6..6.0) + underground floor (y=-8..-1)
      this.targetPos.set(0, -0.65, 17.8);
      this.targetLook.set(0, -1.8, 0);
      this.targetFov = 48;
    }
  }

  public triggerShake(intensity: number = 0.45, duration: number = 0.35): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  public setStrainZoom(heavyFactor: number): void {
    this.strainOffset.set(0, 0, -heavyFactor * 1.2);
  }

  public update(dt: number): void {
    // Smooth camera damping transition
    this.currentPos.lerp(this.targetPos.clone().add(this.strainOffset), dt * 4.2);
    this.currentLook.lerp(this.targetLook, dt * 4.2);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, dt * 3.5);
    this.camera.updateProjectionMatrix();

    // Camera screen shake calculation
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = Math.max(0, this.shakeTimer);
      const curIntensity = this.shakeIntensity * (decay / 0.35);

      const ox = (Math.random() - 0.5) * curIntensity;
      const oy = (Math.random() - 0.5) * curIntensity;
      const oz = (Math.random() - 0.5) * curIntensity * 0.5;

      this.camera.position.set(this.currentPos.x + ox, this.currentPos.y + oy, this.currentPos.z + oz);
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    } else {
      this.camera.position.copy(this.currentPos);
    }

    this.camera.lookAt(this.currentLook);
  }
}

