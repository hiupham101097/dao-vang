import * as THREE from 'three';

/**
 * 3D Miner Character ("Ông Già Đào Vàng 3D")
 * Built using procedural primitives, PBR materials, and real-time bone-free hierarchy animation.
 */
export class MinerCharacter3D {
  public root: THREE.Group;
  private headGroup!: THREE.Group;
  private bodyGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private rightForearm!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private crankKnobMesh!: THREE.Mesh;
  private lanternGroup!: THREE.Group;
  private lanternLight!: THREE.PointLight;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    this.root = new THREE.Group();
    this.root.position.copy(position);
    this.root.scale.setScalar(1.35); // Prominent scale so the miner sits visibly atop the mine shaft
    this.root.visible = true;
    scene.add(this.root);

    this.buildCharacterMesh();
  }

  private buildCharacterMesh(): void {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf4bfa1, roughness: 0.5 });
    const rosyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    const denimMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.55 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.35, roughness: 0.22 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.18 });

    // 1. Lower Body & Wooden Mining Stool
    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16), leatherMat);
    stoolTop.position.set(0, 0.45, 0);
    this.root.add(stoolTop);

    [-0.32, 0.32].forEach((x) => {
      [-0.25, 0.25].forEach((z) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.46, 8), leatherMat);
        leg.position.set(x, 0.23, z);
        leg.rotation.z = x * -0.2;
        this.root.add(leg);
      });
    });

    // Miner's Boots & Legs in Denim Overalls
    [-0.28, 0.28].forEach((x) => {
      const legThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.55, 12), denimMat);
      legThigh.position.set(x, 0.52, 0.25);
      legThigh.rotation.x = Math.PI / 2.3;
      this.root.add(legThigh);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.45), leatherMat);
      boot.position.set(x, 0.18, 0.58);
      this.root.add(boot);
    });

    // 2. Torso (Belly + Plaid Flannel Shirt + Overalls)
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0.65, 0);
    this.root.add(this.bodyGroup);

    // Round plump belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), shirtMat);
    belly.scale.set(1.15, 1.0, 1.08);
    belly.position.set(0, 0.38, 0.02);
    this.bodyGroup.add(belly);

    // Denim Bib & Straps
    const bib = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.42, 0.48), denimMat);
    bib.position.set(0, 0.35, 0.16);
    this.bodyGroup.add(bib);

    [-0.18, 0.18].forEach((x) => {
      const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), goldMat);
      buckle.rotation.x = Math.PI / 2;
      buckle.position.set(x, 0.48, 0.41);
      this.bodyGroup.add(buckle);
    });

    // 3. Head, Beard, Face & Hard Hat
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.25, 0.05);
    this.root.add(this.headGroup);

    // Head base
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), skinMat);
    head.scale.set(1.0, 1.05, 0.95);
    this.headGroup.add(head);

    // Red Bulbous Miner Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), rosyMat);
    nose.position.set(0, 0.02, 0.36);
    this.headGroup.add(nose);

    // Rosy Cheeks
    [-0.18, 0.18].forEach((x) => {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), rosyMat);
      cheek.position.set(x, 0.01, 0.3);
      this.headGroup.add(cheek);
    });

    // Expressive Eyes
    [-0.11, 0.11].forEach((x) => {
      const eyeWhite = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      eyeWhite.position.set(x, 0.12, 0.31);

      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      pupil.position.set(0, 0, 0.04);
      eyeWhite.add(pupil);
      this.headGroup.add(eyeWhite);

      // Fluffy White Eyebrows
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.06), beardMat);
      brow.position.set(x, 0.18, 0.33);
      brow.rotation.z = x > 0 ? -0.15 : 0.15;
      this.headGroup.add(brow);
    });

    // Big Bushy White Beard
    const mainBeard = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.65, 16), beardMat);
    mainBeard.position.set(0, -0.22, 0.26);
    mainBeard.rotation.x = 0.28;
    this.headGroup.add(mainBeard);

    [-0.14, 0, 0.14].forEach((x, i) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.16 - Math.abs(x) * 0.3, 12, 12), beardMat);
      puff.position.set(x, -0.06 - i * 0.02, 0.34);
      this.headGroup.add(puff);
    });

    // Miner Hard Hat
    const hatDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hatMat
    );
    hatDome.position.set(0, 0.18, 0.02);
    this.headGroup.add(hatDome);

    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.49, 0.06, 24), hatMat);
    hatBrim.position.set(0, 0.2, 0.06);
    this.headGroup.add(hatBrim);

    // Headlamp on Helmet
    const lampCasing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 12), goldMat);
    lampCasing.rotation.x = Math.PI / 2;
    lampCasing.position.set(0, 0.28, 0.46);
    this.headGroup.add(lampCasing);

    const lampLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfef08a,
        emissiveIntensity: 2.2,
      })
    );
    lampLens.position.set(0, 0.28, 0.52);
    this.headGroup.add(lampLens);

    // 4. Arms & Crank Operation
    // Right Arm (Connected to Winch Crank Handle)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.48, 1.1, 0.05);
    this.root.add(this.rightArmGroup);

    const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 10), shirtMat);
    rUpperArm.position.set(0.1, -0.15, 0.05);
    rUpperArm.rotation.z = -0.35;
    this.rightArmGroup.add(rUpperArm);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0.2, -0.3, 0.1);
    this.rightArmGroup.add(this.rightForearm);

    const rLowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.36, 10), shirtMat);
    rLowerArm.position.set(0, 0, 0.14);
    rLowerArm.rotation.x = Math.PI / 2.2;
    this.rightForearm.add(rLowerArm);

    this.crankKnobMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), leatherMat);
    this.crankKnobMesh.position.set(0, 0, 0.32);
    this.rightForearm.add(this.crankKnobMesh);

    // Left Arm (Resting or Holding Mining Lantern)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.48, 1.1, 0.05);
    this.root.add(this.leftArmGroup);

    const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.42, 10), shirtMat);
    lUpperArm.position.set(-0.12, -0.18, 0.05);
    lUpperArm.rotation.z = 0.45;
    this.leftArmGroup.add(lUpperArm);

    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.34, 10), shirtMat);
    lForearm.position.set(-0.18, -0.32, 0.18);
    lForearm.rotation.x = 0.65;
    this.leftArmGroup.add(lForearm);

    // Brass Mining Lantern hanging by his side
    this.lanternGroup = new THREE.Group();
    this.lanternGroup.position.set(-0.35, 0.55, 0.32);
    this.root.add(this.lanternGroup);

    const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8), goldMat);
    this.lanternGroup.add(lanternBody);

    const lanternFlame = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    lanternFlame.position.set(0, 0, 0);
    this.lanternGroup.add(lanternFlame);

    this.lanternLight = new THREE.PointLight(0xffa200, 1.8, 4.5);
    this.lanternLight.position.set(0, 0, 0);
    this.lanternGroup.add(this.lanternLight);
  }

  public update(
    dt: number,
    elapsed: number,
    hookState: string,
    hookAngle: number,
    attachedItem: unknown,
    pullSpeedRatio: number = 1.0
  ): void {
    // 1. Lantern flicker
    if (this.lanternLight) {
      this.lanternLight.intensity = 1.8 + Math.sin(elapsed * 12) * 0.35;
    }

    // 2. Action states
    if (hookState === 'SWINGING') {
      // Idle watching: head follows the swinging pendulum hook smoothly
      this.headGroup.rotation.z = -hookAngle * 0.45;
      this.headGroup.rotation.y = Math.sin(elapsed * 2) * 0.08;
      this.bodyGroup.position.y = 0.65 + Math.sin(elapsed * 3) * 0.015;
      this.rightArmGroup.rotation.x = Math.sin(elapsed * 2) * 0.08;
    } else if (hookState === 'LAUNCHING') {
      // Eager forward lean
      this.headGroup.rotation.x = 0.18;
      this.bodyGroup.rotation.x = 0.12;
      this.rightArmGroup.rotation.x = -0.3;
    } else if (hookState === 'RETURNING') {
      // Cranking the winch wheel!
      const crankSpeed = Math.max(3.5, 14 * pullSpeedRatio);
      const crankCycle = elapsed * crankSpeed;

      this.rightArmGroup.rotation.x = Math.sin(crankCycle) * 0.42;
      this.rightForearm.rotation.x = Math.cos(crankCycle) * 0.55;

      // Heavy item strain: Miner leans forward and bobs
      const strainFactor = attachedItem ? 1.4 : 0.6;
      this.bodyGroup.position.y = 0.65 + Math.sin(crankCycle * 2) * 0.04 * strainFactor;
      this.headGroup.rotation.x = 0.15 + Math.sin(crankCycle) * 0.1 * strainFactor;
    }
  }
}

