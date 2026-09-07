import * as THREE from 'three';
import { HumanNpc, BanterType } from '../types/game';
import { soundEngine } from '../utils/audio';

export class HumanAIManager {
  public scene: THREE.Scene;
  public humans: {
    data: HumanNpc;
    mesh: THREE.Group;
    body: THREE.Mesh;
    head: THREE.Group;
    hair: THREE.Group;
    leftEye: THREE.Mesh;
    rightEye: THREE.Mesh;
    leftEyelid: THREE.Mesh;
    rightEyelid: THREE.Mesh;
    leftCheekBlush: THREE.Mesh;
    rightCheekBlush: THREE.Mesh;
    mouth: THREE.Mesh;
    puckeredLips?: THREE.Mesh;
    armLeftGroup: THREE.Group;
    armRightGroup: THREE.Group;
    legLeftGroup: THREE.Group;
    legRightGroup: THREE.Group;
    calfLeft: THREE.Mesh;
    calfRight: THREE.Mesh;
    flashlight: THREE.SpotLight;
    visionConeMesh: THREE.Mesh;
    exclamationMesh: THREE.Mesh;
    heartMesh: THREE.Mesh;
    kissHeartParticles?: THREE.Group;
    isKissMonster?: boolean;
    meowSlowTimer: number;
  }[] = [];

  // 5-Minute Investigation Surge Timer
  public surgeInterval: number = 300;
  public surgeTimer: number = 300;
  public isSurgeActive: boolean = false;
  public surgeDurationRemaining: number = 0;

  // Scary Kiss Monster & Insane Mode State
  public isKissHuntActive: boolean = false;
  public kissHuntTimer: number = 0;
  public isInsaneModeActive: boolean = false;
  public insaneModeTimer: number = 0; // 3 minutes = 180s

  // Hiss Stun State (Stuns humans for 10 seconds only, reload 5 mins)
  public hissStunTimer: number = 0;

  // 14 Waypoints across the 320m x 320m grand mansion & Maze Garden
  private waypoints: THREE.Vector3[] = [
    new THREE.Vector3(-35, 0, -10),  // 1. Living room sofa lounge
    new THREE.Vector3(28, 0, 20),    // 2. Grand Banquet Dining
    new THREE.Vector3(26, 0, -22),   // 3. Gourmet Kitchen Island
    new THREE.Vector3(0, 0, 0),      // 4. Central Grand Atrium
    new THREE.Vector3(-25, 0, -42),  // 5. Bedroom Study Desk
    new THREE.Vector3(12, 0, -52),   // 6. Marble Spa Bathroom
    new THREE.Vector3(-24, 0, 36),   // 7. Grand Staircase
    new THREE.Vector3(0, 0, 92),     // 8. Botanical Sunroom Garden
    new THREE.Vector3(-72, 0, -84),  // 9. Master Suite Canopy Bed
    new THREE.Vector3(62, 0, 58),    // 10. East Banquet Mezzanine
    new THREE.Vector3(-55, 0, 24),   // 11. West Library Reading Den
    new THREE.Vector3(42, 0, -48),   // 12. Wine Cellar & Pantry Archway
    new THREE.Vector3(75, 0, 75),    // 13. Maze Garden Winding Alley
    new THREE.Vector3(95, 0, 105),   // 14. Maze Garden Central Gazebo
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnHumans();
  }

