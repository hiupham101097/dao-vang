import * as THREE from 'three';
import { ItemSpec, ItemType } from '../types';
import { PBRTextureGenerator } from '../gfx/PBRTextureGenerator';

export const ITEM_SPECS: Record<ItemType, ItemSpec> = {
  GOLD_SMALL: { type: 'GOLD_SMALL', name: 'Vàng Nhỏ', mass: 1.15, baseValue: 100, radius: 0.58, isExplosive: false },
  GOLD_MEDIUM: { type: 'GOLD_MEDIUM', name: 'Vàng Vừa', mass: 2.35, baseValue: 250, radius: 0.92, isExplosive: false },
  GOLD_LARGE: { type: 'GOLD_LARGE', name: 'Vàng Nguyên Khối', mass: 4.60, baseValue: 500, radius: 1.35, isExplosive: false },
  ROCK_SMALL: { type: 'ROCK_SMALL', name: 'Đá Nhỏ', mass: 3.40, baseValue: 25, radius: 0.72, isExplosive: false },
  ROCK_LARGE: { type: 'ROCK_LARGE', name: 'Đá Tảng Lớn', mass: 6.00, baseValue: 60, radius: 1.18, isExplosive: false },
  DIAMOND: { type: 'DIAMOND', name: 'Kim Cương Tinh Khiết', mass: 0.80, baseValue: 650, radius: 0.58, isExplosive: false },
  MYSTERY_BAG: { type: 'MYSTERY_BAG', name: 'Túi Bí Ẩn', mass: 1.90, baseValue: 300, radius: 0.85, isExplosive: false },
  TNT: { type: 'TNT', name: 'Thùng Thuốc Nổ TNT', mass: 1.0, baseValue: 10, radius: 0.88, isExplosive: true, explosionRadius: 4.2 },
};

export class Item3DFactory {
  private bumpMap: THREE.CanvasTexture;
  private tntMap: THREE.CanvasTexture;
  private bagMap: THREE.CanvasTexture;
  private goldMaterial: THREE.MeshStandardMaterial;
  private rockMaterial: THREE.MeshStandardMaterial;
  private diamondMaterial: THREE.MeshPhysicalMaterial;
  private bagMaterial: THREE.MeshStandardMaterial;
  private tntBodyMat: THREE.MeshStandardMaterial;
  private ironBandMat: THREE.MeshStandardMaterial;

