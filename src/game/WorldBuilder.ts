import * as THREE from 'three';
import { InteractiveProp, BoxColor } from '../types/game';
import { COLORED_BOXES } from '../data/boxes';
import {
  createHardwoodTexture,
  createMarbleTileTexture,
  createWainscotWallTexture,
  createAccentNavyWallpaperTexture,
  createOrnateRugTexture,
} from '../utils/textures';

export interface ColoredBoxMesh {
  id: string;
  color: BoxColor;
  center: THREE.Vector3;
  group: THREE.Group;
  beaconMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
}

export interface CatTowerZone {
  center: THREE.Vector3;
  radius: number;
  maxHeight: number;
  tiers: number[];
}

export interface InteractiveWorldElement {
  mesh: THREE.Object3D;
  type:
    | 'laser_dot'
    | 'table_roast_chicken'
    | 'table_salmon'
    | 'kitchen_glass'
    | 'toilet_paper'
    | 'laptop_keyboard'
    | 'robo_vacuum'
    | 'window_curtains'
    | 'cat_tree'
    | 'sofa_cushion'
    | 'cardboard_box';
  bounds: THREE.Box3;
  originalPos?: THREE.Vector3;
  velocity?: THREE.Vector3;
  isInteracted?: boolean;
  interactCount?: number;
}

export interface StairDoor {
  name: string;
  group: THREE.Group;
  leftLeaf: THREE.Group;
  rightLeaf: THREE.Group;
  catFlap?: THREE.Mesh;
  position: THREE.Vector3;
  currentOpenAngle: number;
  targetOpenAngle: number;
  flapAngle: number;
}

export class WorldBuilder {
  public scene: THREE.Scene;
  public colliders: THREE.Box3[] = [];
  public climbableWalls: THREE.Box3[] = [];
  public highSafetyPerches: THREE.Box3[] = []; // Y > 2.8m safe from Kiss Monster!
  public interactiveElements: InteractiveWorldElement[] = [];
  public dynamicLights: THREE.Light[] = [];
  public stairDoors: StairDoor[] = [];
  public coloredBoxes: ColoredBoxMesh[] = [];
  public catTowerZones: CatTowerZone[] = [];

  // Special Interactive Entities
  public laserLightMesh!: THREE.Mesh;
  public laserSpotLight!: THREE.SpotLight;
  public laserTargetPos: THREE.Vector3 = new THREE.Vector3(-24, 0.05, 36);
  public laserTimer: number = 0;

  public roboVacuumGroup!: THREE.Group;
  public roboVacuumPos: THREE.Vector3 = new THREE.Vector3(22, 0.15, 10);
  public roboVacuumAngle: number = 0;
  public roboVacuumSpeed: number = 2.0;

  public toiletPaperRollMesh!: THREE.Mesh;
  public toiletPaperUnrollCount: number = 0;

