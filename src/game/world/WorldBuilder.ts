import * as THREE from 'three';
import { PBRTextureGenerator } from '../gfx/PBRTextureGenerator';

/**
 * WorldBuilder - Creates immersive stylized 3D environments for:
 * 1. Hotel Room (Khách Sạn Thợ Mỏ)
 * 2. Town (Thị Trấn Miền Tây)
 * 3. Mine Exterior (Lối Vào Mỏ Núi)
 * 4. Subterranean Mine Cavern (Lòng Mỏ & Máy Đào)
 */
export class WorldBuilder {
  private scene: THREE.Scene;
  private bumpMap: THREE.CanvasTexture;

  // Root groups for each zone
  public hotelGroup: THREE.Group = new THREE.Group();
  public townGroup: THREE.Group = new THREE.Group();
  public mineExteriorGroup: THREE.Group = new THREE.Group();
  public cavernGroup: THREE.Group = new THREE.Group();
  public blastingGroup: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bumpMap = PBRTextureGenerator.createStoneBumpMap();

    this.scene.add(this.hotelGroup);
    this.scene.add(this.townGroup);
    this.scene.add(this.mineExteriorGroup);
    this.scene.add(this.cavernGroup);
    this.scene.add(this.blastingGroup);

    this.buildHotel();
    this.buildTown();
    this.buildMineExterior();
    this.buildCavern();
    this.buildBlastingArea();
  }

  public setVisibleZone(zone: 'HOTEL' | 'TOWN' | 'MINE_EXTERIOR' | 'MINING' | 'BLASTING'): void {
    this.hotelGroup.visible = zone === 'HOTEL';
    this.townGroup.visible = zone === 'TOWN';
    this.mineExteriorGroup.visible = zone === 'MINE_EXTERIOR';
    this.cavernGroup.visible = zone === 'MINING';
    this.blastingGroup.visible = zone === 'BLASTING';
  }

  // =========================================================================
  // 1. HOTEL ROOM (KHÁCH SẠN THỢ MỎ)
  // =========================================================================
  private buildHotel(): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.8 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a5229, roughness: 0.85 });
    const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7 });
    const quiltMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 }); // Warm Red Quilt
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9, bumpMap: this.bumpMap, bumpScale: 0.15 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });

    // Room Floor (8 x 8)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 8.5), woodMat);
    floor.position.set(0, -0.15, 0);
    floor.receiveShadow = true;
    this.hotelGroup.add(floor);

    // Walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.2, 0.4), wallMat);
    backWall.position.set(0, 1.95, -4.2);
    this.hotelGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 8.5), wallMat);
    leftWall.position.set(-4.2, 1.95, 0);
    this.hotelGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 8.5), wallMat);
    rightWall.position.set(4.2, 1.95, 0);
    this.hotelGroup.add(rightWall);

    // Front Wall with Doorway
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.2, 0.4), wallMat);
    frontWallLeft.position.set(-2.6, 1.95, 4.2);
    this.hotelGroup.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.2, 0.4), wallMat);
    frontWallRight.position.set(2.6, 1.95, 4.2);
    this.hotelGroup.add(frontWallRight);

    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 0.4), wallMat);
    doorHeader.position.set(0, 3.35, 4.2);
    this.hotelGroup.add(doorHeader);

    // Glowing Exit Doorway Threshold to Town
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.7, 0.1), woodMat);
    doorFrame.position.set(0, 1.35, 4.2);
    const exitLight = new THREE.PointLight(0xfffbeb, 2.5, 6);
    exitLight.position.set(0, 1.8, 3.8);
    this.hotelGroup.add(exitLight);

    // Sign above hotel door
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.1), woodMat);
    signBoard.position.set(0, 2.85, 4.0);
    this.hotelGroup.add(signBoard);

    // Cozy Miner Bed in the corner
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-2.5, 0, -2.5);

    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 3.2), bedFrameMat);
    bedBase.position.set(0, 0.22, 0);
    bedGroup.add(bedBase);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 3.0), quiltMat);
    mattress.position.set(0, 0.55, 0);
    bedGroup.add(mattress);

    const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.8), pillowMat);
    pillow.position.set(0, 0.82, -1.0);
    bedGroup.add(pillow);

    const headBoard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 0.2), bedFrameMat);
    headBoard.position.set(0, 0.65, -1.55);
    bedGroup.add(headBoard);
    this.hotelGroup.add(bedGroup);

    // Stone Fireplace with glowing fire
    const fireGroup = new THREE.Group();
    fireGroup.position.set(2.8, 0, -3.8);

    const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.8), stoneMat);
    hearth.position.set(0, 1.4, 0);
    fireGroup.add(hearth);

    const fireHole = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.5), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    fireHole.position.set(0, 0.7, 0.2);
    fireGroup.add(fireHole);

    // Fire flame & warm amber point light
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 8), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
    flame.position.set(0, 0.4, 0.25);
    fireGroup.add(flame);

    const fireLight = new THREE.PointLight(0xff7700, 4.5, 12);
    fireLight.position.set(0, 0.8, 0.6);
    fireGroup.add(fireLight);
    this.hotelGroup.add(fireGroup);

    // Warm ceiling chandelier
    const chandelier = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 12), goldMat);
    chandelier.position.set(0, 3.4, 0);
    this.hotelGroup.add(chandelier);

    const roomLight = new THREE.PointLight(0xfff1d6, 3.0, 14);
    roomLight.position.set(0, 3.2, 0);
    this.hotelGroup.add(roomLight);
  }

  // =========================================================================
  // 2. TOWN (THỊ TRẤN THỢ MỎ MIỀN TÂY)
  // =========================================================================
  private buildTown(): void {
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0xb58b57, roughness: 0.95 }); // Desert Dirt
    const boardwalkMat = new THREE.MeshStandardMaterial({ color: 0x6e4320, roughness: 0.8 });
    const saloonMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85 });
    const storeMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.85 }); // Emerald General Store
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.75 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });

    // Town Main Square Ground (36 x 36)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), dirtMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.townGroup.add(ground);

    // Main Street Boardwalks
    [-4.5, 4.5].forEach((x) => {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 34), boardwalkMat);
      walk.position.set(x, 0.12, 0);
      walk.receiveShadow = true;
      this.townGroup.add(walk);
    });

    // 1. HOTEL BUILDING (Behind the player when entering town)
    const hotelBldg = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 6), saloonMat);
    hotelBldg.position.set(0, 3, -14);
    this.townGroup.add(hotelBldg);

    // Hotel Sign
    const hotelSign = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.0, 0.3), woodMat);
    hotelSign.position.set(0, 5.2, -10.8);
    this.townGroup.add(hotelSign);

    // 2. GENERAL STORE (CỬA HÀNG TRANG BỊ) on the Left
    const storeBldg = new THREE.Mesh(new THREE.BoxGeometry(6, 5.2, 8), storeMat);
    storeBldg.position.set(-8.5, 2.6, 0);
    this.townGroup.add(storeBldg);

    // Store Awning & Porch
    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 5.5), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }));
    awning.position.set(-5.5, 3.8, 0);
    awning.rotation.z = -0.15;
    this.townGroup.add(awning);

    // Store Sign "CỬA HÀNG VẬT PHẨM"
    const storeSign = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 4.8), goldMat);
    storeSign.position.set(-5.2, 4.2, 0);
    this.townGroup.add(storeSign);

    const storeLight = new THREE.PointLight(0xffe066, 3.5, 9);
    storeLight.position.set(-5.2, 3.2, 0);
    this.townGroup.add(storeLight);

    // 3. TOWN SALOON on the Right
    const saloonBldg = new THREE.Mesh(new THREE.BoxGeometry(6, 5.5, 8), saloonMat);
    saloonBldg.position.set(8.5, 2.75, 0);
    this.townGroup.add(saloonBldg);

    // 4. Props: Barrels, Crates, Water Tower
    [-3.2, 3.2].forEach((x, i) => {
      for (let b = -6; b <= 6; b += 4) {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 12), woodMat);
        barrel.position.set(x + (i % 2 === 0 ? 0.3 : -0.3), 0.45, b);
        this.townGroup.add(barrel);
      }
    });

    // 5. ROAD SIGN TO THE MINE (At North end of street, z = +12)
    const mineSignPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 12), woodMat);
    mineSignPost.position.set(2.8, 1.6, 11);
    this.townGroup.add(mineSignPost);

    const mineSignBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.15), goldMat);
    mineSignBoard.position.set(2.8, 2.7, 11);
    mineSignBoard.rotation.y = -0.3;
    this.townGroup.add(mineSignBoard);

    // Mountain silhouettes in the distance
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.95 });
    for (let m = -20; m <= 20; m += 10) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(8 + Math.abs(m) * 0.2, 14, 6), mountainMat);
      cone.position.set(m, 5, 22);
      this.townGroup.add(cone);
    }

    // Town ambient sunlight
    const sunLight = new THREE.DirectionalLight(0xfff6dd, 2.2);
    sunLight.position.set(12, 20, 10);
    sunLight.castShadow = true;
    this.townGroup.add(sunLight);

    const hemi = new THREE.HemisphereLight(0xbae6fd, 0xd97706, 1.2);
    this.townGroup.add(hemi);
  }

  // =========================================================================
  // 3. MINE EXTERIOR (LỐI VÀO MỎ NÚI)
  // =========================================================================
  private buildMineExterior(): void {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9, bumpMap: this.bumpMap, bumpScale: 0.25 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x3d2110, roughness: 0.85 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.88, roughness: 0.25 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    // Rocky Canyon Floor
    const canyonFloor = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), rockMat);
    canyonFloor.rotation.x = -Math.PI / 2;
    this.mineExteriorGroup.add(canyonFloor);

    // Massive Mountain Cliff Face
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(32, 16, 6), rockMat);
    cliff.position.set(0, 8, 8);
    this.mineExteriorGroup.add(cliff);

    // Dark Mine Entrance Portal Tunnel
    const portal = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.8, 4), new THREE.MeshBasicMaterial({ color: 0x050403 }));
    portal.position.set(0, 2.9, 6.2);
    this.mineExteriorGroup.add(portal);

    // Heavy Timber Mining Archway
    [-2.8, 2.8].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 5.5, 0.8), timberMat);
      pillar.position.set(x, 2.75, 6.2);
      this.mineExteriorGroup.add(pillar);

      const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.42, 8), goldMat);
      lantern.position.set(x * 0.85, 4.2, 6.8);
      this.mineExteriorGroup.add(lantern);

      const lanternLight = new THREE.PointLight(0xff9900, 3.5, 9);
      lanternLight.position.copy(lantern.position);
      this.mineExteriorGroup.add(lanternLight);
    });

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.8, 0.9), timberMat);
    archBeam.position.set(0, 5.5, 6.2);
    this.mineExteriorGroup.add(archBeam);

    // Mine Name Plaque "HẦM MỎ VÀNG — MÀN 1"
    const mineSign = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.2), goldMat);
    mineSign.position.set(0, 5.6, 6.7);
    this.mineExteriorGroup.add(mineSign);

    // Mine Railway Tracks leading out of the tunnel
    [-0.7, 0.7].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 24), railMat);
      rail.position.set(x, 0.05, -2);
      this.mineExteriorGroup.add(rail);
    });

    for (let z = -12; z <= 6; z += 1.4) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.35), timberMat);
      tie.position.set(0, 0.06, z);
      this.mineExteriorGroup.add(tie);
    }

    // Ore Cart parked outside
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 2.2), timberMat);
    cart.position.set(-2.5, 0.8, -1);
    this.mineExteriorGroup.add(cart);

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.0);
    sun.position.set(8, 16, 4);
    this.mineExteriorGroup.add(sun);
  }

  // =========================================================================
  // 4. SUBTERRANEAN MINE CAVERN (KHU VỰC MÁY ĐÀO VÀNG)
  // =========================================================================
  private buildCavern(): void {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.92, bumpMap: this.bumpMap, bumpScale: 0.3 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x451e08, roughness: 0.85 });
    const goldVeinMat = new THREE.MeshStandardMaterial({ color: 0xffbe1a, metalness: 0.98, roughness: 0.15, emissive: 0x553300, emissiveIntensity: 0.5 });

    // Cavern Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(32, 22), rockMat);
    backWall.position.set(0, -4.5, -3.0);
    this.cavernGroup.add(backWall);

    // Glowing Gold Veins embedded in the rock wall
    [-4, 0, 4].forEach((x, i) => {
      const vein = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6, 0.2), goldVeinMat);
      vein.position.set(x + (i % 2 === 0 ? 1 : -1), -4.5, -2.85);
      vein.rotation.z = 0.35 * (i - 1);
      this.cavernGroup.add(vein);
    });

    // Side Rock Formations
    [-7.2, 7.2].forEach((x) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(2.4, 20, 8), rockMat);
      side.position.set(x, -4.0, 0);
      this.cavernGroup.add(side);
    });

    // Top Platform (y = 3.6)
    const platform = new THREE.Mesh(new THREE.BoxGeometry(24, 1.4, 8), rockMat);
    platform.position.set(0, 2.9, 0);
    this.cavernGroup.add(platform);

    // Arch framing the Crane at top
    [-5.2, 5.2].forEach((x) => {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.2, 0.8), timberMat);
      arch.position.set(x, 4.8, 0);
      this.cavernGroup.add(arch);
    });

    const cross = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.7, 0.8), timberMat);
    cross.position.set(0, 6.7, 0);
    this.cavernGroup.add(cross);
  }

  // =========================================================================
  // 5. BLASTING AREA (NỔ MÌN PHÁ NÚI MỞ MỎ MỚI)
  // =========================================================================
  private buildBlastingArea(): void {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x2e231c, roughness: 0.9, bumpMap: this.bumpMap, bumpScale: 0.35 });
    const tntMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    // Cavern Wall blocking the path
    const wallToBlast = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 4), rockMat);
    wallToBlast.position.set(0, -1, 0);
    this.blastingGroup.add(wallToBlast);

    // Bundle of dynamite sticks attached to the rock wall
    const dynamiteBundle = new THREE.Group();
    dynamiteBundle.position.set(0, 0, 2.2);

    for (let d = 0; d < 6; d++) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 12), tntMat);
      const angle = (d * Math.PI * 2) / 6;
      stick.position.set(Math.cos(angle) * 0.35, Math.sin(angle) * 0.35, 0);
      dynamiteBundle.add(stick);
    }

    const centerStick = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 12), tntMat);
    dynamiteBundle.add(centerStick);

    // Detonator Box Plunger nearby
    const plungerBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), woodMat);
    plungerBox.position.set(-2.5, -2.5, 3.5);
    this.blastingGroup.add(plungerBox);

    const plungerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    plungerHandle.position.set(-2.5, -1.8, 3.5);
    this.blastingGroup.add(plungerHandle);

    this.blastingGroup.add(dynamiteBundle);
  }
}