  constructor() {
    this.bumpMap = PBRTextureGenerator.createStoneBumpMap();
    this.tntMap = PBRTextureGenerator.createTNTLabelTexture();
    this.bagMap = PBRTextureGenerator.createMysteryBagTexture();

    // Vibrant 24K Pure Gold PBR Material with physical metallic glint
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffbe1a,
      metalness: 0.98,
      roughness: 0.12,
      bumpMap: this.bumpMap,
      bumpScale: 0.14,
      emissive: 0x6a3800,
      emissiveIntensity: 0.42,
    });

    // High-contrast Granite Boulder Material
    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      metalness: 0.08,
      roughness: 0.82,
      bumpMap: this.bumpMap,
      bumpScale: 0.35,
      flatShading: true,
    });

    // Brilliant Refractive Faceted Diamond
    this.diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0.05,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.95,
      flatShading: true,
    });

    // Rich Burlap Sack Material
    this.bagMaterial = new THREE.MeshStandardMaterial({
      map: this.bagMap,
      bumpMap: this.bumpMap,
      bumpScale: 0.08,
      roughness: 0.78,
    });

    // Hazard Industrial Red for TNT
    this.tntBodyMat = new THREE.MeshStandardMaterial({
      map: this.tntMap,
      roughness: 0.45,
      metalness: 0.2,
    });

    this.ironBandMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.92,
      roughness: 0.25,
    });
  }

  private createSculptedGeometry(radius: number, detail: number, irregularity: number = 0.26, seed: number = 1): THREE.BufferGeometry {
    const geom = new THREE.IcosahedronGeometry(radius, detail);
    const pos = geom.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 3.2 + seed) * Math.cos(v.y * 2.8 + seed) * Math.sin(v.z * 3.6 + seed);
      v.multiplyScalar(1 + n * irregularity);
      v.z *= 0.85;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geom.computeVertexNormals();
    return geom;
  }

  public createItemMesh(specKey: ItemType): THREE.Group {
    const spec = { ...ITEM_SPECS[specKey] };
    const group = new THREE.Group();
    const seed = Math.random() * 100;

    if (specKey.startsWith('GOLD_')) {
      const geom = this.createSculptedGeometry(spec.radius, 2, 0.24, seed);
      const mesh = new THREE.Mesh(geom, this.goldMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Embedded sparkling crystal nodules
      if (specKey !== 'GOLD_SMALL') {
        const subCount = specKey === 'GOLD_LARGE' ? 3 : 1;
        for (let s = 0; s < subCount; s++) {
          const subGeom = new THREE.DodecahedronGeometry(spec.radius * 0.42, 0);
          const subMesh = new THREE.Mesh(subGeom, this.goldMaterial);
          const ang = (s * Math.PI * 2) / subCount;
          subMesh.position.set(
            Math.cos(ang) * spec.radius * 0.45,
            Math.sin(ang) * spec.radius * 0.45,
            spec.radius * 0.22
          );
          group.add(subMesh);
        }
      }

      // Golden sparkling halo aura
      const sparkleLight = new THREE.PointLight(0xffbe1a, specKey === 'GOLD_LARGE' ? 1.8 : 1.1, 4.5);
      group.add(sparkleLight);
    } else if (specKey.startsWith('ROCK_')) {
      const geom = this.createSculptedGeometry(spec.radius, 1, 0.38, seed);
      const mesh = new THREE.Mesh(geom, this.rockMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      const bumpCount = specKey === 'ROCK_LARGE' ? 3 : 1;
      for (let i = 0; i < bumpCount; i++) {
        const subGeom = new THREE.IcosahedronGeometry(spec.radius * 0.42, 0);
        const sub = new THREE.Mesh(subGeom, this.rockMaterial);
        sub.position.set(
          Math.sin(i * 2.2) * spec.radius * 0.58,
          Math.cos(i * 1.9) * spec.radius * 0.58,
          Math.sin(i * 3.4) * spec.radius * 0.32
        );
        group.add(sub);
      }
    } else if (specKey === 'DIAMOND') {
      // Classic Brilliant Faceted Octahedron Diamond
      const coneTop = new THREE.ConeGeometry(spec.radius, spec.radius * 0.72, 8);
      const topMesh = new THREE.Mesh(coneTop, this.diamondMaterial);
      topMesh.position.y = spec.radius * 0.18;
      group.add(topMesh);

      const coneBottom = new THREE.ConeGeometry(spec.radius, spec.radius * 1.25, 8);
      coneBottom.rotateX(Math.PI);
      const bottomMesh = new THREE.Mesh(coneBottom, this.diamondMaterial);
      bottomMesh.position.y = -spec.radius * 0.42;
      group.add(bottomMesh);

      // Inner pulsating cyan gem light
      const glow = new THREE.PointLight(0x38bdf8, 2.5, 3.8);
      group.add(glow);
    } else if (specKey === 'MYSTERY_BAG') {
      const bagBody = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 20, 20), this.bagMaterial);
      bagBody.scale.set(1.0, 1.28, 0.96);
      group.add(bagBody);

      const tieGeom = new THREE.TorusGeometry(spec.radius * 0.38, 0.09, 10, 20);
      tieGeom.rotateX(Math.PI / 2);
      const tieMesh = new THREE.Mesh(tieGeom, new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 }));
      tieMesh.position.y = spec.radius * 0.92;
      group.add(tieMesh);

      const ruffle = new THREE.Mesh(new THREE.ConeGeometry(spec.radius * 0.52, spec.radius * 0.48, 16), this.bagMaterial);
      ruffle.position.y = spec.radius * 1.18;
      group.add(ruffle);

      const bagLight = new THREE.PointLight(0xfbbf24, 1.2, 3.5);
      group.add(bagLight);
    } else if (specKey === 'TNT') {
      const barrelGeom = new THREE.CylinderGeometry(spec.radius * 0.85, spec.radius * 0.85, spec.radius * 1.75, 24);
      const barrel = new THREE.Mesh(barrelGeom, this.tntBodyMat);
      barrel.castShadow = true;
      group.add(barrel);

      [-spec.radius * 0.65, 0, spec.radius * 0.65].forEach((y) => {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(spec.radius * 0.89, spec.radius * 0.89, 0.14, 24), this.ironBandMat);
        band.position.y = y;
        group.add(band);
      });

      // Animated burning fuse
      const fuse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
      );
      fuse.position.set(0, spec.radius * 0.98, 0);
      fuse.rotation.z = 0.38;
      group.add(fuse);

      // Lit sparking ember
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      spark.position.set(0.14, spec.radius * 1.2, 0);
      spark.name = 'tntFuseSpark';
      group.add(spark);

      const fuseGlow = new THREE.PointLight(0xff3300, 2.5, 4.0);
      fuseGlow.position.copy(spark.position);
      group.add(fuseGlow);
    }

    // Attach collision metadata
    group.userData = {
      ...spec,
      colliderRadius: spec.radius * 1.05,
    };

    return group;
  }
}