  public kitchenGlasses: THREE.Mesh[] = [];
  public foodItems: THREE.Mesh[] = [];
  public laptopMesh!: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildHouseLighting();
    this.buildHouseArchitecture();
  }

  private buildHouseLighting() {
    // 3X BIGGER MANSION LIGHTING (320m x 320m)
    this.scene.background = new THREE.Color(0xa5d8ff); // Crisp vibrant sky
    this.scene.fog = new THREE.Fog(0xa5d8ff, 140, 420);

    // Natural Sky & Ground Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.35);
    hemiLight.position.set(0, 80, 0);
    this.scene.add(hemiLight);

    // Warm Ambient Light
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 1.25);
    this.scene.add(ambientLight);

    // Golden Sun Light through high skylights (Single, high-quality primary shadow caster)
    const sunLight = new THREE.DirectionalLight(0xfffae0, 2.4);
    sunLight.position.set(-80, 100, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; // Balanced 1024 for maximum performance & no VRAM crashes
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 380;
    sunLight.shadow.camera.left = -160;
    sunLight.shadow.camera.right = 160;
    sunLight.shadow.camera.top = 160;
    sunLight.shadow.camera.bottom = -160;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    // Fill Light
    const sunFill = new THREE.DirectionalLight(0xe0f2fe, 0.95);
    sunFill.position.set(80, 75, -80);
    this.scene.add(sunFill);

    // Grand Chandeliers (Glowing ornamental fixtures without heavy shadow passes)
    const createCeilingLamp = (x: number, y: number, z: number, color: number = 0xfff3d6, hasSoftLight: boolean = false) => {
      const lampGeo = new THREE.CylinderGeometry(1.2, 2.0, 0.8, 14);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, y, z);
      this.scene.add(lamp);

      const bulbGeo = new THREE.SphereGeometry(0.5, 10, 10);
      const bulbMat = new THREE.MeshBasicMaterial({ color: color });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x, y - 0.5, z);
      this.scene.add(bulb);

      // Only add soft non-shadow pointlight to key central atrium
      if (hasSoftLight) {
        const light = new THREE.PointLight(color, 1.8, 35, 1.2);
        light.position.set(x, y - 0.7, z);
        light.castShadow = false; // Never cast shadows from pointlights to preserve WebGL context
        this.scene.add(light);
        this.dynamicLights.push(light);
      }
    };

    createCeilingLamp(0, 15, 0, 0xffedd5, true);        // Central Atrium Chandelier (with soft light)
    createCeilingLamp(-40, 15, -40, 0xfffbeb, false);   // Living Room West
    createCeilingLamp(60, 15, 40, 0xffffff, false);     // Grand Dining Hall
    createCeilingLamp(60, 15, -50, 0xffedd5, false);    // Gourmet Kitchen
    createCeilingLamp(-60, 15, 60, 0xfef08a, false);    // Grand Staircase & Loft
    createCeilingLamp(-70, 15, -80, 0xffedd5, false);   // Master Bedroom Suite
    createCeilingLamp(70, 15, -90, 0xe0f2fe, false);    // Marble Spa Bathroom
    createCeilingLamp(0, 15, 90, 0xecfdf5, false);      // Sunroom Tower Garden
  }

  private buildHouseArchitecture() {
    // 1. 3X BIGGER FLOORS (320m wide x 320m deep) with procedural parquet hardwood texture
    const hardwoodTex = createHardwoodTexture();
    const marbleTex = createMarbleTileTexture();
    const wainscotWallTex = createWainscotWallTexture();
    const accentWallpaperTex = createAccentNavyWallpaperTexture();

    const floorGeo = new THREE.PlaneGeometry(320, 320);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: hardwoodTex,
      color: 0xffffff, // lets rich wood texture show through
      roughness: 0.32,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floor collider (Ground floor)
    this.colliders.push(new THREE.Box3(new THREE.Vector3(-160, -2, -160), new THREE.Vector3(160, 0, 160)));

    // Materials with rich textures
    const wallMat = new THREE.MeshStandardMaterial({
      map: wainscotWallTex,
      color: 0xffffff,
      roughness: 0.75,
    });
    const accentWallMat = new THREE.MeshStandardMaterial({
      map: accentWallpaperTex,
      color: 0xffffff,
      roughness: 0.65,
    }); // Royal Navy Damask Wallpaper
    const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x3e200c, roughness: 0.55 });
    const sisalRopeMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.95 });
    const sofaFabricMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.88 });
    const marbleMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1,
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, opacity: 0.9, roughness: 0.1, transparent: true });

    // Decorative Area Rugs
    const livingRugGeo = new THREE.PlaneGeometry(36, 22);
    livingRugGeo.rotateX(-Math.PI / 2);
    const livingRugMat = new THREE.MeshStandardMaterial({
      map: createOrnateRugTexture('#881337', '#f59e0b'),
      roughness: 0.95,
    });
    const livingRug = new THREE.Mesh(livingRugGeo, livingRugMat);
    livingRug.position.set(-30, 0.02, 0);
    livingRug.receiveShadow = true;
    this.scene.add(livingRug);

    const diningRugGeo = new THREE.PlaneGeometry(38, 18);
    diningRugGeo.rotateX(-Math.PI / 2);
    const diningRugMat = new THREE.MeshStandardMaterial({
      map: createOrnateRugTexture('#1e3a8a', '#fbbf24'),
      roughness: 0.95,
    });
    const diningRug = new THREE.Mesh(diningRugGeo, diningRugMat);
    diningRug.position.set(24, 0.02, 18);
    diningRug.receiveShadow = true;
    this.scene.add(diningRug);

    // Helper: Create Wall
    const createWall = (x: number, z: number, w: number, h: number, d: number, mat = wallMat) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      return mesh;
    };

    // Helper: Create Climbable Tower / Post
    const createClimbableTower = (
      name: string,
      x: number,
      z: number,
      height: number,
      tiers: number,
      radius: number = 0.5
    ) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(x, 0, z);

      // Base plate
      const baseGeo = new THREE.CylinderGeometry(radius * 3.5, radius * 3.5, 0.4, 16);
      const baseMesh = new THREE.Mesh(baseGeo, woodDarkMat);
      baseMesh.position.y = 0.2;
      towerGroup.add(baseMesh);
      this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, 0.2, z), new THREE.Vector3(radius * 7, 0.4, radius * 7)));

      // Main Sisal Scratching Pole (soft-wrapped climbable sisal rope)
      const poleGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
      poleGeo.translate(0, height / 2, 0);
      const poleMesh = new THREE.Mesh(poleGeo, sisalRopeMat);
      poleMesh.castShadow = true;
      towerGroup.add(poleMesh);

      // Register generous climbable zone for the entire tower (radius 3.6m)
      const climbZoneBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, height / 2, z),
        new THREE.Vector3(3.6, height, 3.6)
      );
      this.climbableWalls.push(climbZoneBox);

      // SPIRAL STEPPING PADS: Effortless step-by-step spiral staircase wrapped around the pole!
      // This fixes tower climbing completely, letting cats effortlessly hop or run up the tower!
      const totalSpiralSteps = Math.floor(height / 0.65);
      for (let s = 1; s < totalSpiralSteps; s++) {
        const stepY = s * 0.65;
        const stepAngle = s * 1.15;
        const stepRadius = radius + 0.75;
        const stepGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.16, 12);
        const stepMat = s % 2 === 0 ? cushionMat : woodDarkMat;
        const stepMesh = new THREE.Mesh(stepGeo, stepMat);
        stepMesh.position.set(Math.cos(stepAngle) * stepRadius, stepY, Math.sin(stepAngle) * stepRadius);
        stepMesh.castShadow = true;
        towerGroup.add(stepMesh);

        const stepWorldPos = new THREE.Vector3(x + stepMesh.position.x, stepY, z + stepMesh.position.z);
        const stepBox = new THREE.Box3().setFromCenterAndSize(
          stepWorldPos,
          new THREE.Vector3(1.3, 0.18, 1.3)
        );
        this.colliders.push(stepBox);
        this.climbableWalls.push(stepBox);
        if (stepY >= 2.8) {
          this.highSafetyPerches.push(stepBox);
        }
      }

      const tierYList: number[] = [];

      // Tier Platforms & Safety Perches
      for (let t = 1; t <= tiers; t++) {
        const tierY = (height / tiers) * t;
        tierYList.push(tierY);
        const tierRadius = Math.max(1.5, 2.7 - t * 0.2);
        const perchGeo = new THREE.CylinderGeometry(tierRadius, tierRadius, 0.35, 16);
        const perchMat = t % 2 === 0 ? cushionMat : woodDarkMat;
        const perch = new THREE.Mesh(perchGeo, perchMat);
        perch.position.set(Math.sin(t * 1.5) * 0.8, tierY, Math.cos(t * 1.5) * 0.8);
        perch.castShadow = true;
        towerGroup.add(perch);

        const perchWorldPos = new THREE.Vector3(x + perch.position.x, tierY, z + perch.position.z);
        const perchBox = new THREE.Box3().setFromCenterAndSize(
          perchWorldPos,
          new THREE.Vector3(tierRadius * 2.2, 0.4, tierRadius * 2.2)
        );
        this.colliders.push(perchBox);
        this.climbableWalls.push(perchBox);

        // High safety perches (Y > 2.8m cannot be reached by Kiss Monster!)
        if (tierY >= 2.8) {
          this.highSafetyPerches.push(perchBox);
        }

        this.interactiveElements.push({
          mesh: perch,
          type: 'cat_tree',
          bounds: perchBox,
        });
      }

      this.catTowerZones.push({
        center: new THREE.Vector3(x, 0, z),
        radius: 3.5,
        maxHeight: height,
        tiers: tierYList,
      });

      this.scene.add(towerGroup);
      return towerGroup;
    };

    // 2. OUTER PERIMETER WALLS (16m tall, 320m x 320m)
    createWall(0, 160, 320, 16, 2.0);   // North Wall
    createWall(0, -160, 320, 16, 2.0);  // South Wall
    createWall(-160, 0, 2.0, 16, 320);  // West Wall
    createWall(160, 0, 2.0, 16, 320);   // East Wall

    // Interior Dividers with wide arched passages
    // West Wing dividing wall split for Staircase Archway & Portal Doors (leaving X: -33 to -15 clear for stairs)
    createWall(-75, 40, 62, 16, 1.6, accentWallMat);   // Left Wing Wall (West)
    createWall(-7, 40, 14, 16, 1.6, accentWallMat);    // Right Wing Wall (East of stairs)
    createWall(60, 40, 92, 16, 1.6, accentWallMat);    // Atrium & North Garden (East Wing)
    createWall(-65, -50, 102, 16, 1.6, wallMat);       // Atrium & South Suites (West Wing)
    createWall(65, -50, 102, 16, 1.6, wallMat);        // Atrium & South Suites (East Wing)
    createWall(50, 55, 1.6, 16, 70, accentWallMat);    // East Dining Passage (North)
    createWall(50, -55, 1.6, 16, 70, accentWallMat);   // East Gourmet Kitchen Passage (South)
    createWall(-50, 55, 1.6, 16, 70, wallMat);         // West Loft Passage (North)
    createWall(-50, -55, 1.6, 16, 70, wallMat);        // West Master Suite Passage (South)

    // 3. CLIMBING TOWERS & CAT SKYSCRAPERS (The only escape from Kiss Monster!)
    // Tower 1: GRAND CAT SKYSCRAPER ALPHA in Central Atrium (12m high, 5 tiers!)
    createClimbableTower('Alpha Skyscraper', 0, 0, 12, 5, 0.7);

    // Tower 2: SCRATCHING TOWER BETA in Living Room (9m high, 4 tiers)
    createClimbableTower('Beta Tower', -35, -15, 9, 4, 0.6);

    // Tower 3: SCRATCHING TOWER GAMMA in Dining Banquet (9m high, 4 tiers)
    createClimbableTower('Gamma Tower', 55, 35, 9, 4, 0.6);

    // Tower 4: SUNROOM BOTANICAL TOWER in North Garden (11m high, 5 tiers)
    createClimbableTower('Sunroom Tower', 0, 95, 11, 5, 0.65);

    // Tower 5: BEDROOM CANOPY TOWER in Master Bedroom (8m high, 3 tiers)
    createClimbableTower('Bedroom Tower', -80, -90, 8, 3, 0.55);

    // 4. SUSPENSION BRIDGES & HIGH CATWALKS (Y = 7.5m - 9.0m)
    // Connects Towers to upper walls and chandeliers for thrilling aerial cat parkour!
    const createCatwalk = (x: number, y: number, z: number, w: number, d: number) => {
      const geo = new THREE.BoxGeometry(w, 0.35, d);
      const mesh = new THREE.Mesh(geo, woodDarkMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      this.highSafetyPerches.push(box);
      return mesh;
    };

    // Central Catwalk Bridges across Atrium
    createCatwalk(0, 8.5, 0, 4, 30);   // North-South Catwalk
    createCatwalk(0, 8.5, 0, 30, 4);   // East-West Catwalk
    createCatwalk(-25, 8.5, 15, 20, 3); // Bridge to Loft
    createCatwalk(25, 8.5, -15, 20, 3); // Bridge to Dining chandelier

    // 5. THE GRAND BOOKCASE MOUNTAIN (West Wall Library)
    // 8m tall floor-to-ceiling wooden bookshelves with climbable ladders
    const bookcaseGeo = new THREE.BoxGeometry(32, 10, 3.5);
    const bookcase = new THREE.Mesh(bookcaseGeo, woodDarkMat);
    bookcase.position.set(-140, 5.0, 0);
    bookcase.castShadow = true;
    this.scene.add(bookcase);
    const bookcaseBox = new THREE.Box3().setFromObject(bookcase);
    this.colliders.push(bookcaseBox);
    this.climbableWalls.push(bookcaseBox);
    this.highSafetyPerches.push(bookcaseBox);

    // 6. GIANT LIVING ROOM SECTIONAL SOFA & CUSHIONS
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(30, 1.6, 12), sofaFabricMat);
    sofaBase.position.set(-30, 0.8, 0);
    sofaBase.castShadow = true;
    this.scene.add(sofaBase);
    this.colliders.push(new THREE.Box3().setFromObject(sofaBase));

    // Sofa Cushions
    for (let c = -3; c <= 3; c++) {
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 5.2), cushionMat);
      cushion.position.set(-30 + c * 4.4, 1.8, 0.5);
      cushion.castShadow = true;
      this.scene.add(cushion);
      this.colliders.push(new THREE.Box3().setFromObject(cushion));

      this.interactiveElements.push({
        mesh: cushion,
        type: 'sofa_cushion',
        bounds: new THREE.Box3().setFromObject(cushion),
      });
    }

    // Climbable Window Curtains (Stretching up to 14m on West Wall)
    const curtainGeo = new THREE.BoxGeometry(1.0, 14, 12);
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.95 });
    const curtain = new THREE.Mesh(curtainGeo, curtainMat);
    curtain.position.set(-158, 7.0, 0);
    curtain.castShadow = true;
    this.scene.add(curtain);

    const curtainBox = new THREE.Box3().setFromObject(curtain);
    this.colliders.push(curtainBox);
    this.climbableWalls.push(curtainBox);
    this.highSafetyPerches.push(curtainBox);

    this.interactiveElements.push({
      mesh: curtain,
      type: 'window_curtains',
      bounds: curtainBox,
    });

    // 7. GRAND STAIRCASE & MEZZANINE (North-West)
    const stepCount = 18;
    const stepWidth = 14;
    const stepDepth = 1.6;
    const stepHeight = 0.42;

    for (let s = 0; s < stepCount; s++) {
      const stepGeo = new THREE.BoxGeometry(stepWidth, 0.14, stepDepth + 0.1);
      const stepMesh = new THREE.Mesh(stepGeo, woodDarkMat);
      stepMesh.position.set(-24, (s + 1) * stepHeight - 0.07, 28 + s * stepDepth);
      stepMesh.castShadow = true;
      this.scene.add(stepMesh);

      const riserGeo = new THREE.BoxGeometry(stepWidth, stepHeight, 0.1);
      const riserMesh = new THREE.Mesh(riserGeo, wallMat);
      riserMesh.position.set(-24, (s + 0.5) * stepHeight, 28 + s * stepDepth - stepDepth / 2 + 0.05);
      this.scene.add(riserMesh);

      const stepBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(-24, ((s + 1) * stepHeight) / 2, 28 + s * stepDepth),
        new THREE.Vector3(stepWidth, (s + 1) * stepHeight, stepDepth + 0.1)
      );
      this.colliders.push(stepBox);
      if ((s + 1) * stepHeight >= 2.8) {
        this.highSafetyPerches.push(stepBox);
      }
    }

    // --- DOORS FOR STAIRS (Cat pass-through doors with automatic swing & cat flap!) ---
    const createStairDoor = (
      name: string,
      x: number,
      y: number,
      z: number,
      doorWidth: number = 8.0,
      doorHeight: number = 4.8
    ) => {
      const doorGroup = new THREE.Group();
      doorGroup.position.set(x, y, z);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d1d07, roughness: 0.4 });
      const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x5c2b0c, roughness: 0.35 });
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.85, opacity: 0.85, transparent: true, roughness: 0.1 });
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

      // Frame Posts (left and right)
      const postGeo = new THREE.BoxGeometry(0.7, doorHeight, 0.7);
      const leftPost = new THREE.Mesh(postGeo, frameMat);
      leftPost.position.set(-doorWidth / 2 - 0.35, doorHeight / 2, 0);
      leftPost.castShadow = true;
      doorGroup.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, frameMat);
      rightPost.position.set(doorWidth / 2 + 0.35, doorHeight / 2, 0);
      rightPost.castShadow = true;
      doorGroup.add(rightPost);

      // Top Header / Lintel molding with high safety perch
      const lintelGeo = new THREE.BoxGeometry(doorWidth + 1.8, 0.7, 1.0);
      const lintel = new THREE.Mesh(lintelGeo, frameMat);
      lintel.position.set(0, doorHeight + 0.35, 0);
      lintel.castShadow = true;
      doorGroup.add(lintel);

      const lintelBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, y + doorHeight + 0.35, z),
        new THREE.Vector3(doorWidth + 1.8, 0.7, 1.0)
      );
      this.colliders.push(lintelBox);
      this.highSafetyPerches.push(lintelBox);

      // Left Door Leaf (Hinged on the left side)
      const leftLeafGroup = new THREE.Group();
      leftLeafGroup.position.set(-doorWidth / 2, 0, 0);

      const leafWidth = (doorWidth - 0.3) / 2;
      const leafGeo = new THREE.BoxGeometry(leafWidth, doorHeight, 0.16);
      leafGeo.translate(leafWidth / 2, doorHeight / 2, 0);
      const leftLeafMesh = new THREE.Mesh(leafGeo, doorPanelMat);
      leftLeafMesh.castShadow = true;
      leftLeafGroup.add(leftLeafMesh);

      // French Glass Window Pane (Left)
      const glassGeo = new THREE.BoxGeometry(leafWidth * 0.65, doorHeight * 0.5, 0.06);
      glassGeo.translate(leafWidth / 2, doorHeight * 0.62, 0);
      const leftGlass = new THREE.Mesh(glassGeo, glassMat);
      leftLeafGroup.add(leftGlass);

      // Brass Handle (Left)
      const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
      const leftHandle = new THREE.Mesh(handleGeo, brassMat);
      leftHandle.position.set(leafWidth - 0.25, doorHeight * 0.45, 0.12);
      leftLeafGroup.add(leftHandle);

      // Cute Cat Flap (Swinging pet portal for cats!)
      const flapGeo = new THREE.BoxGeometry(0.9, 0.9, 0.06);
      flapGeo.translate(0, -0.45, 0); // hinge at top of flap
      const flapMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.1 });
      const catFlap = new THREE.Mesh(flapGeo, flapMat);
      catFlap.position.set(leafWidth * 0.5, 1.0, 0);
      leftLeafGroup.add(catFlap);

      doorGroup.add(leftLeafGroup);

      // Right Door Leaf (Hinged on the right side)
      const rightLeafGroup = new THREE.Group();
      rightLeafGroup.position.set(doorWidth / 2, 0, 0);

      const rightLeafGeo = new THREE.BoxGeometry(leafWidth, doorHeight, 0.16);
      rightLeafGeo.translate(-leafWidth / 2, doorHeight / 2, 0);
      const rightLeafMesh = new THREE.Mesh(rightLeafGeo, doorPanelMat);
      rightLeafMesh.castShadow = true;
      rightLeafGroup.add(rightLeafMesh);

      // French Glass Window Pane (Right)
      const rightGlassGeo = new THREE.BoxGeometry(leafWidth * 0.65, doorHeight * 0.5, 0.06);
      rightGlassGeo.translate(-leafWidth / 2, doorHeight * 0.62, 0);
      const rightGlass = new THREE.Mesh(rightGlassGeo, glassMat);
      rightLeafGroup.add(rightGlass);

      // Brass Handle (Right)
      const rightHandle = new THREE.Mesh(handleGeo, brassMat);
      rightHandle.position.set(-leafWidth + 0.25, doorHeight * 0.45, 0.12);
      rightLeafGroup.add(rightHandle);

      doorGroup.add(rightLeafGroup);

      // Colliders for side frame posts (leaving the door opening clear for the cat!)
      const leftPostBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x - doorWidth / 2 - 0.35, y + doorHeight / 2, z),
        new THREE.Vector3(0.7, doorHeight, 0.7)
      );
      const rightPostBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x + doorWidth / 2 + 0.35, y + doorHeight / 2, z),
        new THREE.Vector3(0.7, doorHeight, 0.7)
      );
      this.colliders.push(leftPostBox, rightPostBox);

      this.scene.add(doorGroup);

      const stairDoor: StairDoor = {
        name,
        group: doorGroup,
        leftLeaf: leftLeafGroup,
        rightLeaf: rightLeafGroup,
        catFlap,
        position: new THREE.Vector3(x, y, z),
        currentOpenAngle: 0,
        targetOpenAngle: 0,
        flapAngle: 0,
      };

      this.stairDoors.push(stairDoor);
      return stairDoor;
    };

    // 1. Lower Staircase Entrance Doors (Atrium to Stairs entrance)
    createStairDoor('Lower Staircase Grand Doors', -24, 0, 27, 9.0, 4.8);

    // 2. Mid-Stairway Portal Doors (Through the Z=40 dividing archway)
    createStairDoor('Mid-Stairway Portal Doors', -24, 8 * stepHeight, 40, 9.0, 4.8);

    // 3. Upper Mezzanine / Loft Exit Doors (Top of stairs to Loft)
    createStairDoor('Upper Loft Mezzanine Doors', -24, stepCount * stepHeight, 28 + (stepCount - 0.5) * stepDepth, 9.0, 4.8);

    // Upper Loft Floor (Y = 7.8m)
    const loftGeo = new THREE.BoxGeometry(50, 1.0, 40);
    const loftMesh = new THREE.Mesh(loftGeo, floorMat);
    loftMesh.position.set(-24, stepCount * stepHeight + 0.5, 65);
    loftMesh.castShadow = true;
    loftMesh.receiveShadow = true;
    this.scene.add(loftMesh);

    const loftBox = new THREE.Box3().setFromObject(loftMesh);
    this.colliders.push(loftBox);
    this.highSafetyPerches.push(loftBox);

    // 8. DINING ROOM: Grand Banquet Table, Roasted Chicken & Salmon Platter
    const diningTableTop = new THREE.Mesh(new THREE.BoxGeometry(32, 0.6, 12), woodDarkMat);
    diningTableTop.position.set(24, 2.2, 18);
    diningTableTop.castShadow = true;
    diningTableTop.receiveShadow = true;
    this.scene.add(diningTableTop);
    this.colliders.push(new THREE.Box3().setFromObject(diningTableTop));

    // Roasted Chicken Leg
    const chickenGeo = new THREE.CapsuleGeometry(0.5, 0.9, 6, 12);
    chickenGeo.rotateZ(Math.PI / 3);
    const chickenMat = new THREE.MeshStandardMaterial({ color: 0xd48b38, roughness: 0.5 });
    const chickenMesh = new THREE.Mesh(chickenGeo, chickenMat);
    chickenMesh.position.set(22, 2.9, 18);
    chickenMesh.castShadow = true;
    this.scene.add(chickenMesh);
    this.foodItems.push(chickenMesh);

    this.interactiveElements.push({
      mesh: chickenMesh,
      type: 'table_roast_chicken',
      bounds: new THREE.Box3().setFromObject(chickenMesh),
    });

    // Grilled Salmon Fillet Platter
    const plateGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.12, 16);
    const plateMesh = new THREE.Mesh(plateGeo, marbleMat);
    plateMesh.position.set(27, 2.55, 18);
    this.scene.add(plateMesh);

    const salmonGeo = new THREE.BoxGeometry(1.2, 0.28, 0.7);
    const salmonMat = new THREE.MeshStandardMaterial({ color: 0xfa8072, roughness: 0.6 });
    const salmonMesh = new THREE.Mesh(salmonGeo, salmonMat);
    salmonMesh.position.set(27, 2.8, 18);
    salmonMesh.castShadow = true;
    this.scene.add(salmonMesh);
    this.foodItems.push(salmonMesh);

    this.interactiveElements.push({
      mesh: salmonMesh,
      type: 'table_salmon',
      bounds: new THREE.Box3().setFromObject(salmonMesh),
    });

    // 9. GOURMET CHEF'S KITCHEN: Island Counter & 5 Knockable Crystal Glasses
    const kitchenIsland = new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 10), marbleMat);
    kitchenIsland.position.set(24, 1.1, -18);
    kitchenIsland.castShadow = true;
    kitchenIsland.receiveShadow = true;
    this.scene.add(kitchenIsland);
    this.colliders.push(new THREE.Box3().setFromObject(kitchenIsland));

    // 5 Knockable Crystal Glasses along the marble island edge
    for (let g = 0; g < 5; g++) {
      const glassGeo = new THREE.CylinderGeometry(0.25, 0.18, 0.75, 12);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(16 + g * 3.5, 2.65, -13.8); // near edge!
      glassMesh.castShadow = true;
      this.scene.add(glassMesh);
      this.kitchenGlasses.push(glassMesh);

      this.interactiveElements.push({
        mesh: glassMesh,
        type: 'kitchen_glass',
        bounds: new THREE.Box3().setFromObject(glassMesh),
        originalPos: glassMesh.position.clone(),
      });
    }

    // 10. MASTER BEDROOM: Study Desk & Glowing Laptop
    const desk = new THREE.Mesh(new THREE.BoxGeometry(14, 1.9, 6), woodDarkMat);
    desk.position.set(-22, 0.95, -38);
    desk.castShadow = true;
    this.scene.add(desk);
    this.colliders.push(new THREE.Box3().setFromObject(desk));

    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(-22, 1.95, -38);

    const keyboardGeo = new THREE.BoxGeometry(2.2, 0.08, 1.4);
    const keyboardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    const keyboard = new THREE.Mesh(keyboardGeo, keyboardMat);
    laptopGroup.add(keyboard);

    const screenGeo = new THREE.BoxGeometry(2.2, 1.5, 0.06);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.75, -0.7);
    screen.rotation.x = -0.3;
    laptopGroup.add(screen);

    this.scene.add(laptopGroup);
    this.laptopMesh = keyboard;

    this.interactiveElements.push({
      mesh: laptopGroup,
      type: 'laptop_keyboard',
      bounds: new THREE.Box3().setFromObject(laptopGroup),
    });

    // 11. MARBLE BATHROOM: Toilet Paper Stand
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), chromeMat);
    pole.position.set(10, 1.1, -48);
    this.scene.add(pole);

    const tpGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.9, 16);
    tpGeo.rotateZ(Math.PI / 2);
    const tpMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    this.toiletPaperRollMesh = new THREE.Mesh(tpGeo, tpMat);
    this.toiletPaperRollMesh.position.set(10, 2.0, -48);
    this.toiletPaperRollMesh.castShadow = true;
    this.scene.add(this.toiletPaperRollMesh);

    this.interactiveElements.push({
      mesh: this.toiletPaperRollMesh,
      type: 'toilet_paper',
      bounds: new THREE.Box3().setFromObject(this.toiletPaperRollMesh),
    });

    // 12. ROBOTIC VACUUM ROOMBA
    this.roboVacuumGroup = new THREE.Group();
    this.roboVacuumGroup.position.copy(this.roboVacuumPos);

    const vacGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.32, 24);
    const vacMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.5 });
    const vacMesh = new THREE.Mesh(vacGeo, vacMat);
    vacMesh.castShadow = true;
    this.roboVacuumGroup.add(vacMesh);

    const ringGeo = new THREE.TorusGeometry(0.5, 0.06, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.17;
    this.roboVacuumGroup.add(ring);

    this.scene.add(this.roboVacuumGroup);

    this.interactiveElements.push({
      mesh: this.roboVacuumGroup,
      type: 'robo_vacuum',
      bounds: new THREE.Box3().setFromObject(this.roboVacuumGroup),
    });

    // 13. DYNAMIC RED LASER LIGHT BEAM
    const laserGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    this.laserLightMesh = new THREE.Mesh(laserGeo, laserMat);
    this.laserLightMesh.position.copy(this.laserTargetPos);
    this.scene.add(this.laserLightMesh);

    this.laserSpotLight = new THREE.SpotLight(0xff0033, 6.0, 20, Math.PI / 3, 0.8, 1.2);
    this.laserSpotLight.position.set(-24, 12, 36);
    this.laserSpotLight.target = this.laserLightMesh;
    this.scene.add(this.laserSpotLight);

    this.interactiveElements.push({
      mesh: this.laserLightMesh,
      type: 'laser_dot',
      bounds: new THREE.Box3().setFromObject(this.laserLightMesh),
    });

    // 14. 4 COLORED BOXES (Red, Blue, Green, Gold) for the 10-Min Survival Mission
    this.buildColoredBoxes();

    // 15. LABYRINTH HEDGE MAZE GARDEN (North-East Grounds for maximum struggle!)
    this.buildMazeGarden();
  }

  // Build the Labyrinth Hedge Maze Garden (North-East: X: 45 to 145, Z: 55 to 145)
  private buildMazeGarden() {
    // 1. Garden Turf Grass Base (100m x 90m)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // rich deep hedge garden grass
      roughness: 0.9,
    });
    const gardenBaseGeo = new THREE.PlaneGeometry(102, 92);
    gardenBaseGeo.rotateX(-Math.PI / 2);
    const gardenBase = new THREE.Mesh(gardenBaseGeo, grassMat);
    gardenBase.position.set(95, 0.015, 100);
    gardenBase.receiveShadow = true;
    this.scene.add(gardenBase);

    // Stone Gravel Pathways (Criss-crossing the maze)
    const gravelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // limestone gravel path
      roughness: 0.85,
    });
    const pathNSGeo = new THREE.PlaneGeometry(3.6, 88);
    pathNSGeo.rotateX(-Math.PI / 2);
    const mainPath = new THREE.Mesh(pathNSGeo, gravelMat);
    mainPath.position.set(95, 0.02, 100);
    mainPath.receiveShadow = true;
    this.scene.add(mainPath);

    const pathEWGeo = new THREE.PlaneGeometry(98, 3.6);
    pathEWGeo.rotateX(-Math.PI / 2);
    const crossPath = new THREE.Mesh(pathEWGeo, gravelMat);
    crossPath.position.set(95, 0.02, 105);
    crossPath.receiveShadow = true;
    this.scene.add(crossPath);

    // 2. Hedge Wall Material & Helper
    const hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // lush dense boxwood hedge
      roughness: 0.92,
    });
    const hedgeTopMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // lighter clipped top hedge
      roughness: 0.85,
    });

    const createHedgeSegment = (x: number, z: number, w: number, d: number, h: number = 3.2) => {
      const hedgeGroup = new THREE.Group();
      hedgeGroup.position.set(x, h / 2, z);

      // Main hedge body
      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      const body = new THREE.Mesh(bodyGeo, hedgeMat);
      body.castShadow = true;
      body.receiveShadow = true;
      hedgeGroup.add(body);

      // Clipped decorative top cap
      const capGeo = new THREE.BoxGeometry(w + 0.1, 0.3, d + 0.1);
      const cap = new THREE.Mesh(capGeo, hedgeTopMat);
      cap.position.y = h / 2;
      cap.castShadow = true;
      hedgeGroup.add(cap);

      this.scene.add(hedgeGroup);

      const hedgeBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, h / 2, z),
        new THREE.Vector3(w, h, d)
      );
      this.colliders.push(hedgeBox);
      this.climbableWalls.push(hedgeBox); // Cats can climb hedges with claws or jump on top!
    };

    // --- MAZE HEDGE PERIMETER & CORRIDORS ---
    // Outer Garden Enclosure (Leaving wide grand entrance at X: 48, Z: 55)
    createHedgeSegment(95, 145, 100, 1.4); // North Garden Boundary
    createHedgeSegment(145, 100, 1.4, 90);  // East Garden Boundary
    createHedgeSegment(45, 102, 1.4, 86);   // West Garden Boundary (North half)
    createHedgeSegment(98, 55, 94, 1.4);    // South Garden Boundary (leaving X: 45 to 51 open for entrance!)

    // Internal Winding Maze Walls & Dead Ends
    // Sector A: Entrance Labyrinth (South-West)
    createHedgeSegment(60, 70, 1.4, 30);
    createHedgeSegment(75, 84, 30, 1.4);
    createHedgeSegment(75, 62, 1.4, 14);
    createHedgeSegment(85, 72, 20, 1.4);

    // Sector B: Dead End Trap Alcoves (South-East: where trap bling_bling is hidden!)
    createHedgeSegment(120, 68, 1.4, 26);
    createHedgeSegment(132, 80, 24, 1.4);
    createHedgeSegment(110, 80, 1.4, 24);
    createHedgeSegment(125, 92, 30, 1.4);

    // Sector C: North Winding Paths & Corridors
    createHedgeSegment(68, 115, 1.4, 40);
    createHedgeSegment(82, 134, 28, 1.4);
    createHedgeSegment(82, 122, 1.4, 16);
    createHedgeSegment(60, 135, 16, 1.4);

    // Sector D: East Secret Corner & Outer Run
    createHedgeSegment(115, 128, 38, 1.4);
    createHedgeSegment(134, 115, 1.4, 26);
    createHedgeSegment(125, 140, 1.4, 10);
    createHedgeSegment(110, 110, 1.4, 22);

    // 3. Central Classical Octagonal Gazebo & Fountain (Center: X: 95, Z: 105)
    const gazeboGroup = new THREE.Group();
    gazeboGroup.position.set(95, 0, 105);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.1 });
    const copperRoofMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4, metalness: 0.5 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.1,
    });

    // Gazebo Platform
    const platformGeo = new THREE.CylinderGeometry(5.2, 5.6, 0.45, 8);
    const platform = new THREE.Mesh(platformGeo, stoneMat);
    platform.position.y = 0.22;
    platform.receiveShadow = true;
    gazeboGroup.add(platform);

    const platformBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(95, 0.22, 105),
      new THREE.Vector3(11, 0.45, 11)
    );
    this.colliders.push(platformBox);

    // 8 Marble Pillars
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const px = Math.cos(angle) * 4.6;
      const pz = Math.sin(angle) * 4.6;

      const pillarGeo = new THREE.CylinderGeometry(0.24, 0.28, 3.8, 12);
      const pillar = new THREE.Mesh(pillarGeo, stoneMat);
      pillar.position.set(px, 2.35, pz);
      pillar.castShadow = true;
      gazeboGroup.add(pillar);

      const pillarBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(95 + px, 2.35, 105 + pz),
        new THREE.Vector3(0.6, 3.8, 0.6)
      );
      this.colliders.push(pillarBox);
      this.climbableWalls.push(pillarBox);
    }

    // Gazebo Octagonal Domed Roof (Y = 4.5m - High safe perch from Kiss Monster!)
    const roofGeo = new THREE.ConeGeometry(5.6, 2.4, 8);
    const roof = new THREE.Mesh(roofGeo, copperRoofMat);
    roof.position.y = 5.4;
    roof.castShadow = true;
    gazeboGroup.add(roof);

    const roofBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(95, 5.0, 105),
      new THREE.Vector3(10, 1.6, 10)
    );
    this.colliders.push(roofBox);
    this.highSafetyPerches.push(roofBox);

    // Central Stone Bubbling Fountain Basin
    const basinGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.8, 16);
    const basin = new THREE.Mesh(basinGeo, stoneMat);
    basin.position.y = 0.85;
    basin.castShadow = true;
    gazeboGroup.add(basin);

    const waterGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.1, 16);
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 1.22;
    gazeboGroup.add(water);

    const fountainPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.6, 12), stoneMat);
    fountainPedestal.position.y = 1.65;
    fountainPedestal.castShadow = true;
    gazeboGroup.add(fountainPedestal);

    const fountainBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(95, 1.0, 105),
      new THREE.Vector3(4.4, 2.0, 4.4)
    );
    this.colliders.push(fountainBox);
    this.climbableWalls.push(fountainBox);

    this.scene.add(gazeboGroup);

    // 4 Glowing Antique Garden Lantern Posts at Maze Junctions
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3, metalness: 0.8 });
    const lanternGlassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const createGardenLantern = (lx: number, lz: number) => {
      const lanternGroup = new THREE.Group();
      lanternGroup.position.set(lx, 0, lz);

      const postGeo = new THREE.CylinderGeometry(0.12, 0.16, 3.4, 8);
      const post = new THREE.Mesh(postGeo, lanternMat);
      post.position.y = 1.7;
      post.castShadow = true;
      lanternGroup.add(post);

      const lampGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
      const lamp = new THREE.Mesh(lampGeo, lanternGlassMat);
      lamp.position.y = 3.6;
      lanternGroup.add(lamp);

      this.scene.add(lanternGroup);

      const postBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(lx, 1.7, lz),
        new THREE.Vector3(0.5, 3.4, 0.5)
      );
      this.colliders.push(postBox);
      this.climbableWalls.push(postBox);
    };

    createGardenLantern(48, 58);   // Entrance Lantern
    createGardenLantern(95, 75);   // Central Alley Lantern
    createGardenLantern(95, 105);  // Gazebo Lantern
    createGardenLantern(125, 130); // Deep Maze Lantern
  }

  // Build the 4 colored cardboard cat boxes
  private buildColoredBoxes() {
    COLORED_BOXES.forEach((boxData) => {
      const boxGroup = new THREE.Group();
      boxGroup.position.set(boxData.position.x, 0, boxData.position.z);

      const cardboardMat = new THREE.MeshStandardMaterial({
        color: 0xc29b68, // warm cardboard
        roughness: 0.85,
      });

      const colorAccentMat = new THREE.MeshStandardMaterial({
        color: boxData.accentHex,
        roughness: 0.4,
        emissive: boxData.accentHex,
        emissiveIntensity: 0.5,
      });

      const velvetCushionMat = new THREE.MeshStandardMaterial({
        color: boxData.accentHex,
        roughness: 0.9,
      });

      // 1. Box Bottom Floor
      const bottomGeo = new THREE.BoxGeometry(2.6, 0.12, 2.6);
      const bottomMesh = new THREE.Mesh(bottomGeo, cardboardMat);
      bottomMesh.position.y = 0.06;
      bottomMesh.receiveShadow = true;
      boxGroup.add(bottomMesh);

      // 2. Interior Velvet Cushion
      const cushionGeo = new THREE.BoxGeometry(2.3, 0.22, 2.3);
      const cushionMesh = new THREE.Mesh(cushionGeo, velvetCushionMat);
      cushionMesh.position.y = 0.18;
      cushionMesh.receiveShadow = true;
      boxGroup.add(cushionMesh);

      // 3. Four Cardboard Walls (Low enough for cat to step into: 0.55m high)
      const wallThickness = 0.1;
      const wallHeight = 0.55;
      const boxWidth = 2.6;

      // North & South walls
      const wallNSGeo = new THREE.BoxGeometry(boxWidth, wallHeight, wallThickness);
      const wallNorth = new THREE.Mesh(wallNSGeo, cardboardMat);
      wallNorth.position.set(0, wallHeight / 2, -boxWidth / 2);
      wallNorth.castShadow = true;
      boxGroup.add(wallNorth);

      const wallSouth = new THREE.Mesh(wallNSGeo, cardboardMat);
      wallSouth.position.set(0, wallHeight / 2, boxWidth / 2);
      wallSouth.castShadow = true;
      boxGroup.add(wallSouth);

      // West & East walls
      const wallEWGeo = new THREE.BoxGeometry(wallThickness, wallHeight, boxWidth);
      const wallWest = new THREE.Mesh(wallEWGeo, cardboardMat);
      wallWest.position.set(-boxWidth / 2, wallHeight / 2, 0);
      wallWest.castShadow = true;
      boxGroup.add(wallWest);

      const wallEast = new THREE.Mesh(wallEWGeo, cardboardMat);
      wallEast.position.set(boxWidth / 2, wallHeight / 2, 0);
      wallEast.castShadow = true;
      boxGroup.add(wallEast);

      // Colored rim trim along top edges
      const rimGeo = new THREE.BoxGeometry(boxWidth + 0.1, 0.08, 0.16);
      const rimN = new THREE.Mesh(rimGeo, colorAccentMat);
      rimN.position.set(0, wallHeight, -boxWidth / 2);
      boxGroup.add(rimN);
      const rimS = new THREE.Mesh(rimGeo, colorAccentMat);
      rimS.position.set(0, wallHeight, boxWidth / 2);
      boxGroup.add(rimS);

      // 4. Glowing Ground Rune / Halo Ring
      const haloGeo = new THREE.TorusGeometry(1.8, 0.06, 12, 32);
      haloGeo.rotateX(Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: boxData.accentHex,
        transparent: true,
        opacity: 0.75,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.y = 0.04;
      boxGroup.add(haloMesh);

      // 5. Floating Rotating Holographic Diamond Crystal Beacon
      const diamondGeo = new THREE.OctahedronGeometry(0.55);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: boxData.accentHex,
        emissive: boxData.accentHex,
        emissiveIntensity: 2.2, // Glowing holographic diamond
        roughness: 0.1,
        metalness: 0.3,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.set(0, 2.2, 0);
      boxGroup.add(diamond);

      this.scene.add(boxGroup);

      this.coloredBoxes.push({
        id: boxData.id,
        color: boxData.color,
        center: new THREE.Vector3(boxData.position.x, 0.2, boxData.position.z),
        group: boxGroup,
        beaconMesh: diamond,
        haloMesh: haloMesh,
      });
    });
  }

  // Check if position is on high safe ground (cannot be reached by Kiss Monster!)
  public isPositionHighSafe(y: number): boolean {
    return y >= 2.75;
  }

  // --- Dynamic World Physics & Movements ---
  public updateWorld(delta: number, playerPos?: THREE.Vector3) {
    this.laserTimer += delta;

    // Animate Colored Box Beacons (Float & Rotate)
    this.coloredBoxes.forEach((cb, idx) => {
      if (cb.beaconMesh) {
        cb.beaconMesh.rotation.y += delta * 1.5;
        cb.beaconMesh.rotation.x = Math.sin(this.laserTimer * 2 + idx) * 0.2;
        cb.beaconMesh.position.y = 2.2 + Math.sin(this.laserTimer * 3 + idx * 1.5) * 0.25;
      }
      if (cb.haloMesh) {
        const pulse = 1.0 + Math.sin(this.laserTimer * 4 + idx) * 0.15;
        cb.haloMesh.scale.set(pulse, pulse, pulse);
      }
    });

    // 1. Animate Staircase Doors & Cat Flaps (Dynamic pass-through swing when cat is near!)
    this.stairDoors.forEach((door) => {
      let isNear = false;
      let dist = 999;
      if (playerPos) {
        dist = playerPos.distanceTo(door.position);
        if (dist < 6.5) {
          isNear = true;
        }
      }

      door.targetOpenAngle = isNear ? Math.PI * 0.45 : 0;
      door.currentOpenAngle = THREE.MathUtils.lerp(door.currentOpenAngle, door.targetOpenAngle, delta * 5.0);

      // Swing left leaf counter-clockwise (outwards)
      door.leftLeaf.rotation.y = -door.currentOpenAngle;
      // Swing right leaf clockwise (outwards)
      door.rightLeaf.rotation.y = door.currentOpenAngle;

      // Animate swinging cat flap with realistic physics
      if (door.catFlap) {
        if (isNear && dist < 2.5) {
          door.flapAngle = THREE.MathUtils.lerp(door.flapAngle, Math.PI * 0.35, delta * 8.0);
        } else {
          door.flapAngle = THREE.MathUtils.lerp(door.flapAngle, 0, delta * 4.0);
        }
        door.catFlap.rotation.x = door.flapAngle;
      }
    });

    // 2. Animate Red Laser Light along Grand Staircase
    const t = this.laserTimer;
    const stairStep = (Math.sin(t * 1.6) + 1) * 0.5 * 17;
    const laserX = -24 + Math.cos(t * 2.8) * 4.5;
    const laserZ = 28 + stairStep * 1.6;
    const laserY = Math.max(0.1, stairStep * 0.42 + 0.15);

    this.laserTargetPos.set(laserX, laserY, laserZ);
    this.laserLightMesh.position.lerp(this.laserTargetPos, 0.2);

    // 3. Animate Robotic Vacuum Roomba wandering around Living Room
    this.roboVacuumPos.x += Math.sin(this.roboVacuumAngle) * this.roboVacuumSpeed * delta;
    this.roboVacuumPos.z += Math.cos(this.roboVacuumAngle) * this.roboVacuumSpeed * delta;

    // Bounce off 3x living room boundaries
    if (this.roboVacuumPos.x < -60 || this.roboVacuumPos.x > 15 || this.roboVacuumPos.z < -40 || this.roboVacuumPos.z > 35) {
      this.roboVacuumAngle += Math.PI * 0.65 + (Math.random() - 0.5) * 0.5;
      this.roboVacuumPos.x = THREE.MathUtils.clamp(this.roboVacuumPos.x, -58.5, 14.5);
      this.roboVacuumPos.z = THREE.MathUtils.clamp(this.roboVacuumPos.z, -38.5, 33.5);
    }

    this.roboVacuumGroup.position.copy(this.roboVacuumPos);
    this.roboVacuumGroup.rotation.y = this.roboVacuumAngle;

    // 3. Fall physics for knocked glasses
    this.kitchenGlasses.forEach((glass) => {
      if (glass.position.y > 0.25 && glass.rotation.z !== 0) {
        glass.position.y -= delta * 7;
        glass.rotation.x += delta * 9;
        if (glass.position.y <= 0.25) {
          glass.position.y = 0.25;
        }
      }
    });
  }
}
