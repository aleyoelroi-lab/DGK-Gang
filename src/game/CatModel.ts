import * as THREE from 'three';
import { CatCharacter, PlayerCustomization, CatExpression } from '../types/game';

export interface CatAnimationState {
  action: 'idle' | 'walk' | 'run' | 'jump' | 'climb' | 'dash' | 'blend_in' | 'tickle' | 'dance' | 'purr' | 'play_hide' | 'mischief_prank' | 'nap' | 'ride_vacuum';
  speed: number;
  time: number;
  isGrounded: boolean;
  isClimbing: boolean;
  isInnocent: boolean;
  expression?: CatExpression;
}

export class Cat3DModel {
  public group: THREE.Group;
  public character: CatCharacter;
  public customization: PlayerCustomization['equipped'];

  // Bone / Mesh nodes
  public bodyMesh!: THREE.Mesh;
  public headGroup!: THREE.Group;
  public headMesh!: THREE.Mesh;
  public snoutMesh!: THREE.Mesh;
  public leftEar!: THREE.Mesh;
  public rightEar!: THREE.Mesh;
  public leftEye!: THREE.Mesh;
  public rightEye!: THREE.Mesh;
  public leftPupil!: THREE.Mesh;
  public rightPupil!: THREE.Mesh;
  public leftEyelid!: THREE.Mesh;
  public rightEyelid!: THREE.Mesh;
  public tongueMesh!: THREE.Mesh;
  public leftCheekBlush!: THREE.Mesh;
  public rightCheekBlush!: THREE.Mesh;
  public leftEyebrow!: THREE.Mesh;
  public rightEyebrow!: THREE.Mesh;
  public whiskers: THREE.Line[] = [];

  private tailGroup!: THREE.Group;
  private tailSegments: THREE.Mesh[] = [];
  private legFL!: THREE.Group; // Front Left
  private legFR!: THREE.Group; // Front Right
  private legBL!: THREE.Group; // Back Left
  private legBR!: THREE.Group; // Back Right
  private accessoryNodes: { [key: string]: THREE.Group } = {};

  // Accessory meshes cache
  private activeAccessories: THREE.Object3D[] = [];

  // Innocent mode special box / halo
  private boxPropGroup!: THREE.Group;
  private heartParticles!: THREE.Points;

  // Expression state
  public currentExpression: CatExpression = 'happy_purr';
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private earTwitchTimer: number = 0;

  constructor(character: CatCharacter, customization: PlayerCustomization['equipped'] = {}) {
    this.character = character;
    this.customization = customization;
    this.currentExpression = character.defaultExpression || 'happy_purr';
    this.group = new THREE.Group();
    this.buildCatMesh();
    this.updateAccessories(customization);
  }

