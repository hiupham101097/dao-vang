import * as THREE from 'three';
import { ItemSpec, ItemType } from '../types';
import { PBRTextureGenerator } from '../gfx/PBRTextureGenerator';

export const ITEM_SPECS: Record<ItemType, ItemSpec> = {
  GOLD_SMALL: { type: 'GOLD_SMALL', name: 'Vàng Nhỏ', mass: 1.15, baseValue: 100, radius: 0.52, isExplosive: false },
  GOLD_MEDIUM: { type: 'GOLD_MEDIUM', name: 'Vàng Vừa', mass: 2.35, baseValue: 250, radius: 0.84, isExplosive: false },
  GOLD_LARGE: { type: 'GOLD_LARGE', name: 'Vàng Nguyên Khối', mass: 4.60, baseValue: 500, radius: 1.25, isExplosive: false },
  ROCK_SMALL: { type: 'ROCK_SMALL', name: 'Đá Nhỏ', mass: 3.40, baseValue: 25, radius: 0.68, isExplosive: false },
  ROCK_LARGE: { type: 'ROCK_LARGE', name: 'Đá Tảng Lớn', mass: 6.00, baseValue: 60, radius: 1.10, isExplosive: false },
  DIAMOND: { type: 'DIAMOND', name: 'Kim Cương Tinh Khiết', mass: 0.80, baseValue: 650, radius: 0.52, isExplosive: false },
  MYSTERY_BAG: { type: 'MYSTERY_BAG', name: 'Túi Bí Ẩn', mass: 1.90, baseValue: 300, radius: 0.78, isExplosive: false },
  TNT: { type: 'TNT', name: 'Thùng Thuốc Nổ TNT', mass: 1.0, baseValue: 10, radius: 0.82, isExplosive: true, explosionRadius: 3.8 },
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

    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1.0,
      roughness: 0.16,
      bumpMap: this.bumpMap,
      bumpScale: 0.12,
      emissive: 0x452800,
      emissiveIntensity: 0.28,
    });

    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x646870,
      metalness: 0.1,
      roughness: 0.86,
      bumpMap: this.bumpMap,
      bumpScale: 0.25,
      flatShading: true,
    });

    this.diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      metalness: 0.1,
      roughness: 0.02,
      clearcoat: 1.0,
      reflectivity: 1.0,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.85,
      flatShading: true,
    });

    this.bagMaterial = new THREE.MeshStandardMaterial({
      map: this.bagMap,
      bumpMap: this.bumpMap,
      bumpScale: 0.06,
      roughness: 0.82,
    });

    this.tntBodyMat = new THREE.MeshStandardMaterial({
      map: this.tntMap,
      roughness: 0.5,
      metalness: 0.15,
    });

    this.ironBandMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.88,
      roughness: 0.3,
    });
  }

  private createSculptedGeometry(radius: number, detail: number, irregularity: number = 0.24, seed: number = 1): THREE.BufferGeometry {
    const geom = new THREE.IcosahedronGeometry(radius, detail);
    const pos = geom.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed) * Math.sin(v.z * 3.5 + seed);
      v.multiplyScalar(1 + n * irregularity);
      v.z *= 0.82; // Slightly flattened for natural nugget aspect
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
      const geom = this.createSculptedGeometry(spec.radius, 2, 0.22, seed);
      const mesh = new THREE.Mesh(geom, this.goldMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      if (specKey !== 'GOLD_SMALL') {
        const subGeom = new THREE.DodecahedronGeometry(spec.radius * 0.45, 0);
        const subMesh = new THREE.Mesh(subGeom, this.goldMaterial);
        subMesh.position.set(spec.radius * 0.44, spec.radius * 0.3, spec.radius * 0.2);
        group.add(subMesh);
      }
    } else if (specKey.startsWith('ROCK_')) {
      const geom = this.createSculptedGeometry(spec.radius, 1, 0.35, seed);
      const mesh = new THREE.Mesh(geom, this.rockMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      const bumpCount = specKey === 'ROCK_LARGE' ? 3 : 1;
      for (let i = 0; i < bumpCount; i++) {
        const subGeom = new THREE.IcosahedronGeometry(spec.radius * 0.4, 0);
        const sub = new THREE.Mesh(subGeom, this.rockMaterial);
        sub.position.set(
          (Math.sin(i * 2.1) * spec.radius * 0.6),
          (Math.cos(i * 1.8) * spec.radius * 0.6),
          (Math.sin(i * 3.5) * spec.radius * 0.3)
        );
        group.add(sub);
      }
    } else if (specKey === 'DIAMOND') {
      const coneTop = new THREE.ConeGeometry(spec.radius, spec.radius * 0.65, 8);
      const topMesh = new THREE.Mesh(coneTop, this.diamondMaterial);
      topMesh.position.y = spec.radius * 0.15;
      group.add(topMesh);

      const coneBottom = new THREE.ConeGeometry(spec.radius, spec.radius * 1.15, 8);
      coneBottom.rotateX(Math.PI);
      const bottomMesh = new THREE.Mesh(coneBottom, this.diamondMaterial);
      bottomMesh.position.y = -spec.radius * 0.38;
      group.add(bottomMesh);

      // Inner glowing core
      const glow = new THREE.PointLight(0x38bdf8, 2.2, 3.2);
      group.add(glow);
    } else if (specKey === 'MYSTERY_BAG') {
      const bagBody = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 16, 16), this.bagMaterial);
      bagBody.scale.set(1.0, 1.25, 0.95);
      group.add(bagBody);

      const tieGeom = new THREE.TorusGeometry(spec.radius * 0.35, 0.08, 8, 16);
      tieGeom.rotateX(Math.PI / 2);
      const tieMesh = new THREE.Mesh(tieGeom, new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
      tieMesh.position.y = spec.radius * 0.9;
      group.add(tieMesh);

      const ruffle = new THREE.Mesh(new THREE.ConeGeometry(spec.radius * 0.5, spec.radius * 0.45, 12), this.bagMaterial);
      ruffle.position.y = spec.radius * 1.15;
      group.add(ruffle);
    } else if (specKey === 'TNT') {
      const barrelGeom = new THREE.CylinderGeometry(spec.radius * 0.85, spec.radius * 0.85, spec.radius * 1.7, 24);
      const barrel = new THREE.Mesh(barrelGeom, this.tntBodyMat);
      barrel.castShadow = true;
      group.add(barrel);

      [-spec.radius * 0.6, 0, spec.radius * 0.6].forEach((y) => {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(spec.radius * 0.88, spec.radius * 0.88, 0.12, 24), this.ironBandMat);
        band.position.y = y;
        group.add(band);
      });

      // Animated burning fuse
      const fuse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
      );
      fuse.position.set(0, spec.radius * 0.95, 0);
      fuse.rotation.z = 0.35;
      group.add(fuse);

      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffdd00 })
      );
      spark.position.set(0.12, spec.radius * 1.15, 0);
      spark.name = 'tntFuseSpark';
      group.add(spark);

      const fuseGlow = new THREE.PointLight(0xff4400, 2.0, 3.5);
      fuseGlow.position.copy(spark.position);
      group.add(fuseGlow);
    }

    // Attach metadata for gameplay collision & physics
    group.userData = {
      ...spec,
      colliderRadius: spec.radius * 1.05,
    };

    return group;
  }
}