  private spawnHumans() {
    // 12 Distinct Humans in Total roaming the Mansion!
    const humanConfigs = [
      // 1. SCARY / DISGUSTING KISS MONSTER HUMAN (Aunt Gertrude)
      {
        role: 'kiss_hunter' as const,
        name: 'Aunt Gertrude (The Kiss Monster)',
        shirtColor: 0x831843, // garish dark magenta dress
        pantsColor: 0x4c0519,
        shoeColor: 0x9f1239,
        skinColor: 0xc8f0d8, // spooky greenish sickly pale skin
        hairColor: 0x94a3b8, // wild frizzy gray hair
        hairStyle: 'wild_frizz',
        eyeColor: 0xdc2626,  // bulging bloodshot red eyes
        item: 'lipstick_kiss',
        isKissMonster: true,
      },
      // 2. Uncle Bob (Loud Hawaiian Vacationer)
      {
        role: 'homeowner' as const,
        name: 'Uncle Bob (Hawaiian Vacationer)',
        shirtColor: 0xf97316, // loud orange tropical print
        pantsColor: 0xd97706,
        shoeColor: 0x78350f,
        skinColor: 0xf5c29b,
        hairColor: 0x4b5563,
        hairStyle: 'side_part',
        eyeColor: 0x1d4ed8,
        item: 'coffee_mug',
        isKissMonster: false,
      },
      // 3. Grandma Ethel (Knit Cardigan & Treats)
      {
        role: 'pet_parent' as const,
        name: 'Grandma Ethel (Cat Treat Dispenser)',
        shirtColor: 0xc084fc, // soft lavender sweater
        pantsColor: 0x6b21a8,
        shoeColor: 0x18181b,
        skinColor: 0xffdfba,
        hairColor: 0xe2e8f0, // silver bun
        hairStyle: 'high_bun',
        eyeColor: 0x059669,
        item: 'cat_teaser_wand',
        isKissMonster: false,
      },
      // 4. Alex (Homeowner & Coffee Lover)
      {
        role: 'homeowner' as const,
        name: 'Alex (Homeowner & Coffee Lover)',
        shirtColor: 0x2563eb,
        pantsColor: 0x1e293b,
        shoeColor: 0xffffff,
        skinColor: 0xfbd0b3,
        hairColor: 0x3d2314,
        hairStyle: 'side_part',
        eyeColor: 0x3b82f6,
        item: 'coffee_mug',
        isKissMonster: false,
      },
      // 5. Mrs. Higgins (Snack Provider & Feather Duster)
      {
        role: 'cleaner' as const,
        name: 'Mrs. Higgins (Housekeeper)',
        shirtColor: 0xb91c1c,
        pantsColor: 0x334155,
        shoeColor: 0x18181b,
        skinColor: 0xf5c29b,
        hairColor: 0x5a3825,
        hairStyle: 'high_bun',
        eyeColor: 0x10b981,
        item: 'feather_duster',
        isKissMonster: false,
      },
      // 6. Marcus (Tech Worker with Headset & Laptop)
      {
        role: 'snack_chef' as const,
        name: 'Marcus (Tech Worker with Headset)',
        shirtColor: 0x059669,
        pantsColor: 0x0f172a,
        shoeColor: 0xef4444,
        skinColor: 0x8d5524,
        hairColor: 0x111827,
        hairStyle: 'curly_fade',
        eyeColor: 0x78350f,
        item: 'laptop_and_headset',
        isKissMonster: false,
      },
      // 7. Sam (The Cat Enthusiast)
      {
        role: 'pet_parent' as const,
        name: 'Sam (The Cat Enthusiast)',
        shirtColor: 0x9333ea,
        pantsColor: 0x475569,
        shoeColor: 0xf8fafc,
        skinColor: 0xffdfba,
        hairColor: 0xd97706,
        hairStyle: 'long_layers',
        eyeColor: 0x0284c7,
        item: 'cat_teaser_wand',
        isKissMonster: false,
      },
      // 8. Cousin Timmy (Hyperactive Kid)
      {
        role: 'homeowner' as const,
        name: 'Cousin Timmy (Laser Pointer Kid)',
        shirtColor: 0xeab308, // bright golden yellow
        pantsColor: 0x1d4ed8,
        shoeColor: 0x84cc16,
        skinColor: 0xfbd0b3,
        hairColor: 0xb45309,
        hairStyle: 'wild_frizz',
        eyeColor: 0x0ea5e9,
        item: 'coffee_mug',
        isKissMonster: false,
      },
      // 9. Butler James (Formal Mansion Butler)
      {
        role: 'cleaner' as const,
        name: 'Butler James (Formal Tuxedo)',
        shirtColor: 0x09090b, // sleek black tuxedo
        pantsColor: 0x18181b,
        shoeColor: 0x000000,
        skinColor: 0xf5c29b,
        hairColor: 0x64748b,
        hairStyle: 'side_part',
        eyeColor: 0x334155,
        item: 'feather_duster',
        isKissMonster: false,
      },
      // 10. Chef Pierre (Gourmet Executive Chef)
      {
        role: 'snack_chef' as const,
        name: 'Chef Pierre (Culinary Artist)',
        shirtColor: 0xf8fafc, // crisp white chef coat
        pantsColor: 0x334155,
        shoeColor: 0x18181b,
        skinColor: 0xffdfba,
        hairColor: 0x1c1917,
        hairStyle: 'curly_fade',
        eyeColor: 0x713f12,
        item: 'coffee_mug',
        isKissMonster: false,
      },
      // 11. Dr. Emily (The Cat Veterinarian)
      {
        role: 'pet_parent' as const,
        name: 'Dr. Emily (Veterinarian)',
        shirtColor: 0x0891b2, // medical scrubs cyan
        pantsColor: 0x155e75,
        shoeColor: 0xffffff,
        skinColor: 0xfbd0b3,
        hairColor: 0xa16207,
        hairStyle: 'long_layers',
        eyeColor: 0x059669,
        item: 'cat_teaser_wand',
        isKissMonster: false,
      },
      // 12. Neighbor Karen (Tracksuit & Visor)
      {
        role: 'kiss_hunter' as const,
        name: 'Neighbor Karen (Tracksuit & Visor)',
        shirtColor: 0xdb2777, // hot magenta tracksuit
        pantsColor: 0xbe185d,
        shoeColor: 0xffffff,
        skinColor: 0xf5c29b,
        hairColor: 0xfacc15, // blonde bob
        hairStyle: 'side_part',
        eyeColor: 0x2563eb,
        item: 'lipstick_kiss',
        isKissMonster: false,
      },
    ];

    humanConfigs.forEach((cfg, idx) => {
      const group = new THREE.Group();
      const startPos = this.waypoints[(idx * 2) % this.waypoints.length].clone();
      startPos.y = 0;
      group.position.copy(startPos);
      // 20% increased human size for imposing presence!
      group.scale.set(1.2, 1.2, 1.2);

      const skinMat = new THREE.MeshStandardMaterial({
        color: cfg.skinColor,
        roughness: cfg.isKissMonster ? 0.9 : 0.6,
        metalness: 0.05,
      });

      const shirtMat = new THREE.MeshStandardMaterial({
        color: cfg.shirtColor,
        roughness: 0.75,
        metalness: 0.05,
      });

      const pantsMat = new THREE.MeshStandardMaterial({
        color: cfg.pantsColor,
        roughness: 0.85,
        metalness: 0.02,
      });

      const shoeMat = new THREE.MeshStandardMaterial({
        color: cfg.shoeColor,
        roughness: 0.4,
      });

      const hairMat = new THREE.MeshStandardMaterial({
        color: cfg.hairColor,
        roughness: 0.9,
      });

      const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: cfg.isKissMonster ? 0xffcccc : 0xffffff });
      const eyeIrisMat = new THREE.MeshStandardMaterial({ color: cfg.eyeColor, roughness: 0.2 });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mouthMat = new THREE.MeshStandardMaterial({
        color: cfg.isKissMonster ? 0xdc2626 : 0xc94a5e,
        roughness: 0.4,
      });
      const browMat = new THREE.MeshBasicMaterial({ color: cfg.hairColor });
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.0 });

      // 1. TORSO & UPPER BODY
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, 1.45, 0);
      if (cfg.isKissMonster) {
        // Hunched crooked posture
        torsoGroup.rotation.x = 0.25;
      }
      group.add(torsoGroup);

      const chestGeo = new THREE.BoxGeometry(0.58, 0.48, 0.32);
      const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
      chestMesh.position.set(0, 0.26, 0);
      chestMesh.castShadow = true;
      torsoGroup.add(chestMesh);

      const waistGeo = new THREE.BoxGeometry(0.52, 0.38, 0.3);
      const waistMesh = new THREE.Mesh(waistGeo, shirtMat);
      waistMesh.position.set(0, -0.12, 0);
      waistMesh.castShadow = true;
      torsoGroup.add(waistMesh);

      // Belt
      const beltGeo = new THREE.BoxGeometry(0.53, 0.08, 0.31);
      const beltMesh = new THREE.Mesh(beltGeo, new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 }));
      beltMesh.position.set(0, -0.28, 0);
      torsoGroup.add(beltMesh);

      // Neck
      const neckGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.22, 12);
      const neckMesh = new THREE.Mesh(neckGeo, skinMat);
      neckMesh.position.set(0, 0.58, 0);
      neckMesh.castShadow = true;
      torsoGroup.add(neckMesh);

      // 2. HEAD GROUP
      const headGroup = new THREE.Group();
      headGroup.position.set(0, cfg.isKissMonster ? 2.15 : 2.3, cfg.isKissMonster ? 0.15 : 0);
      group.add(headGroup);

      // Cranium / Face base
      const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
      headGeo.scale(1.0, 1.15, 1.05);
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      // Chin
      const chinGeo = new THREE.SphereGeometry(0.1, 10, 10);
      chinGeo.scale(0.9, 0.7, 0.9);
      const chinMesh = new THREE.Mesh(chinGeo, skinMat);
      chinMesh.position.set(0, -0.2, 0.12);
      headGroup.add(chinMesh);

      // Ears
      const earGeo = new THREE.SphereGeometry(0.06, 8, 8);
      earGeo.scale(0.4, 1.2, 0.8);
      const earL = new THREE.Mesh(earGeo, skinMat);
      earL.position.set(-0.24, 0.02, -0.02);
      earL.rotation.y = -0.2;
      headGroup.add(earL);

      const earR = new THREE.Mesh(earGeo, skinMat);
      earR.position.set(0.24, 0.02, -0.02);
      earR.rotation.y = 0.2;
      headGroup.add(earR);

      // Nose
      const noseBridgeGeo = new THREE.BoxGeometry(cfg.isKissMonster ? 0.07 : 0.04, 0.12, 0.07);
      const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMat);
      noseBridge.position.set(0, 0.02, 0.24);
      headGroup.add(noseBridge);

      // Mouth / Puckered Lipstick Lips
      let puckeredLips: THREE.Mesh | undefined;
      const mouthGeo = new THREE.CapsuleGeometry(cfg.isKissMonster ? 0.04 : 0.018, cfg.isKissMonster ? 0.14 : 0.06, 4, 8);
      mouthGeo.rotateZ(Math.PI / 2);
      const mouth = new THREE.Mesh(mouthGeo, mouthMat);
      mouth.position.set(0, -0.12, 0.23);
      headGroup.add(mouth);

      if (cfg.isKissMonster) {
        // GIANT PUCKERED RED LIPSTICK LIPS SNOUT
        const kissLipsGeo = new THREE.TorusGeometry(0.08, 0.04, 8, 16);
        kissLipsGeo.rotateX(Math.PI / 2);
        const kissLipsMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0x991b1b,
          emissiveIntensity: 0.8,
          roughness: 0.3,
        });
        puckeredLips = new THREE.Mesh(kissLipsGeo, kissLipsMat);
        puckeredLips.position.set(0, -0.12, 0.32);
        headGroup.add(puckeredLips);
      }

      // Cheeks Blush
      const blushGeo = new THREE.SphereGeometry(0.05, 8, 8);
      blushGeo.scale(1.2, 0.6, 0.3);
      const leftCheekBlush = new THREE.Mesh(blushGeo, blushMat);
      leftCheekBlush.position.set(-0.14, -0.06, 0.2);
      headGroup.add(leftCheekBlush);

      const rightCheekBlush = new THREE.Mesh(blushGeo, blushMat.clone());
      rightCheekBlush.position.set(0.14, -0.06, 0.2);
      headGroup.add(rightCheekBlush);

      // 3D Eyes
      const createEye = (isLeft: boolean) => {
        const eyeGroup = new THREE.Group();
        const side = isLeft ? -1 : 1;
        eyeGroup.position.set(side * (cfg.isKissMonster ? 0.11 : 0.09), 0.04, 0.21);

        const eyeRadius = cfg.isKissMonster ? 0.055 : 0.042;
        const scleraGeo = new THREE.SphereGeometry(eyeRadius, 12, 12);
        const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMat);
        eyeGroup.add(sclera);

        const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.65, 10, 10);
        const iris = new THREE.Mesh(irisGeo, eyeIrisMat);
        iris.position.set(0, 0, eyeRadius * 0.5);
        eyeGroup.add(iris);

        const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.35, 8, 8);
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(0, 0, eyeRadius * 0.75);
        eyeGroup.add(pupil);

        const glintGeo = new THREE.SphereGeometry(0.01, 6, 6);
        const glint = new THREE.Mesh(glintGeo, glintMat);
        glint.position.set(side * 0.012, 0.015, eyeRadius * 0.85);
        eyeGroup.add(glint);

        const eyelidGeo = new THREE.SphereGeometry(eyeRadius + 0.005, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const eyelid = new THREE.Mesh(eyelidGeo, skinMat);
        eyelid.rotation.x = -Math.PI / 2 + 0.2;
        eyelid.position.set(0, 0, 0);
        eyeGroup.add(eyelid);

        headGroup.add(eyeGroup);
        return { eyeGroup, eyelid, sclera };
      };

      const leftEyeObj = createEye(true);
      const rightEyeObj = createEye(false);

      // Eyebrows
      const createEyebrow = (isLeft: boolean) => {
        const side = isLeft ? -1 : 1;
        const browGeo = new THREE.CapsuleGeometry(0.012, 0.08, 4, 8);
        browGeo.rotateZ(Math.PI / 2);
        const brow = new THREE.Mesh(browGeo, browMat);
        brow.position.set(side * 0.09, 0.11, 0.22);
        brow.rotation.z = side * (cfg.isKissMonster ? 0.35 : 0.08);
        headGroup.add(brow);
        return brow;
      };
      createEyebrow(true);
      createEyebrow(false);

      // 3. HAIR MESH
      const hairGroup = new THREE.Group();
      if (cfg.isKissMonster) {
        // Wild frizzy hair clumps
        for (let i = 0; i < 8; i++) {
          const clumpGeo = new THREE.SphereGeometry(0.12, 6, 6);
          const clump = new THREE.Mesh(clumpGeo, hairMat);
          clump.position.set((Math.random() - 0.5) * 0.35, 0.15 + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.25);
          hairGroup.add(clump);
        }
      } else {
        const hairCapGeo = new THREE.SphereGeometry(0.255, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
        const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
        hairCap.position.set(0, 0.04, -0.02);
        hairGroup.add(hairCap);
      }
      headGroup.add(hairGroup);

      // 4. ARMS & HANDS
      const createArm = (isLeft: boolean) => {
        const armGroup = new THREE.Group();
        const side = isLeft ? -1 : 1;
        armGroup.position.set(side * 0.36, 1.95, 0);

        const bicepGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.38, 10);
        bicepGeo.translate(0, -0.19, 0);
        const bicep = new THREE.Mesh(bicepGeo, shirtMat);
        bicep.castShadow = true;
        armGroup.add(bicep);

        const forearmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.38, 10);
        forearmGeo.translate(0, -0.19, 0);
        const forearm = new THREE.Mesh(forearmGeo, skinMat);
        forearm.position.set(0, -0.38, 0);
        forearm.castShadow = true;
        armGroup.add(forearm);

        const handGeo = new THREE.BoxGeometry(0.09, 0.12, 0.05);
        const hand = new THREE.Mesh(handGeo, skinMat);
        hand.position.set(0, -0.22, 0);
        forearm.add(hand);

        if (cfg.isKissMonster) {
          // Reaching grabbing hands forward!
          armGroup.rotation.x = -Math.PI / 2.5;
        }

        group.add(armGroup);
        return armGroup;
      };

      const armLeftGroup = createArm(true);
      const armRightGroup = createArm(false);

      // 5. LEGS & FEET
      const createLeg = (isLeft: boolean) => {
        const legGroup = new THREE.Group();
        const side = isLeft ? -1 : 1;
        legGroup.position.set(side * 0.16, 1.15, 0);

        const thighGeo = new THREE.CylinderGeometry(0.095, 0.08, 0.52, 10);
        thighGeo.translate(0, -0.26, 0);
        const thigh = new THREE.Mesh(thighGeo, pantsMat);
        thigh.castShadow = true;
        legGroup.add(thigh);

        const calfGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.52, 10);
        calfGeo.translate(0, -0.26, 0);
        const calf = new THREE.Mesh(calfGeo, pantsMat);
        calf.position.set(0, -0.52, 0);
        calf.castShadow = true;
        legGroup.add(calf);

        const shoeGeo = new THREE.BoxGeometry(0.12, 0.1, 0.24);
        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.position.set(0, -0.28, 0.05);
        shoe.castShadow = true;
        calf.add(shoe);

        group.add(legGroup);
        return { legGroup, calf };
      };

      const legLeftObj = createLeg(true);
      const legRightObj = createLeg(false);

      // 6. FLASHLIGHT & CONE OF VISION
      const flashlight = new THREE.SpotLight(cfg.isKissMonster ? 0xf43f5e : 0xfffae0, 2.5, 24, Math.PI / 4, 0.4, 1.1);
      flashlight.position.set(0, 1.8, 0.2);
      flashlight.castShadow = true;
      group.add(flashlight);

      const coneGeo = new THREE.ConeGeometry(7, 18, 16, 1, true);
      coneGeo.rotateX(-Math.PI / 2);
      coneGeo.translate(0, 0, 9);
      const coneMat = new THREE.MeshBasicMaterial({
        color: cfg.isKissMonster ? 0xf43f5e : 0xfde047,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const visionConeMesh = new THREE.Mesh(coneGeo, coneMat);
      visionConeMesh.position.set(0, 1.8, 0);
      group.add(visionConeMesh);

      // 7. EXCLAMATION / ALERT BUBBLE
      const alertGeo = new THREE.ConeGeometry(0.18, 0.6, 8);
      alertGeo.rotateX(Math.PI);
      const alertMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const exclamationMesh = new THREE.Mesh(alertGeo, alertMat);
      exclamationMesh.position.set(0, 2.8, 0);
      exclamationMesh.visible = false;
      group.add(exclamationMesh);

      // 8. FLOATING LOVE / KISS HEART
      const heartGeo = new THREE.SphereGeometry(0.2, 8, 8);
      heartGeo.scale(1.2, 1.2, 0.5);
      const heartMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
      const heartMesh = new THREE.Mesh(heartGeo, heartMat);
      heartMesh.position.set(0, 2.8, 0);
      heartMesh.visible = false;
      group.add(heartMesh);

      // Floating Kiss Heart Particles for Kiss Monster
      let kissHeartParticles: THREE.Group | undefined;
      if (cfg.isKissMonster) {
        kissHeartParticles = new THREE.Group();
        for (let k = 0; k < 6; k++) {
          const kGeo = new THREE.SphereGeometry(0.08, 6, 6);
          const kMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
          const kMesh = new THREE.Mesh(kGeo, kMat);
          kMesh.position.set((Math.random() - 0.5) * 1.2, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 1.2);
          kissHeartParticles.add(kMesh);
        }
        group.add(kissHeartParticles);
      }

      this.scene.add(group);

      const humanData: HumanNpc = {
        id: `human_${idx + 1}`,
        name: cfg.name,
        role: cfg.role,
        position: { x: group.position.x, y: group.position.y, z: group.position.z },
        rotation: 0,
        state: 'patrolling',
        suspicion: 0,
        visionAngle: Math.PI / 3.5,
        visionDistance: 18,
        stateTimer: 0,
        isKissMonster: cfg.isKissMonster,
      };

      this.humans.push({
        data: humanData,
        mesh: group,
        body: chestMesh,
        head: headGroup,
        hair: hairGroup,
        leftEye: leftEyeObj.sclera,
        rightEye: rightEyeObj.sclera,
        leftEyelid: leftEyeObj.eyelid,
        rightEyelid: rightEyeObj.eyelid,
        leftCheekBlush: leftCheekBlush,
        rightCheekBlush: rightCheekBlush,
        mouth: mouth,
        puckeredLips: puckeredLips,
        armLeftGroup: armLeftGroup,
        armRightGroup: armRightGroup,
        legLeftGroup: legLeftObj.legGroup,
        legRightGroup: legRightObj.legGroup,
        calfLeft: legLeftObj.calf,
        calfRight: legRightObj.calf,
        flashlight: flashlight,
        visionConeMesh: visionConeMesh,
        exclamationMesh: exclamationMesh,
        heartMesh: heartMesh,
        kissHeartParticles: kissHeartParticles,
        isKissMonster: cfg.isKissMonster,
        meowSlowTimer: 0,
      });
    });
  }

  // Meow Sonic Wave Effect: Charms & drastically slows down all humans in earshot!
  public applyMeowWave(catPos: THREE.Vector3, onHumanDialogue?: (dialogue: string) => void): number {
    let affectedCount = 0;
    const hearingRadius = 45.0; // 45m hearing range across the grand mansion

    const dialogues = [
      'Awww! Did you hear that precious meow?! 🐾',
      'Wait, listen! Such a sweet little kitty voice!',
      'Oh my heart! Where is that adorable kitten?!',
      'Hold on, I have to find that cute cat!',
      'Such a polite meow! Come here sweetie!',
    ];

    this.humans.forEach((h) => {
      const dist = h.mesh.position.distanceTo(catPos);
      if (dist <= hearingRadius) {
        affectedCount++;
        h.meowSlowTimer = 6.5; // Slowed for 6.5 full seconds!
        h.data.suspicion = Math.max(0, h.data.suspicion - 45); // Meow disarms suspicion!
        h.heartMesh.visible = true;
        h.exclamationMesh.visible = false;
        (h.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 1.0;
        (h.rightCheekBlush.material as THREE.MeshBasicMaterial).opacity = 1.0;

        // Turn vision cone to friendly warm pink
        if (h.visionConeMesh.material) {
          (h.visionConeMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf472b6);
        }

        if (onHumanDialogue && affectedCount === 1) {
          const randomText = dialogues[Math.floor(Math.random() * dialogues.length)];
          onHumanDialogue(`${h.data.name.split(' ')[0]}: "${randomText}"`);
        }
      }
    });

    return affectedCount;
  }

  // Fierce Claw Brag Hiss Effect: Completely STUNS all humans for 10 seconds!
  public applyHissClawBrag(catPos: THREE.Vector3, onHumanDialogue?: (dialogue: string) => void): number {
    this.hissStunTimer = 10.0; // Stun lasts for 10 seconds only!
    let affectedCount = 0;

    const scaredDialogues = [
      'WHOA! Easy kitty! Keep those razor claws away! 😱',
      'Yikes! Look at those sharp claws! Backing off!',
      'Holy whiskers! That cat has murder mittens!',
      'Mercy! Don’t scratch my face! Freezing right here!',
      'GAAAH! Put the claws away! I surrender!',
    ];

    this.humans.forEach((h) => {
      affectedCount++;
      h.data.suspicion = 0;
      h.heartMesh.visible = false;
      h.exclamationMesh.visible = true;

      // Turn vision cone to frightened amber
      if (h.visionConeMesh.material) {
        (h.visionConeMesh.material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);
      }
    });

    if (onHumanDialogue && this.humans.length > 0) {
      const randomHuman = this.humans[Math.floor(Math.random() * this.humans.length)];
      const randomText = scaredDialogues[Math.floor(Math.random() * scaredDialogues.length)];
      onHumanDialogue(`${randomHuman.data.name.split(' ')[0]}: "${randomText}"`);
    }

    return affectedCount;
  }

  // --- Main AI Tick Loop ---
  public update(
    delta: number,
    catPosition: THREE.Vector3,
    isLoafing: boolean,
    isClimbing: boolean,
    streetCredBonus: number,
    onBusted: (humanName: string) => void,
    onKissCaught: (humanName: string) => void,
    remoteCats: { position: { x: number; y: number; z: number }; isLoafing: boolean; isClimbing: boolean }[] = [],
    isCatInAssignedBox: boolean = false
  ) {
    // 1. 5-Min Inspection Surge Clock
    this.surgeTimer -= delta;
    if (this.surgeTimer <= 0) {
      if (!this.isSurgeActive) {
        this.isSurgeActive = true;
        this.surgeDurationRemaining = 5.0; // 5s warning
      }
    }

    if (this.isSurgeActive) {
      this.surgeDurationRemaining -= delta;
      if (this.surgeDurationRemaining <= 0) {
        this.isSurgeActive = false;
        this.surgeTimer = this.surgeInterval;
      }
    }

    // 2. Decrement Hiss Stun Timer (10-second stun)
    const isStunnedByHiss = this.hissStunTimer > 0;
    if (isStunnedByHiss) {
      this.hissStunTimer = Math.max(0, this.hissStunTimer - delta);
    }

    // Combine local cat + all multiplayer cats to find targets
    const allCats = [
      { pos: catPosition, isLoafing, isClimbing, isLocal: true, isInBox: isCatInAssignedBox },
      ...remoteCats.map((rc) => ({
        pos: new THREE.Vector3(rc.position.x, rc.position.y, rc.position.z),
        isLoafing: rc.isLoafing,
        isClimbing: rc.isClimbing,
        isLocal: false,
        isInBox: false,
      })),
    ];

    this.humans.forEach((h, idx) => {
      h.data.stateTimer += delta;

      // HISS STUN APPLIED: Humans are totally frozen in fear for 10 seconds!
      if (isStunnedByHiss) {
        h.armLeftGroup.rotation.x = -Math.PI * 0.75 + Math.sin(Date.now() * 0.05 + idx) * 0.08;
        h.armRightGroup.rotation.x = -Math.PI * 0.75 - Math.sin(Date.now() * 0.05 + idx) * 0.08;
        h.legLeftGroup.rotation.x = 0;
        h.legRightGroup.rotation.x = 0;
        h.head.rotation.x = 0.25;
        h.exclamationMesh.visible = true;
        h.heartMesh.visible = false;
        h.data.position = { x: h.mesh.position.x, y: h.mesh.position.y, z: h.mesh.position.z };
        return;
      }

      // Decrement Meow Slowdown timer
      const isSlowedByMeow = h.meowSlowTimer > 0;
      if (isSlowedByMeow) {
        h.meowSlowTimer -= delta;
        h.heartMesh.visible = true;
        (h.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = Math.min(1.0, h.meowSlowTimer / 2.0);
        (h.rightCheekBlush.material as THREE.MeshBasicMaterial).opacity = Math.min(1.0, h.meowSlowTimer / 2.0);
      }

      const meowSpeedMultiplier = isSlowedByMeow ? 0.22 : 1.0;

      // Find closest cat to this human
      let closestCat = allCats[0];
      let minDist = 9999;
      allCats.forEach((c) => {
        const d = h.mesh.position.distanceTo(c.pos);
        if (d < minDist) {
          minDist = d;
          closestCat = c;
        }
      });

      const distToCat = minDist;
      const catPos = closestCat.pos;
      // Protected if high on cat tower (Y >= 2.75) or safe inside assigned box!
      const isCatSafe = catPos.y >= 2.75 || closestCat.isClimbing || (closestCat.isLocal && isCatInAssignedBox);

      // INSANE MODE (All 12 humans hunt for kisses) OR Aunt Gertrude Kiss Hunt
      const isHunterActive = this.isInsaneModeActive || (h.isKissMonster && this.isKissHuntActive);

      if (isHunterActive) {
        h.data.state = 'kiss_hunt';
        if (!isSlowedByMeow) {
          (h.visionConeMesh.material as THREE.MeshBasicMaterial).color.setHex(0xdc2626);
          h.exclamationMesh.visible = true;
        }

        // Animate kiss heart particles
        if (h.kissHeartParticles) {
          h.kissHeartParticles.children.forEach((p) => {
            p.position.y += delta * 1.5;
            if (p.position.y > 3.5) p.position.y = 1.2;
            p.rotation.y += delta * 3;
          });
        }

        // Animate pulsating puckered kiss lips
        if (h.puckeredLips) {
          const lipPulse = 1.0 + Math.sin(Date.now() * 0.015) * 0.35;
          h.puckeredLips.scale.set(lipPulse, lipPulse, lipPulse);
        }

        if (!isCatSafe) {
          // CAT IS NOT IN BOX & NOT HIGH ON TOWER:
          // Humans in Insane Mode: speeds reduced 50% (Cat shift is 8.85 m/s -> Insane chase is 11.5 m/s)
          const insaneSpeed = 11.5 * meowSpeedMultiplier;
          const dir = new THREE.Vector3().subVectors(catPos, h.mesh.position);
          dir.y = 0;
          if (dir.lengthSq() > 0.001) {
            dir.normalize();
            h.mesh.position.addScaledVector(dir, insaneSpeed * delta);
            h.mesh.lookAt(catPos.x, h.mesh.position.y, catPos.z);
          }

          // Grasping kiss-chase animation
          const animSpeed = isSlowedByMeow ? 0.005 : 0.022;
          h.armLeftGroup.rotation.x = -Math.PI / 2.0 + Math.sin(Date.now() * animSpeed) * 0.5;
          h.armRightGroup.rotation.x = -Math.PI / 2.0 - Math.sin(Date.now() * animSpeed) * 0.5;
          h.legLeftGroup.rotation.x = Math.sin(Date.now() * animSpeed * 1.3) * 1.1;
          h.legRightGroup.rotation.x = -Math.sin(Date.now() * animSpeed * 1.3) * 1.1;

          // Check if human catches cat for a kiss!
          if (distToCat < 2.0 && closestCat.isLocal) {
            soundEngine.playKissSound();
            onKissCaught(h.data.name);
          }
        } else {
          // CAT IS IN CORRECT BOX OR HIGH ON TOWER:
          // Humans cannot touch the cat! They stand outside hopping and pleading with puckered lips!
          h.mesh.lookAt(catPos.x, h.mesh.position.y, catPos.z);
          h.armLeftGroup.rotation.x = -Math.PI / 1.5 + Math.sin(Date.now() * 0.008) * 0.3;
          h.armRightGroup.rotation.x = -Math.PI / 1.5 - Math.sin(Date.now() * 0.008) * 0.3;
          h.head.rotation.x = catPos.y >= 2.75 ? -0.5 : 0.1;

          // Hop excitedly in place
          h.mesh.position.y = Math.abs(Math.sin(Date.now() * 0.01 + idx)) * 0.35;
        }

        h.data.position = { x: h.mesh.position.x, y: h.mesh.position.y, z: h.mesh.position.z };
        return;
      }

      // NORMAL HUMAN PATROL & INSPECTION BEHAVIOR
      const targetWp = this.waypoints[idx % this.waypoints.length];
      const distToWp = h.mesh.position.distanceTo(targetWp);

      // Walk toward waypoint (reduced 50% to 1.6 m/s, drastically slowed if charmed by meow!)
      if (h.data.state === 'patrolling') {
        const moveDir = new THREE.Vector3().subVectors(targetWp, h.mesh.position);
        moveDir.y = 0;
        if (moveDir.lengthSq() > 0.001) {
          moveDir.normalize();
          h.mesh.position.addScaledVector(moveDir, 1.6 * meowSpeedMultiplier * delta);
          h.mesh.lookAt(targetWp.x, h.mesh.position.y, targetWp.z);
        }

        // Walking limb animation
        const walkCycle = Math.sin(Date.now() * (isSlowedByMeow ? 0.0015 : 0.005));
        h.legLeftGroup.rotation.x = walkCycle * 0.45;
        h.legRightGroup.rotation.x = -walkCycle * 0.45;
        h.armLeftGroup.rotation.x = -walkCycle * 0.35;
        h.armRightGroup.rotation.x = walkCycle * 0.35;

        if (distToWp < 2.0) {
          h.data.state = 'idle';
          h.data.stateTimer = 0;
        }
      } else if (h.data.state === 'idle') {
        if (h.data.stateTimer > 4.0) {
          h.data.state = 'patrolling';
        }
      }

      // Vision check for cat (suspicion build is heavily mitigated if slowed by meow)
      const toCat = new THREE.Vector3().subVectors(catPos, h.mesh.position);
      if (toCat.lengthSq() > 0.001) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(h.mesh.quaternion);
        const angle = forward.angleTo(toCat);

        if (distToCat < h.data.visionDistance && angle < h.data.visionAngle && !isCatSafe) {
          if (!closestCat.isLoafing) {
            const suspicionGain = isSlowedByMeow ? 5 : 35; // Charmed humans barely notice mischief!
            h.data.suspicion = Math.min(100, h.data.suspicion + delta * suspicionGain);
            if (!isSlowedByMeow) h.exclamationMesh.visible = true;
            if (h.data.suspicion >= 100 && closestCat.isLocal) {
              onBusted(h.data.name);
            }
          } else {
            // Loafing is cute - reduce suspicion
            h.data.suspicion = Math.max(0, h.data.suspicion - delta * 40);
            h.heartMesh.visible = true;
            h.exclamationMesh.visible = false;
          }
        } else {
          h.data.suspicion = Math.max(0, h.data.suspicion - delta * 15);
          h.exclamationMesh.visible = false;
          if (!isSlowedByMeow) h.heartMesh.visible = false;
        }
      }

      h.data.position = { x: h.mesh.position.x, y: h.mesh.position.y, z: h.mesh.position.z };
    });
  }

  public triggerBanter(humanId: string, type: BanterType): boolean {
    const h = this.humans.find((x) => x.data.id === humanId);
    if (!h) return false;

    if (type === 'tickle' || type === 'purr') {
      h.data.state = 'charmed';
      h.data.suspicion = 0;
      h.data.stateTimer = 0;
      h.heartMesh.visible = true;
      (h.leftCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.9;
      (h.rightCheekBlush.material as THREE.MeshBasicMaterial).opacity = 0.9;
      return true;
    }
    return false;
  }
}