  private buildCatMesh() {
    const furColor = new THREE.Color(this.character.furColor);
    const accentColor = new THREE.Color(this.character.accentColor);
    const eyeColor = new THREE.Color(this.character.eyeColor);

    // Materials
    const furMaterial = new THREE.MeshStandardMaterial({
      color: furColor,
      roughness: 0.85,
      metalness: 0.05,
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.9,
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: eyeColor,
      roughness: 0.15,
      metalness: 0.2,
      emissive: eyeColor,
      emissiveIntensity: 0.35,
    });

    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x050508 });
    const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffa0b0, roughness: 0.4 });
    const tongueMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b8b, roughness: 0.3 });
    const blushMaterial = new THREE.MeshBasicMaterial({ color: 0xff4d79, transparent: true, opacity: 0 });
    const eyelidMaterial = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.9 });
    const browMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // 1. Torso / Body (Spherical-capsule blend)
    const bodyGeo = new THREE.CapsuleGeometry(0.32, 0.45, 8, 16);
    bodyGeo.rotateX(Math.PI / 2);
    this.bodyMesh = new THREE.Mesh(bodyGeo, furMaterial);
    this.bodyMesh.position.y = 0.48;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Belly patch
    const bellyGeo = new THREE.SphereGeometry(0.26, 12, 12);
    bellyGeo.scale(0.9, 0.7, 1.1);
    const bellyMesh = new THREE.Mesh(bellyGeo, accentMaterial);
    bellyMesh.position.set(0, -0.08, 0.02);
    this.bodyMesh.add(bellyMesh);

    // 2. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.75, 0.35);
    this.group.add(this.headGroup);

    // Head geometry with cute slightly chubby cheeks
    const headGeo = new THREE.SphereGeometry(0.34, 16, 16);
    headGeo.scale(1.18, 0.96, 1.06);
    this.headMesh = new THREE.Mesh(headGeo, furMaterial);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const leftCheek = new THREE.Mesh(cheekGeo, accentMaterial);
    leftCheek.position.set(-0.17, -0.1, 0.2);
    const rightCheek = new THREE.Mesh(cheekGeo, accentMaterial);
    rightCheek.position.set(0.17, -0.1, 0.2);
    this.headGroup.add(leftCheek);
    this.headGroup.add(rightCheek);

    // Blush Cheeks (Glows cute pink)
    const blushGeo = new THREE.SphereGeometry(0.09, 8, 8);
    blushGeo.scale(1.2, 0.6, 0.4);
    this.leftCheekBlush = new THREE.Mesh(blushGeo, blushMaterial);
    this.leftCheekBlush.position.set(-0.22, -0.08, 0.26);
    this.headGroup.add(this.leftCheekBlush);

    this.rightCheekBlush = new THREE.Mesh(blushGeo, blushMaterial.clone());
    this.rightCheekBlush.position.set(0.22, -0.08, 0.26);
    this.headGroup.add(this.rightCheekBlush);

    // Snout / Muzzle
    const snoutGeo = new THREE.SphereGeometry(0.14, 12, 12);
    snoutGeo.scale(1.35, 0.9, 1.0);
    this.snoutMesh = new THREE.Mesh(snoutGeo, accentMaterial);
    this.snoutMesh.position.set(0, -0.08, 0.28);
    this.headGroup.add(this.snoutMesh);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.045, 0.045, 3);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, noseMaterial);
    noseMesh.position.set(0, -0.04, 0.39);
    this.headGroup.add(noseMesh);

    // Tongue (Cute Blep!)
    const tongueGeo = new THREE.CapsuleGeometry(0.04, 0.08, 6, 8);
    tongueGeo.rotateX(Math.PI / 3);
    this.tongueMesh = new THREE.Mesh(tongueGeo, tongueMaterial);
    this.tongueMesh.position.set(0, -0.15, 0.36);
    this.tongueMesh.scale.set(0, 0, 0); // hidden by default, pops out for blep!
    this.headGroup.add(this.tongueMesh);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.15, 0.25, 4);
    earGeo.scale(0.8, 1, 0.5);

    this.leftEar = new THREE.Mesh(earGeo, furMaterial);
    this.leftEar.position.set(-0.22, 0.32, 0.02);
    this.leftEar.rotation.set(-0.1, 0.1, 0.35);
    this.leftEar.castShadow = true;
    this.headGroup.add(this.leftEar);

    // Inner ear
    const innerEarGeo = new THREE.ConeGeometry(0.095, 0.19, 4);
    innerEarGeo.scale(0.7, 1, 0.4);
    const leftInnerEar = new THREE.Mesh(innerEarGeo, noseMaterial);
    leftInnerEar.position.set(0, 0.02, 0.03);
    this.leftEar.add(leftInnerEar);

    this.rightEar = new THREE.Mesh(earGeo, furMaterial);
    this.rightEar.position.set(0.22, 0.32, 0.02);
    this.rightEar.rotation.set(-0.1, -0.1, -0.35);
    this.rightEar.castShadow = true;
    this.headGroup.add(this.rightEar);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, noseMaterial);
    rightInnerEar.position.set(0, 0.02, 0.03);
    this.rightEar.add(rightInnerEar);

    // Big Anime Expressive Eyes
    const eyeGeo = new THREE.SphereGeometry(0.105, 16, 16);
    eyeGeo.scale(1, 1.25, 0.5);

    this.leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    this.leftEye.position.set(-0.15, 0.05, 0.28);
    this.leftEye.rotation.y = -0.12;
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    this.rightEye.position.set(0.15, 0.05, 0.28);
    this.rightEye.rotation.y = 0.12;
    this.headGroup.add(this.rightEye);

    // Large Pupils with Glints
    const pupilGeo = new THREE.SphereGeometry(0.065, 12, 12);
    pupilGeo.scale(0.55, 1.1, 0.4);
    this.leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    this.leftPupil.position.set(0, 0, 0.07);
    this.leftEye.add(this.leftPupil);

    this.rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
    this.rightPupil.position.set(0, 0, 0.07);
    this.rightEye.add(this.rightPupil);

    // Sparkly Eye Glints (Cuteness reflection)
    const glintGeo = new THREE.SphereGeometry(0.022, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, glintMaterial);
    leftGlint.position.set(-0.02, 0.03, 0.08);
    this.leftPupil.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeo, glintMaterial);
    rightGlint.position.set(-0.02, 0.03, 0.08);
    this.rightPupil.add(rightGlint);

    // Eyelids (for blinking & sassy half-closed eyes)
    const eyelidGeo = new THREE.SphereGeometry(0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    eyelidGeo.rotateX(-Math.PI / 2);
    this.leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMaterial);
    this.leftEyelid.position.set(0, 0.06, 0.02);
    this.leftEyelid.scale.set(1, 0.05, 1); // 0.05 = wide open, 1.0 = fully closed
    this.leftEye.add(this.leftEyelid);

    this.rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMaterial);
    this.rightEyelid.position.set(0, 0.06, 0.02);
    this.rightEyelid.scale.set(1, 0.05, 1);
    this.rightEye.add(this.rightEyelid);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.09, 0.02, 0.01);
    this.leftEyebrow = new THREE.Mesh(browGeo, browMaterial);
    this.leftEyebrow.position.set(-0.15, 0.18, 0.28);
    this.headGroup.add(this.leftEyebrow);

    this.rightEyebrow = new THREE.Mesh(browGeo, browMaterial);
    this.rightEyebrow.position.set(0.15, 0.18, 0.28);
    this.headGroup.add(this.rightEyebrow);

    // Whiskers (Flexible bouncy lines)
    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let side = -1; side <= 1; side += 2) {
      for (let w = -1; w <= 1; w++) {
        const whiskerGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(side * 0.14, -0.08 + w * 0.03, 0.3),
          new THREE.Vector3(side * 0.38, -0.06 + w * 0.06, 0.28),
        ]);
        const whiskerLine = new THREE.Line(whiskerGeo, whiskerMat);
        this.headGroup.add(whiskerLine);
        this.whiskers.push(whiskerLine);
      }
    }

    // 3. Tail Group (articulated segments)
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.55, -0.32);
    this.group.add(this.tailGroup);

    let parentNode: THREE.Object3D = this.tailGroup;
    for (let i = 0; i < 5; i++) {
      const segGeo = new THREE.CylinderGeometry(0.06 - i * 0.008, 0.07 - i * 0.008, 0.14, 8);
      segGeo.translate(0, 0.07, 0);
      const segMesh = new THREE.Mesh(segGeo, i === 4 ? accentMaterial : furMaterial);
      segMesh.castShadow = true;
      parentNode.add(segMesh);
      this.tailSegments.push(segMesh);
      parentNode = segMesh;
    }

    // 4. Legs
    const createLeg = (x: number, z: number) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, 0.45, z);

      // Thigh / upper leg
      const upperGeo = new THREE.CapsuleGeometry(0.08, 0.18, 6, 12);
      const upperMesh = new THREE.Mesh(upperGeo, furMaterial);
      upperMesh.position.y = -0.1;
      upperMesh.castShadow = true;
      legGroup.add(upperMesh);

      // Paw / foot
      const pawGeo = new THREE.SphereGeometry(0.09, 10, 10);
      pawGeo.scale(1.1, 0.6, 1.4);
      const pawMesh = new THREE.Mesh(pawGeo, accentMaterial);
      pawMesh.position.set(0, -0.28, 0.04);
      pawMesh.castShadow = true;
      legGroup.add(pawMesh);

      this.group.add(legGroup);
      return legGroup;
    };

    this.legFL = createLeg(-0.2, 0.22);
    this.legFR = createLeg(0.2, 0.22);
    this.legBL = createLeg(-0.2, -0.22);
    this.legBR = createLeg(0.2, -0.22);

    // Accessory Anchor Points
    this.accessoryNodes = {
      head: new THREE.Group(),
      eyes: new THREE.Group(),
      neck: new THREE.Group(),
      body: new THREE.Group(),
      paws: new THREE.Group(),
    };

    this.accessoryNodes.head.position.set(0, 0.32, 0.05);
    this.headGroup.add(this.accessoryNodes.head);

    this.accessoryNodes.eyes.position.set(0, 0.05, 0.32);
    this.headGroup.add(this.accessoryNodes.eyes);

    this.accessoryNodes.neck.position.set(0, 0.58, 0.24);
    this.group.add(this.accessoryNodes.neck);

    this.accessoryNodes.body.position.set(0, 0.48, 0);
    this.group.add(this.accessoryNodes.body);

    this.accessoryNodes.paws.position.set(0, 0.12, 0.22);
    this.group.add(this.accessoryNodes.paws);

    // 5. Special Hide Box Prop (for Play-Hide / Blend-In banter)
    this.boxPropGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.8, 0.7, 0.9);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.9 });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.y = 0.35;
    boxMesh.castShadow = true;
    this.boxPropGroup.add(boxMesh);
    this.boxPropGroup.visible = false;
    this.group.add(this.boxPropGroup);

    // 6. Cute Purr Heart Particles
    const heartGeo = new THREE.BufferGeometry();
    const heartCount = 20;
    const positions = new Float32Array(heartCount * 3);
    for (let i = 0; i < heartCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.5;
      positions[i + 1] = Math.random() * 1.2 + 0.3;
      positions[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    heartGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const heartMat = new THREE.PointsMaterial({
      color: 0xff69b4,
      size: 0.15,
      transparent: true,
      opacity: 0,
    });
    this.heartParticles = new THREE.Points(heartGeo, heartMat);
    this.group.add(this.heartParticles);
  }

  // --- ACCESSORIES ATTACHMENT ---
  public updateAccessories(equipped: PlayerCustomization['equipped']) {
    this.customization = equipped;

    // Remove old accessories
    this.activeAccessories.forEach((acc) => {
      acc.parent?.remove(acc);
    });
    this.activeAccessories = [];

    // 1. Headwear
    if (equipped.head) {
      const headAnchor = this.accessoryNodes.head;
      if (equipped.head === 'head_snapback') {
        const capGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.14, 12);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xcc2936 });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(0, 0, 0);
        capMesh.rotation.set(-0.25, 0, 0);

        // Brim pointing backwards (Gangster style)
        const brimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.02, 12, 1, false, Math.PI * 0.75, Math.PI * 1.5);
        brimGeo.scale(1.1, 1, 1.4);
        const brimMesh = new THREE.Mesh(brimGeo, capMat);
        brimMesh.position.set(0, -0.05, -0.22);
        capMesh.add(brimMesh);

        headAnchor.add(capMesh);
        this.activeAccessories.push(capMesh);
      } else if (equipped.head === 'head_ninja_band') {
        const bandGeo = new THREE.TorusGeometry(0.3, 0.04, 8, 24);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.6 });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.rotation.x = Math.PI / 2.3;
        bandMesh.position.set(0, -0.06, 0.08);

        // Metal forehead plate
        const plateGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0xd8dbe2, metalness: 0.8, roughness: 0.2 });
        const plateMesh = new THREE.Mesh(plateGeo, plateMat);
        plateMesh.position.set(0, -0.04, 0.32);
        headAnchor.add(plateMesh);
        headAnchor.add(bandMesh);
        this.activeAccessories.push(bandMesh, plateMesh);
      } else if (equipped.head === 'head_gold_crown') {
        const crownGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.12, 5);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        const crownMesh = new THREE.Mesh(crownGeo, crownMat);
        crownMesh.position.set(0, 0.08, 0.02);
        crownMesh.rotation.x = 0.15;
        headAnchor.add(crownMesh);
        this.activeAccessories.push(crownMesh);
      }
    }

    // 2. Eyewear
    if (equipped.eyes) {
      const eyeAnchor = this.accessoryNodes.eyes;
      if (equipped.eyes === 'eyes_thug_shades') {
        const shadesGeo = new THREE.BoxGeometry(0.48, 0.1, 0.04);
        const shadesMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
        const shadesMesh = new THREE.Mesh(shadesGeo, shadesMat);
        shadesMesh.position.set(0, 0.02, 0.06);

        // White pixel glints on shades
        const glint1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        glint1.position.set(-0.14, 0.02, 0.025);
        shadesMesh.add(glint1);

        const glint2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.01), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        glint2.position.set(0.1, 0.02, 0.025);
        shadesMesh.add(glint2);

        eyeAnchor.add(shadesMesh);
        this.activeAccessories.push(shadesMesh);
      }
    }

    // 3. Neckwear
    if (equipped.neck) {
      const neckAnchor = this.accessoryNodes.neck;
      if (equipped.neck === 'neck_gold_chain') {
        const chainGeo = new THREE.TorusGeometry(0.28, 0.035, 8, 20);
        const chainMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
        const chainMesh = new THREE.Mesh(chainGeo, chainMat);
        chainMesh.rotation.x = Math.PI / 2.5;

        // Giant dollar / fish coin medallion
        const medalGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16);
        medalGeo.rotateX(Math.PI / 2);
        const medal = new THREE.Mesh(medalGeo, chainMat);
        medal.position.set(0, -0.22, 0.22);
        chainMesh.add(medal);

        neckAnchor.add(chainMesh);
        this.activeAccessories.push(chainMesh);
      } else if (equipped.neck === 'neck_red_bandana') {
        const bandGeo = new THREE.ConeGeometry(0.24, 0.22, 3);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.7 });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.set(0, -0.06, 0.18);
        bandMesh.rotation.set(-0.6, 0, Math.PI);
        neckAnchor.add(bandMesh);
        this.activeAccessories.push(bandMesh);
      }
    }

    // 4. Body
    if (equipped.body) {
      const bodyAnchor = this.accessoryNodes.body;
      if (equipped.body === 'body_camo_hoodie') {
        const hoodieGeo = new THREE.CapsuleGeometry(0.34, 0.38, 8, 16);
        hoodieGeo.rotateX(Math.PI / 2);
        const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x386641, roughness: 0.8 });
        const hoodieMesh = new THREE.Mesh(hoodieGeo, hoodieMat);
        bodyAnchor.add(hoodieMesh);
        this.activeAccessories.push(hoodieMesh);
      }
    }
  }

  // --- FACIAL EXPRESSIONS & ANIMATION TICK ---
  public setExpression(expr: CatExpression) {
    this.currentExpression = expr;
  }

  public getFaceWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.headGroup.getWorldPosition(pos);
    return pos;
  }

  public updateAnimation(state: CatAnimationState, delta: number) {
    const t = state.time;
    const speed = state.speed;

    // --- Dynamic Blinking & Expression Logic ---
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.5 + Math.sin(t * 1.5) * 1.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.7 + Math.sin(t * 1.5) * 1.5) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Ear Twitch timer
    this.earTwitchTimer += delta;
    let earTwitch = 0;
    if (this.earTwitchTimer > 4.0) {
      earTwitch = Math.sin(this.earTwitchTimer * 30) * 0.2;
      if (this.earTwitchTimer > 4.4) {
        this.earTwitchTimer = 0;
      }
    }

    // Apply Expression State
    const expr = state.expression || this.currentExpression;

    if (expr === 'sassy_eyeroll') {
      // Pupils roll up & left, eyelids half closed with bored contempt
      this.leftPupil.position.set(-0.02, 0.04, 0.07);
      this.rightPupil.position.set(0.02, 0.04, 0.07);
      this.leftEyelid.scale.y = 0.55;
      this.rightEyelid.scale.y = 0.55;
      this.leftEyebrow.rotation.z = -0.3;
      this.rightEyebrow.rotation.z = 0.3;
      this.tongueMesh.scale.set(0, 0, 0);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0;
    } else if (expr === 'cute_blep') {
      // Big cute round eyes + pink tongue sticking out!
      this.leftPupil.position.set(0, 0, 0.07);
      this.rightPupil.position.set(0, 0, 0.07);
      this.leftEyelid.scale.y = this.isBlinking ? 1.0 : 0.05;
      this.rightEyelid.scale.y = this.isBlinking ? 1.0 : 0.05;
      this.leftEyebrow.rotation.z = 0.1;
      this.rightEyebrow.rotation.z = -0.1;
      // Stick tongue out!
      this.tongueMesh.scale.set(1, 1 + Math.sin(t * 8) * 0.15, 1);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.85;
      (this.rightCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.85;
    } else if (expr === 'gangster_smirk') {
      // One eyebrow raised, sharp slit pupil, confident smirk
      this.leftPupil.position.set(0, 0, 0.07);
      this.rightPupil.position.set(0, 0, 0.07);
      this.leftEyelid.scale.y = 0.35;
      this.rightEyelid.scale.y = 0.15;
      this.leftEyebrow.position.y = 0.22;
      this.leftEyebrow.rotation.z = 0.25;
      this.rightEyebrow.rotation.z = -0.3;
      this.tongueMesh.scale.set(0, 0, 0);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0;
    } else if (expr === 'shocked_busted') {
      // Huge wide pupils, ears pinned back!
      this.leftPupil.position.set(0, 0, 0.07);
      this.rightPupil.position.set(0, 0, 0.07);
      this.leftEyelid.scale.y = 0.02;
      this.rightEyelid.scale.y = 0.02;
      this.leftEar.rotation.z = 0.7; // airplane ears!
      this.rightEar.rotation.z = -0.7;
      this.leftEyebrow.position.y = 0.24;
      this.rightEyebrow.position.y = 0.24;
      this.tongueMesh.scale.set(0, 0, 0);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0;
    } else if (expr === 'angry_hiss') {
      // Angry airplane ears flat out, narrowed slit eyes, arched pose
      this.leftPupil.position.set(0, 0, 0.07);
      this.rightPupil.position.set(0, 0, 0.07);
      this.leftEyelid.scale.y = 0.6;
      this.rightEyelid.scale.y = 0.6;
      this.leftEar.rotation.z = 0.88; // extreme flat airplane ears!
      this.rightEar.rotation.z = -0.88;
      this.leftEyebrow.position.y = 0.16;
      this.leftEyebrow.rotation.z = -0.45;
      this.rightEyebrow.position.y = 0.16;
      this.rightEyebrow.rotation.z = 0.45;
      this.tongueMesh.scale.set(0.5, 0.5, 0.5); // hiss mouth
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0;
    } else if (expr === 'happy_purr' || state.action === 'purr') {
      // Happy curved closed eyelids, glowing blush cheeks, vibrating whiskers
      this.leftEyelid.scale.y = 0.88;
      this.rightEyelid.scale.y = 0.88;
      this.leftEyebrow.rotation.z = 0.15;
      this.rightEyebrow.rotation.z = -0.15;
      this.tongueMesh.scale.set(0, 0, 0);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.95;
      (this.rightCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.95;
    } else if (expr === 'sleepy_loaf' || state.action === 'nap') {
      // Softly closed eyes, relaxed ears
      this.leftEyelid.scale.y = 0.95;
      this.rightEyelid.scale.y = 0.95;
      this.leftEar.rotation.z = 0.45;
      this.rightEar.rotation.z = -0.45;
      this.tongueMesh.scale.set(0, 0, 0);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.6;
      (this.rightCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.6;
    } else {
      // Default natural eye state with blinking
      this.leftEyelid.scale.y = this.isBlinking ? 1.0 : 0.05;
      this.rightEyelid.scale.y = this.isBlinking ? 1.0 : 0.05;
      this.leftPupil.position.set(0, 0, 0.07);
      this.rightPupil.position.set(0, 0, 0.07);
      this.tongueMesh.scale.set(0, 0, 0);
      (this.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    // Ear animations with twitches
    if (expr !== 'shocked_busted') {
      this.leftEar.rotation.z = 0.35 + earTwitch;
      this.rightEar.rotation.z = -0.35 - (earTwitch > 0 ? 0 : earTwitch);
    }

    // Whiskers wiggle
    this.whiskers.forEach((w, idx) => {
      w.rotation.z = Math.sin(t * 10 + idx) * 0.08;
    });

    // Reset default visibility for props
    this.boxPropGroup.visible = false;
    (this.heartParticles.material as THREE.PointsMaterial).opacity = 0;

    // --- 1. INNOCENT PERSONA MODE / LOAF / NAP ---
    if (state.isInnocent || state.action === 'blend_in' || state.action === 'nap') {
      // Cute loaf pose: tuck legs, tilt head sideways, innocent big eyes
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.28, 0.15);
      this.headGroup.position.set(0, 0.45, 0.32);
      this.headGroup.rotation.z = Math.sin(t * 2) * 0.12 + 0.15; // cute head tilt
      this.headGroup.rotation.x = -0.1;

      this.legFL.position.set(-0.18, 0.22, 0.12);
      this.legFR.position.set(0.18, 0.22, 0.12);
      this.legBL.position.set(-0.18, 0.22, -0.12);
      this.legBR.position.set(0.18, 0.22, -0.12);

      this.legFL.rotation.set(0.8, 0, -0.2);
      this.legFR.rotation.set(0.8, 0, 0.2);
      this.legBL.rotation.set(-0.8, 0, -0.2);
      this.legBR.rotation.set(-0.8, 0, 0.2);

      // Tail curls comfortably around body
      this.tailSegments.forEach((seg) => {
        seg.rotation.y = 0.4;
        seg.rotation.z = 0.2;
      });

      // Subtle breathing
      const breath = Math.sin(t * 3.5) * 0.02;
      this.bodyMesh.scale.set(1 + breath, 1 + breath, 1 + breath);
      return;
    }

    // --- 2. BANTER ACTION ANIMATIONS ---
    if (state.action === 'tickle') {
      this.bodyMesh.position.y = 0.55;
      this.bodyMesh.rotation.x = -0.6; // standing upright
      this.headGroup.position.set(0, 0.95, 0.2);
      this.headGroup.rotation.x = -0.2;

      const tickleSpd = t * 25;
      this.legFL.rotation.x = Math.sin(tickleSpd) * 0.8 - 0.4;
      this.legFR.rotation.x = -Math.sin(tickleSpd) * 0.8 - 0.4;
      this.legFL.rotation.z = Math.cos(tickleSpd) * 0.4;
      this.legFR.rotation.z = -Math.cos(tickleSpd) * 0.4;

      this.legBL.position.y = 0.35;
      this.legBR.position.y = 0.35;
      return;
    }

    if (state.action === 'dance') {
      // Gangsta breakdance: spinning on ground / back
      this.bodyMesh.position.y = 0.35 + Math.abs(Math.sin(t * 10)) * 0.15;
      this.group.rotation.y += delta * 12; // fast spin
      this.bodyMesh.rotation.z = Math.sin(t * 12) * 0.8;
      this.headGroup.rotation.x = Math.sin(t * 15) * 0.4;

      this.legFL.rotation.x = Math.sin(t * 14) * 1.2;
      this.legFR.rotation.x = Math.cos(t * 14) * 1.2;
      this.legBL.rotation.x = -Math.sin(t * 14) * 1.2;
      this.legBR.rotation.x = -Math.cos(t * 14) * 1.2;
      return;
    }

    if (state.action === 'purr') {
      // Harmonic vibrating purr with hearts
      this.bodyMesh.position.y = 0.42;
      this.headGroup.position.set(0, 0.65, 0.32);
      this.headGroup.rotation.x = Math.sin(t * 30) * 0.05; // micro vibration

      const vib = Math.sin(t * 35) * 0.03;
      this.bodyMesh.position.x = vib;

      // Show heart particle aura
      (this.heartParticles.material as THREE.PointsMaterial).opacity = 0.9;
      this.heartParticles.rotation.y += delta * 2;
      return;
    }

    if (state.action === 'play_hide') {
      // Cardboard box surprise peek-a-boo
      this.boxPropGroup.visible = true;
      const peek = (Math.sin(t * 4) + 1) * 0.5; // 0 to 1
      this.headGroup.position.set(0, 0.4 + peek * 0.4, 0.25);
      this.headGroup.rotation.x = (1 - peek) * 0.5;
      this.bodyMesh.position.y = 0.28;
      return;
    }

    if (state.action === 'mischief_prank') {
      // High paw slap / sprint swipe
      this.bodyMesh.position.y = 0.5;
      this.bodyMesh.rotation.z = Math.sin(t * 16) * 0.3;
      this.legFR.rotation.x = -1.4 + Math.sin(t * 20) * 0.8; // big swipe paw
      this.legFL.rotation.x = 0.2;
      return;
    }

    if (state.action === 'ride_vacuum') {
      // Standing proudly on the vacuum like a captain
      this.bodyMesh.position.y = 0.48;
      this.headGroup.position.set(0, 0.8, 0.35);
      this.headGroup.rotation.x = -0.15;
      this.tailSegments.forEach((seg, idx) => {
        seg.rotation.x = 0.2 + Math.sin(t * 5 + idx) * 0.2;
      });
      return;
    }

    // --- 3. WALL CLIMBING ---
    if (state.isClimbing || state.action === 'climb') {
      this.bodyMesh.position.y = 0.48;
      this.bodyMesh.rotation.x = Math.PI / 2.2; // vertical against wall
      this.headGroup.rotation.x = -0.7; // looking up

      const climbCycle = t * 12;
      this.legFL.rotation.x = Math.sin(climbCycle) * 0.7 - 0.5;
      this.legFR.rotation.x = -Math.sin(climbCycle) * 0.7 - 0.5;
      this.legBL.rotation.x = -Math.sin(climbCycle) * 0.7 + 0.3;
      this.legBR.rotation.x = Math.sin(climbCycle) * 0.7 + 0.3;
      return;
    }

    // --- 4. AIR / JUMP / DASH ---
    if (!state.isGrounded || state.action === 'jump' || state.action === 'dash') {
      this.bodyMesh.rotation.x = state.action === 'dash' ? -0.4 : -0.2;
      this.headGroup.rotation.x = 0.2;

      // Streamlined aerial paw spread
      this.legFL.rotation.x = -0.7;
      this.legFR.rotation.x = -0.7;
      this.legBL.rotation.x = 0.8;
      this.legBR.rotation.x = 0.8;

      this.tailSegments.forEach((seg) => {
        seg.rotation.x = 0.3;
      });
      return;
    }

    // --- 5. RUNNING & WALKING ---
    if (speed > 0.1) {
      const walkFreq = speed > 5 ? t * 18 : t * 12;
      const walkAmp = speed > 5 ? 0.75 : 0.45;

      // Bobbing body
      this.bodyMesh.position.y = 0.48 + Math.abs(Math.sin(walkFreq * 2)) * 0.06;
      this.bodyMesh.rotation.z = Math.sin(walkFreq) * 0.08;
      this.headGroup.position.set(0, 0.75 + Math.sin(walkFreq * 2) * 0.03, 0.35);

      // Quadruped trot gait (diagonal leg pairs)
      this.legFL.rotation.x = Math.sin(walkFreq) * walkAmp;
      this.legBR.rotation.x = Math.sin(walkFreq) * walkAmp;
      this.legFR.rotation.x = -Math.sin(walkFreq) * walkAmp;
      this.legBL.rotation.x = -Math.sin(walkFreq) * walkAmp;

      // Tail swagger
      this.tailSegments.forEach((seg, i) => {
        seg.rotation.z = Math.sin(walkFreq + i) * 0.25;
      });
    } else {
      // --- 6. IDLE GANGSTER / NINJA SWAGGER ---
      this.bodyMesh.position.y = 0.48 + Math.sin(t * 2) * 0.02;
      this.bodyMesh.rotation.set(0, 0, 0);
      this.headGroup.position.set(0, 0.75, 0.35);
      this.headGroup.rotation.set(0, Math.sin(t * 1.2) * 0.15, 0);

      this.legFL.rotation.set(0, 0, 0);
      this.legFR.rotation.set(0, 0, 0);
      this.legBL.rotation.set(0, 0, 0);
      this.legBR.rotation.set(0, 0, 0);
    }
  }
}
