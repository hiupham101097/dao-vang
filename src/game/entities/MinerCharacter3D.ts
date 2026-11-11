import * as THREE from 'three';

/**
 * High-Definition Stylized 3D Miner Character ("Ông Già Đào Vàng 3D")
 * Built with high-fidelity primitives, rich PBR materials, glowing headlamp,
 * and expressive cartoon animations.
 */
export class MinerCharacter3D {
  public root: THREE.Group;
  private headGroup!: THREE.Group;
  private bodyGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private rightForearm!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private leftForearm!: THREE.Group;
  private headlampLight!: THREE.SpotLight;
  private headlampVolumetricCone!: THREE.Mesh;
  private cheerTimer: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.root = new THREE.Group();
    this.root.position.copy(position);
    // Scaled up to 1.65 so the Miner is large, bold, and unmistakable at the top of the mine!
    this.root.scale.setScalar(1.65);
    scene.add(this.root);

    this.buildCharacterMesh();
  }

  private buildCharacterMesh(): void {
    // High-quality PBR Materials with rich colors & physical response
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
      color: 0xdc2626, // Classic Red Plaid Flannel
      roughness: 0.7,
      metalness: 0.05,
    });
    const denimMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Vibrant Blue Denim Overalls
      roughness: 0.65,
      metalness: 0.1,
    });
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Bright Construction Gold/Yellow
      roughness: 0.22,
      metalness: 0.45,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.18,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x5a2d0c,
      roughness: 0.55,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });

    // ==========================================
    // 1. STOOL & LEGS
    // ==========================================
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.14, 24), leatherMat);
    stoolTop.position.set(0, 0.45, 0);
    this.root.add(stoolTop);

    [-0.32, 0.32].forEach((x) => {
      [-0.25, 0.25].forEach((z) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.46, 12), brassMat);
        leg.position.set(x, 0.23, z);
        leg.rotation.z = x * -0.2;
        this.root.add(leg);
      });
    });

    // Heavy Miner Boots & Overalls Trouser Legs
    [-0.28, 0.28].forEach((x) => {
      const legThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.58, 16), denimMat);
      legThigh.position.set(x, 0.52, 0.24);
      legThigh.rotation.x = Math.PI / 2.3;
      this.root.add(legThigh);

      // Work Boots with yellow steel toe cap
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.48), leatherMat);
      boot.position.set(x, 0.18, 0.58);
      this.root.add(boot);

      const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), brassMat);
      toeCap.position.set(x, 0.16, 0.78);
      toeCap.scale.set(1.0, 0.7, 0.9);
      this.root.add(toeCap);
    });

    // ==========================================
    // 2. TORSO & OVERALLS
    // ==========================================
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0.65, 0);
    this.root.add(this.bodyGroup);

    // Round plump belly with flannel shirt
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.56, 24, 24), shirtMat);
    belly.scale.set(1.15, 1.05, 1.1);
    belly.position.set(0, 0.42, 0.02);
    this.bodyGroup.add(belly);

    // Denim Bib & Straps
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.52), denimMat);
    bib.position.set(0, 0.38, 0.18);
    this.bodyGroup.add(bib);

    // Front pocket on overalls
    const frontPocket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.06), denimMat);
    frontPocket.position.set(0, 0.32, 0.45);
    this.bodyGroup.add(frontPocket);

    // Mini gold nugget peeking out of his chest pocket!
    const nuggetGeom = new THREE.DodecahedronGeometry(0.09, 0);
    const pocketNugget = new THREE.Mesh(nuggetGeom, brassMat);
    pocketNugget.position.set(0.06, 0.44, 0.46);
    this.bodyGroup.add(pocketNugget);

    // Brass Straps Buckles
    [-0.2, 0.2].forEach((x) => {
      const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), brassMat);
      buckle.rotation.x = Math.PI / 2;
      buckle.position.set(x, 0.52, 0.43);
      this.bodyGroup.add(buckle);
    });

    // ==========================================
    // 3. HEAD, BEARD, FACE & GLOWING HELMET
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.35, 0.06);
    this.root.add(this.headGroup);

    // Smooth Stylized Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), skinMat);
    head.scale.set(1.0, 1.05, 0.96);
    this.headGroup.add(head);

    // Big Cute Red Bulbous Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), rosyMat);
    nose.position.set(0, 0.02, 0.42);
    this.headGroup.add(nose);

    // Rosy Cheeks
    [-0.22, 0.22].forEach((x) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), rosyMat);
      cheek.position.set(x, 0.01, 0.34);
      this.headGroup.add(cheek);
    });

    // Expressive Big Cartoon Eyes
    [-0.13, 0.13].forEach((x) => {
      const eyeWhite = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      eyeWhite.position.set(x, 0.14, 0.36);

      // Dark Blue Pupil
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x1e3a8a })
      );
      pupil.position.set(0, 0, 0.05);

      // Specular Reflection Dot (sparkle in eyes!)
      const sparkle = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      sparkle.position.set(0.015, 0.015, 0.04);
      pupil.add(sparkle);

      eyeWhite.add(pupil);
      this.headGroup.add(eyeWhite);

      // Bushy White Eyebrows
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.08), beardMat);
      brow.position.set(x, 0.22, 0.39);
      brow.rotation.z = x > 0 ? -0.16 : 0.16;
      this.headGroup.add(brow);
    });

    // Big Bushy Mustache curling out
    [-0.14, 0.14].forEach((x) => {
      const mustache = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 16), beardMat);
      mustache.position.set(x, -0.06, 0.44);
      mustache.rotation.z = x > 0 ? -Math.PI / 2.6 : Math.PI / 2.6;
      mustache.rotation.y = x > 0 ? 0.3 : -0.3;
      this.headGroup.add(mustache);
    });

    // Luxurious Layered 3D White Beard
    const mainBeard = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.75, 24), beardMat);
    mainBeard.position.set(0, -0.28, 0.3);
    mainBeard.rotation.x = 0.28;
    this.headGroup.add(mainBeard);

    [-0.18, 0, 0.18].forEach((x, i) => {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 - Math.abs(x) * 0.25, 16, 16),
        beardMat
      );
      puff.position.set(x, -0.1 - i * 0.04, 0.38);
      this.headGroup.add(puff);
    });

    // Construction Miner Hard Hat (Detailed)
    const hatDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      helmetMat
    );
    hatDome.position.set(0, 0.22, 0.02);
    this.headGroup.add(hatDome);

    // Raised center reinforcement ridge
    const hatRidge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.72), helmetMat);
    hatRidge.position.set(0, 0.38, 0.04);
    this.headGroup.add(hatRidge);

    // Helmet Brim
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.57, 0.07, 32), helmetMat);
    hatBrim.position.set(0, 0.24, 0.06);
    this.headGroup.add(hatBrim);

    // Frontal Heavy-Duty Searchlight Headlamp
    const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.2, 16), brassMat);
    lampHousing.rotation.x = Math.PI / 2;
    lampHousing.position.set(0, 0.34, 0.54);
    this.headGroup.add(lampHousing);

    const lampLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfffbeb,
        emissiveIntensity: 2.8,
        roughness: 0.1,
      })
    );
    lampLens.position.set(0, 0.34, 0.64);
    this.headGroup.add(lampLens);

    // Real Spotlight projecting down from his hard hat!
    this.headlampLight = new THREE.SpotLight(0xfff8db, 7.5, 30, Math.PI / 4, 0.4, 1.2);
    this.headlampLight.position.set(0, 0.34, 0.65);
    this.headlampLight.target.position.set(0, -6, 2);
    this.headGroup.add(this.headlampLight);
    this.headGroup.add(this.headlampLight.target);

    // Stylized Volumetric Light Cone
    const coneGeom = new THREE.ConeGeometry(1.6, 6.0, 16, 1, true);
    coneGeom.translate(0, -3.0, 0);
    coneGeom.rotateX(Math.PI / 2.3);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff4bd,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.headlampVolumetricCone = new THREE.Mesh(coneGeom, coneMat);
    this.headlampVolumetricCone.position.set(0, 0.34, 0.65);
    this.headGroup.add(this.headlampVolumetricCone);

    // ==========================================
    // 4. ARMS & CRANK OPERATION
    // ==========================================
    // Right Arm (Connected to Winch Crank Handle)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.55, 1.15, 0.05);
    this.root.add(this.rightArmGroup);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.44, 16), shirtMat);
    rUpperArm.position.set(0.12, -0.16, 0.06);
    rUpperArm.rotation.z = -0.35;
    this.rightArmGroup.add(rUpperArm);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0.24, -0.32, 0.12);
    this.rightArmGroup.add(this.rightForearm);

    const rLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.4, 16), shirtMat);
    rLowerArm.position.set(0, 0, 0.16);
    rLowerArm.rotation.x = Math.PI / 2.2;
    this.rightForearm.add(rLowerArm);

    // Leather work glove
    const rGlove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), gloveMat);
    rGlove.position.set(0, 0, 0.36);
    this.rightForearm.add(rGlove);

    // Left Arm (Resting on his knee or holding control lever)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.55, 1.15, 0.05);
    this.root.add(this.leftArmGroup);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.46, 16), shirtMat);
    lUpperArm.position.set(-0.14, -0.18, 0.06);
    lUpperArm.rotation.z = 0.45;
    this.leftArmGroup.add(lUpperArm);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(-0.24, -0.34, 0.14);
    this.leftArmGroup.add(this.leftForearm);

    const lLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.38, 16), shirtMat);
    lLowerArm.position.set(0, 0, 0.14);
    lLowerArm.rotation.x = 0.65;
    this.leftForearm.add(lLowerArm);

    const lGlove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), gloveMat);
    lGlove.position.set(0, 0, 0.32);
    this.leftForearm.add(lGlove);
  }

  public triggerCheer(): void {
    this.cheerTimer = 1.4;
  }

  public update(
    dt: number,
    elapsed: number,
    hookState: string,
    hookAngle: number,
    attachedItem: unknown,
    pullSpeedRatio: number = 1.0
  ): void {
    if (this.cheerTimer > 0) {
      this.cheerTimer -= dt;
      // Both arms raised in triumph!
      this.rightArmGroup.rotation.x = -Math.PI / 1.5;
      this.leftArmGroup.rotation.x = -Math.PI / 1.5;
      this.headGroup.rotation.x = -0.25;
      this.headGroup.rotation.y = Math.sin(elapsed * 12) * 0.15;
      this.bodyGroup.position.y = 0.65 + Math.abs(Math.sin(elapsed * 14)) * 0.08;
      return;
    }

    if (hookState === 'SWINGING') {
      // Idle watching: head and eyes smoothly turn to track the swinging hook angle
      this.headGroup.rotation.z = -hookAngle * 0.45;
      this.headGroup.rotation.y = Math.sin(elapsed * 2) * 0.08;
      this.headGroup.rotation.x = 0.05;
      this.bodyGroup.position.y = 0.65 + Math.sin(elapsed * 2.5) * 0.02;
      this.rightArmGroup.rotation.x = Math.sin(elapsed * 2) * 0.06;
      this.leftArmGroup.rotation.x = 0;
    } else if (hookState === 'LAUNCHING') {
      // Eager forward lean watching the hook plunge down
      this.headGroup.rotation.x = 0.22;
      this.bodyGroup.rotation.x = 0.14;
      this.rightArmGroup.rotation.x = -0.35;
    } else if (hookState === 'RETURNING') {
      // Energetic cranking motion of the right arm
      const crankSpeed = Math.max(4.0, 15 * pullSpeedRatio);
      const crankCycle = elapsed * crankSpeed;

      this.rightArmGroup.rotation.x = Math.sin(crankCycle) * 0.55;
      this.rightForearm.rotation.x = Math.cos(crankCycle) * 0.65;

      const strainFactor = attachedItem ? 1.4 : 0.6;
      this.bodyGroup.position.y = 0.65 + Math.sin(crankCycle * 2) * 0.045 * strainFactor;
      this.headGroup.rotation.x = 0.18 + Math.sin(crankCycle) * 0.12 * strainFactor;
      this.headGroup.rotation.z = Math.sin(crankCycle) * 0.08;
    }
  }
}
