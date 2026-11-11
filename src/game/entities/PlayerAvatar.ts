import * as THREE from 'three';
import { MinerCharacter3D } from './MinerCharacter3D';

/**
 * PlayerAvatar - Controls the 3D Miner character in the adventure world (Hotel, Town, Mine).
 * Handles movement, rotation, walking animations, and collision bounding.
 */
export class PlayerAvatar {
  public root: THREE.Group;
  public minerModel: MinerCharacter3D;
  public position: THREE.Vector3 = new THREE.Vector3();
  public targetPosition: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public speed: number = 7.5;
  public isMoving: boolean = false;
  private walkTime: number = 0;

  constructor(scene: THREE.Scene) {
    this.root = new THREE.Group();
    scene.add(this.root);

    // Instantiate the high-poly 3D Miner model inside the avatar root
    this.minerModel = new MinerCharacter3D(this.root as unknown as THREE.Scene, new THREE.Vector3(0, 0, 0));
  }

  public setPosition(x: number, y: number, z: number, rotationY: number = 0): void {
    this.position.set(x, y, z);
    this.targetPosition.copy(this.position);
    this.root.position.copy(this.position);
    this.root.rotation.y = rotationY;
    this.velocity.set(0, 0, 0);
    this.isMoving = false;
  }

  public moveTo(x: number, z: number): void {
    this.targetPosition.set(x, this.position.y, z);
  }

  public moveInput(dx: number, dz: number, dt: number, bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
      this.isMoving = true;
      const angle = Math.atan2(dx, dz);
      this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, angle, dt * 14);

      const moveVec = new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(this.speed * dt);
      this.position.add(moveVec);

      if (bounds) {
        this.position.x = THREE.MathUtils.clamp(this.position.x, bounds.minX, bounds.maxX);
        this.position.z = THREE.MathUtils.clamp(this.position.z, bounds.minZ, bounds.maxZ);
      }

      this.targetPosition.copy(this.position);
    } else {
      this.isMoving = false;
    }
  }

  public update(dt: number, elapsed: number): void {
    // Smooth click-to-move interpolation
    if (this.position.distanceTo(this.targetPosition) > 0.15) {
      this.isMoving = true;
      const dir = this.targetPosition.clone().sub(this.position).normalize();
      this.root.rotation.y = Math.atan2(dir.x, dir.z);
      this.position.add(dir.multiplyScalar(this.speed * dt));
    }

    this.root.position.copy(this.position);

    // Walking body bobbing animation
    if (this.isMoving) {
      this.walkTime += dt * 12;
      this.root.position.y = this.position.y + Math.abs(Math.sin(this.walkTime)) * 0.12;
      this.root.rotation.z = Math.sin(this.walkTime) * 0.06;
      this.minerModel.update(dt, elapsed, 'SWINGING', Math.sin(this.walkTime) * 0.25, null, 1.0);
    } else {
      this.root.position.y = this.position.y;
      this.root.rotation.z = 0;
      this.minerModel.update(dt, elapsed, 'SWINGING', 0, null, 1.0);
    }
  }
}

