import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  velocity: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
}

interface Shockwave {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  life: number;
  maxLife: number;
  maxRadius: number;
}

export type VFXType = 'ImpactSparks' | 'DustCloud' | 'RockDebris' | 'TNTExplosion';

export class VFXPoolManager {
  private scene: THREE.Scene;
  private particlePool: Particle[] = [];
  private activeParticles: Particle[] = [];
  private shockwavePool: Shockwave[] = [];
  private activeShockwaves: Shockwave[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPools();
  }

  private initPools(): void {
    const pGeom = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (let i = 0; i < 90; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffa500,
        roughness: 0.3,
        emissive: 0xff3300,
        emissiveIntensity: 0.8,
      });
      const mesh = new THREE.Mesh(pGeom, mat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.particlePool.push({
        mesh,
        velocity: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        gravity: 12.0,
      });
    }

    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.9, 32),
        new THREE.MeshBasicMaterial({
          color: 0xff9900,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
        })
      );
      ring.visible = false;
      this.scene.add(ring);
      this.shockwavePool.push({ mesh: ring, life: 0, maxLife: 0.45, maxRadius: 5.8 });
    }
  }

  public spawnVFX(type: VFXType, position: THREE.Vector3): void {
    let count = 16,
      speed = 6.5,
      colorHex = 0xffe066,
      emissiveHex = 0xff8800,
      scale = 1.0;

    if (type === 'ImpactSparks') {
      count = 14;
      speed = 8.0;
      colorHex = 0xfff3b0;
      emissiveHex = 0xf59e0b;
      scale = 0.8;
    } else if (type === 'DustCloud') {
      count = 10;
      speed = 3.5;
      colorHex = 0x78716c;
      emissiveHex = 0x1c1917;
      scale = 1.3;
    } else if (type === 'RockDebris') {
      count = 18;
      speed = 9.0;
      colorHex = 0x57534e;
      emissiveHex = 0x292524;
      scale = 1.4;
    } else if (type === 'TNTExplosion') {
      count = 36;
      speed = 15.5;
      colorHex = 0xff6600;
      emissiveHex = 0xff2200;
      scale = 1.8;
      this.spawnShockwave(position);
    }

    for (let i = 0; i < count; i++) {
      if (this.particlePool.length === 0) break;
      const p = this.particlePool.pop()!;
      p.mesh.visible = true;
      p.mesh.position.copy(position);
      p.mesh.scale.setScalar(scale * (0.6 + Math.random() * 0.7));
      p.mesh.material.color.setHex(colorHex);
      p.mesh.material.emissive.setHex(emissiveHex);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = speed * (0.4 + Math.random() * 0.8);
      p.velocity.set(
        Math.sin(phi) * Math.cos(theta) * spd,
        Math.cos(phi) * spd + 2.5,
        Math.sin(phi) * Math.sin(theta) * spd * 0.5
      );
      p.rotVel.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      p.maxLife = 0.45 + Math.random() * 0.45;
      p.life = p.maxLife;
      this.activeParticles.push(p);
    }
  }

  public spawnShockwave(position: THREE.Vector3): void {
    if (this.shockwavePool.length === 0) return;
    const sw = this.shockwavePool.pop()!;
    sw.mesh.visible = true;
    sw.mesh.position.copy(position);
    sw.mesh.position.z += 0.5;
    sw.mesh.scale.setScalar(0.2);
    sw.mesh.material.opacity = 0.95;
    sw.life = sw.maxLife;
    this.activeShockwaves.push(sw);
  }

  public update(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        this.activeParticles.splice(i, 1);
        this.particlePool.push(p);
        continue;
      }
      p.velocity.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += p.rotVel.x * dt;
      p.mesh.rotation.y += p.rotVel.y * dt;
    }

    for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.activeShockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        sw.mesh.visible = false;
        this.activeShockwaves.splice(i, 1);
        this.shockwavePool.push(sw);
        continue;
      }
      const progress = 1 - sw.life / sw.maxLife;
      sw.mesh.scale.setScalar(0.5 + progress * sw.maxRadius);
      sw.mesh.material.opacity = (1 - progress) * 0.9;
    }
  }
}

