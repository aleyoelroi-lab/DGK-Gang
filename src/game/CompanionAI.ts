import * as THREE from 'three';
import { CatCharacter, CompanionCatAI, BanterType, CatExpression } from '../types/game';
import { Cat3DModel } from './CatModel';
import { COMPANION_BANTER_DIALOGUES } from '../data/characters';
import { HOUSE_ROOMS } from '../data/missions';

export class CompanionAIManager {
  public scene: THREE.Scene;
  public companions: {
    data: CompanionCatAI;
    model: Cat3DModel;
    targetRoom: string;
    moveTimer: number;
  }[] = [];

  private houseSpots: { pos: THREE.Vector3; room: string; expr: CatExpression; banter?: BanterType }[] = [
    { pos: new THREE.Vector3(-14, 0.35, 4.0), room: 'Living Room', expr: 'happy_purr', banter: 'dance' }, // Rug floor
    { pos: new THREE.Vector3(-14, 1.55, 0.4), room: 'Living Room', expr: 'sleepy_loaf', banter: 'purr' }, // Sofa cushion
    { pos: new THREE.Vector3(-32, 4.4, -10), room: 'Cat Tree Lounge', expr: 'focused_hunter' }, // Cat tree top
    { pos: new THREE.Vector3(24, 0.35, -12), room: 'Kitchen', expr: 'sassy_eyeroll' }, // Kitchen floor
    { pos: new THREE.Vector3(24, 2.3, 18), room: 'Dining Room', expr: 'cute_blep', banter: 'mischief_prank' }, // Dining table
    { pos: new THREE.Vector3(-24, 6.8, 52), room: 'Stairs & Loft', expr: 'gangster_smirk' }, // Upstairs loft
    { pos: new THREE.Vector3(-22, 0.35, -42), room: 'Master Bedroom', expr: 'sleepy_loaf' }, // Bedroom floor
    { pos: new THREE.Vector3(20, 0.35, -40), room: 'Bathroom', expr: 'happy_purr' }, // Bathroom floor
  ];

  constructor(scene: THREE.Scene, availableCats: CatCharacter[]) {
    this.scene = scene;
    this.spawnCompanions(availableCats);
  }

  private spawnCompanions(cats: CatCharacter[]) {
    cats.forEach((cat, idx) => {
      const model = new Cat3DModel(cat, {});
      const spot = this.houseSpots[idx % this.houseSpots.length];
      model.group.position.copy(spot.pos);
      this.scene.add(model.group);

      const dialogues = COMPANION_BANTER_DIALOGUES[cat.id] || [];
      const initDialogue = dialogues[0] || 'Meow!';

      this.companions.push({
        data: {
          id: `companion_${cat.id}`,
          character: cat,
          position: { x: spot.pos.x, y: spot.pos.y, z: spot.pos.z },
          rotation: 0,
          action: 'idle',
          currentExpression: spot.expr,
          targetPos: { x: spot.pos.x, y: spot.pos.y, z: spot.pos.z },
          dialogue: initDialogue,
          dialogueTimer: 6.0,
          currentRoom: spot.room,
          interactionCooldown: 0,
        },
        model: model,
        targetRoom: spot.room,
        moveTimer: Math.random() * 8 + 4,
      });
    });
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.companions.forEach((comp, idx) => {
      const data = comp.data;
      const model = comp.model;
      comp.moveTimer -= delta;
      data.dialogueTimer -= delta;

      // Rotate dialogue lines periodically
      if (data.dialogueTimer <= 0) {
        const dialogues = COMPANION_BANTER_DIALOGUES[data.character.id] || [];
        data.dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        data.dialogueTimer = 10.0 + Math.random() * 8;
      }

      // Pick new house spot periodically
      if (comp.moveTimer <= 0) {
        const newSpot = this.houseSpots[(idx + Math.floor(Math.random() * this.houseSpots.length)) % this.houseSpots.length];
        data.targetPos = { x: newSpot.pos.x, y: newSpot.pos.y, z: newSpot.pos.z };
        comp.targetRoom = newSpot.room;
        data.currentExpression = newSpot.expr;
        data.currentBanter = newSpot.banter;
        comp.moveTimer = 45 + Math.random() * 30;
      }

      // Distance to target
      const pos = model.group.position;
      const dx = data.targetPos.x - pos.x;
      const dz = data.targetPos.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      let speed = 0;
      let action: any = 'idle';

      if (dist > 0.6) {
        speed = 2.5;
        action = 'walk';
        const targetRot = Math.atan2(dx, dz);
        model.group.rotation.y = THREE.MathUtils.lerp(model.group.rotation.y, targetRot, delta * 4);
        model.group.position.x += Math.sin(model.group.rotation.y) * speed * delta;
        model.group.position.z += Math.cos(model.group.rotation.y) * speed * delta;
        model.group.position.y = THREE.MathUtils.lerp(model.group.position.y, data.targetPos.y, delta * 3);
      } else {
        // Reached destination - do banter or cute idle pose
        if (data.currentBanter) {
          action = data.currentBanter;
        } else if (data.currentExpression === 'sleepy_loaf') {
          action = 'loaf';
        } else {
          action = 'idle';
        }

        // Look towards player cat if close
        const pDx = playerPos.x - pos.x;
        const pDz = playerPos.z - pos.z;
        const pDist = Math.sqrt(pDx * pDx + pDz * pDz);
        if (pDist < 5.0) {
          const lookAtPlayer = Math.atan2(pDx, pDz);
          model.group.rotation.y = THREE.MathUtils.lerp(model.group.rotation.y, lookAtPlayer, delta * 3);
        }
      }

      // Update 3D Cat Animation Rig & Expression
      model.updateAnimation(
        {
          action: action,
          speed: speed,
          time: performance.now() * 0.001 + idx * 10,
          isGrounded: true,
          isClimbing: false,
          isInnocent: action === 'loaf',
          expression: data.currentExpression,
        },
        delta
      );

      data.position.x = model.group.position.x;
      data.position.y = model.group.position.y;
      data.position.z = model.group.position.z;
      data.currentRoom = comp.targetRoom;
    });
  }
}
