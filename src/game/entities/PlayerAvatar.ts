import * as THREE from 'three';

/**
 * High-Definition Stylized 3D Walking Miner Avatar ("Thợ Mỏ 3D Khám Phá")
 * Built with high-fidelity curved primitives (Sphere, Cylinder, Capsule),
 * rich PBR materials, glowing headlamp with volumetric spotlight,
 * animated walking legs & arms, and holding a golden 3D pickaxe!
 * Zero 8-pixel blocky shapes!
 */
export class PlayerAvatar {
  public root: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3();
  public targetPosition: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public speed: number = 7.5;
  public isMoving: boolean = false;

  private walkTime: number = 0;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private bodyGroup!: THREE.Group;
  private pickaxeMesh!: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.root = new THREE.Group();
    this.root.scale.setScalar(1.25);
    scene.add(this.root);

    this.buildCharacterMesh();
  }

  private buildCharacterMesh(): void {
    // PBR Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5cfb3,
      roughness: 0.55,
      metalness: 0.05,
    });
    const rosyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.45,
    });
    const beardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.75,
      metalness: 0.0,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Classic Red Flannel
      roughness: 0.7,
      metalness: 0.05,
    });
    const denimMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Vibrant Blue Denim Overalls
      roughness: 0.65,
      metalness: 0.1,
    });
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Construction Gold
      roughness: 0.25,
      metalness: 0.45,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.6,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x5a3600,
      emissiveIntensity: 0.35,
    });

    // 1. Ground Shadow (Bóng đổ mềm trên mặt đất)
    const shadowGeo = new THREE.PlaneGeometry(1.2, 0.9);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    this.root.add(shadowMesh);

    // 2. Legs & Boots (Chân đứng thẳng bước đi tự nhiên)
    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.22, 0.75, 0);
    this.root.add(this.leftLegGroup);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.55, 16), denimMat);
    legL.position.set(0, -0.27, 0);
    this.leftLegGroup.add(legL);

    const bootL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 16), leatherMat);
    bootL.position.set(0, -0.62, 0.06);
    this.leftLegGroup.add(bootL);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.22, 0.75, 0);
    this.root.add(this.rightLegGroup);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.55, 16), denimMat);
    legR.position.set(0, -0.27, 0);
    this.rightLegGroup.add(legR);

    const bootR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.26, 16), leatherMat);
    bootR.position.set(0, -0.62, 0.06);
    this.rightLegGroup.add(bootR);

    // 3. Body & Torso (Thân người tròn phúc hậu)
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0.8, 0);
    this.root.add(this.bodyGroup);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), shirtMat);
    belly.scale.set(1.05, 1.15, 0.95);
    belly.position.set(0, 0.35, 0);
    this.bodyGroup.add(belly);

    // Denim Overalls Bib
    const bib = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.42, 20), denimMat);
    bib.position.set(0, 0.25, 0);
    this.bodyGroup.add(bib);

    // Brass buckles
    [-0.18, 0.18].forEach((x) => {
      const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), brassMat);
      buckle.rotation.x = Math.PI / 2;
      buckle.position.set(x, 0.42, 0.4);
      this.bodyGroup.add(buckle);
    });

    // 4. Arms & Golden Pickaxe (Hai tay & Cuốc chim vàng)
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.48, 1.05, 0);
    this.root.add(this.leftArmGroup);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.48, 16), shirtMat);
    armL.position.set(0, -0.22, 0);
    this.leftArmGroup.add(armL);

    const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), gloveMat);
    gloveL.position.set(0, -0.46, 0);
    this.leftArmGroup.add(gloveL);

    // Right Arm (Holding Golden Pickaxe)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.48, 1.05, 0);
    this.root.add(this.rightArmGroup);

    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.48, 16), shirtMat);
    armR.position.set(0, -0.22, 0);
    this.rightArmGroup.add(armR);

    const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), gloveMat);
    gloveR.position.set(0, -0.46, 0);
    this.rightArmGroup.add(gloveR);

    // 3D Golden Pickaxe in Right Hand
    this.pickaxeMesh = new THREE.Group();
    this.pickaxeMesh.position.set(0.02, -0.44, 0.1);
    this.pickaxeMesh.rotation.set(0.3, 0.2, -0.4);
    this.rightArmGroup.add(this.pickaxeMesh);

    // Wood Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.85, 12), leatherMat);
    this.pickaxeMesh.add(shaft);

    // Double-pointed Curved Gold Pick Head
    const pickHead = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 12, 24, Math.PI * 0.7), goldMat);
    pickHead.rotation.z = Math.PI / 2 + 0.5;
    pickHead.position.set(0, 0.38, 0);
    this.pickaxeMesh.add(pickHead);

    // 5. Head, Beard, Face & Helmet (Đầu, râu trắng, nón bảo hộ đèn pin)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0.02);
    this.root.add(this.headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), skinMat);
    headMesh.scale.set(1.0, 1.05, 0.95);
    this.headGroup.add(headMesh);

    // Cute Red Bulbous Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), rosyMat);
    nose.position.set(0, 0.02, 0.38);
    this.headGroup.add(nose);

    // Rosy Cheeks
    [-0.18, 0.18].forEach((x) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), rosyMat);
      cheek.position.set(x, 0.01, 0.3);
      this.headGroup.add(cheek);
    });

    // Big Cartoon Eyes
    [-0.12, 0.12].forEach((x) => {
      const eyeWhite = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      eyeWhite.position.set(x, 0.12, 0.33);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0x1e3a8a })
      );
      pupil.position.set(x > 0 ? 0.01 : -0.01, 0, 0.04);
      eyeWhite.add(pupil);
      this.headGroup.add(eyeWhite);
    });

    // Bushy White Beard
    const beardMain = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.65, 20), beardMat);
    beardMain.position.set(0, -0.22, 0.25);
    beardMain.rotation.x = 0.3;
    this.headGroup.add(beardMain);

    [-0.15, 0, 0.15].forEach((x) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), beardMat);
      puff.position.set(x, -0.08, 0.32);
      this.headGroup.add(puff);
    });

    // Construction Hard Hat
    const hatDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      helmetMat
    );
    hatDome.position.set(0, 0.18, 0.02);
    this.headGroup.add(hatDome);

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.51, 0.06, 24), helmetMat);
    hatBrim.position.set(0, 0.2, 0.04);
    this.headGroup.add(hatBrim);

    // Front Searchlight Headlamp
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 16), brassMat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(0, 0.3, 0.48);
    this.headGroup.add(lamp);

    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfffbeb,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      })
    );
    lens.position.set(0, 0.3, 0.56);
    this.headGroup.add(lens);

    // Volumetric Spotlight projecting from helmet
    const spot = new THREE.SpotLight(0xfffbeb, 4.5, 16, Math.PI / 4.5, 0.4, 1.2);
    spot.position.set(0, 0.3, 0.56);
    spot.target.position.set(0, -1.8, 4.0);
    this.headGroup.add(spot);
    this.headGroup.add(spot.target);
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

  public moveInput(
    dx: number,
    dz: number,
    dt: number,
    bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }
  ): void {
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

  public update(dt: number, _elapsed: number): void {
    // Click-to-move interpolation
    if (this.position.distanceTo(this.targetPosition) > 0.15) {
      this.isMoving = true;
      const dir = this.targetPosition.clone().sub(this.position).normalize();
      this.root.rotation.y = Math.atan2(dir.x, dir.z);
      this.position.add(dir.multiplyScalar(this.speed * dt));
    }

    this.root.position.copy(this.position);

    // Natural Walking Animation (Chân và tay bước đi tự nhiên)
    if (this.isMoving) {
      this.walkTime += dt * 11;
      const legAngle = Math.sin(this.walkTime) * 0.65;
      this.leftLegGroup.rotation.x = legAngle;
      this.rightLegGroup.rotation.x = -legAngle;

      this.leftArmGroup.rotation.x = -legAngle * 0.7;
      this.rightArmGroup.rotation.x = legAngle * 0.7;

      // Body bobbing up and down
      this.bodyGroup.position.y = 0.8 + Math.abs(Math.sin(this.walkTime * 2)) * 0.08;
      this.headGroup.position.y = 1.45 + Math.abs(Math.sin(this.walkTime * 2)) * 0.08;
      this.headGroup.rotation.z = Math.sin(this.walkTime) * 0.05;
    } else {
      // Idle breathing
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, dt * 8);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, dt * 8);
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, dt * 8);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, dt * 8);
      this.bodyGroup.position.y = 0.8 + Math.sin(_elapsed * 2.5) * 0.02;
      this.headGroup.position.y = 1.45 + Math.sin(_elapsed * 2.5) * 0.02;
      this.headGroup.rotation.z = 0;
    }
  }
}
