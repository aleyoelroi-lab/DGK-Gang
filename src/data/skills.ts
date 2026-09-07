import { FloatingSkillDefinition, FloatingSkillPickup, FloatingSkillType } from '../types/game';

export const FLOATING_SKILLS_INFO: Record<FloatingSkillType, FloatingSkillDefinition> = {
  lightning: {
    type: 'lightning',
    name: 'Lightning Speed',
    isTrap: false,
    description: '+30% Movement & Sprint Speed for 3 minutes!',
    duration: 180,
    icon: '⚡',
    color: 'amber',
    hexColor: 0xfacc15,
  },
  spring: {
    type: 'spring',
    name: 'High Spring',
    isTrap: false,
    description: '+30% Higher Jump Altitude for 3 minutes!',
    duration: 180,
    icon: '🌀',
    color: 'cyan',
    hexColor: 0x06b6d4,
  },
  frog: {
    type: 'frog',
    name: 'Frog Double Jump',
    isTrap: false,
    description: 'Jump twice in mid-air (Double Jump) for 3 minutes!',
    duration: 180,
    icon: '🐸',
    color: 'emerald',
    hexColor: 0x22c55e,
  },
  claws: {
    type: 'claws',
    name: 'Wall Claws',
    isTrap: false,
    description: 'Stick & climb ANY wall by jumping/running into it for 3 minutes!',
    duration: 180,
    icon: '🐾',
    color: 'orange',
    hexColor: 0xf97316,
  },
  shades: {
    type: 'shades',
    name: 'Funky Shades (TRAP!)',
    isTrap: true,
    description: 'TRAP! Cat is trapped dancing groovy moves for 5 seconds!',
    duration: 5,
    icon: '🕶️',
    color: 'purple',
    hexColor: 0xa855f7,
  },
  bling_bling: {
    type: 'bling_bling',
    name: 'Bling Bling (TRAP!)',
    isTrap: true,
    description: 'TRAP! Cat is trapped sparkling and disco dancing for 5 seconds!',
    duration: 5,
    icon: '💎',
    color: 'pink',
    hexColor: 0xec4899,
  },
};

// 20 Strategic Spawn Locations Spread Throughout the Map & Maze Garden
export const SKILL_SPAWN_NODES: {
  id: string;
  defaultType: FloatingSkillType;
  position: { x: number; y: number; z: number };
  areaName: string;
}[] = [
  { id: 'skill_1', defaultType: 'lightning', position: { x: 0, y: 1.2, z: -15 }, areaName: 'Central Grand Atrium' },
  { id: 'skill_2', defaultType: 'frog', position: { x: 0, y: 9.0, z: 0 }, areaName: 'Atrium High Catwalk' },
  { id: 'skill_3', defaultType: 'spring', position: { x: -30, y: 2.0, z: 0 }, areaName: 'Living Room Sofa' },
  { id: 'skill_4', defaultType: 'claws', position: { x: -130, y: 5.5, z: 0 }, areaName: 'Grand Bookcase Mountain' },
  { id: 'skill_5', defaultType: 'shades', position: { x: -75, y: 2.2, z: -80 }, areaName: 'Master Bedroom Suite' },
  { id: 'skill_6', defaultType: 'lightning', position: { x: -22, y: 2.4, z: -38 }, areaName: 'Bedroom Study Laptop' },
  { id: 'skill_7', defaultType: 'bling_bling', position: { x: 12, y: 1.4, z: -52 }, areaName: 'Marble Spa Bathroom' },
  { id: 'skill_8', defaultType: 'spring', position: { x: 24, y: 2.4, z: -18 }, areaName: 'Gourmet Kitchen Island' },
  { id: 'skill_9', defaultType: 'frog', position: { x: 24, y: 3.0, z: 18 }, areaName: 'Grand Banquet Table' },
  { id: 'skill_10', defaultType: 'claws', position: { x: -24, y: 4.5, z: 35 }, areaName: 'Grand Staircase Mezzanine' },
  { id: 'skill_11', defaultType: 'lightning', position: { x: -24, y: 8.5, z: 65 }, areaName: 'Upper Loft Lookout' },
  { id: 'skill_12', defaultType: 'spring', position: { x: 0, y: 6.2, z: 95 }, areaName: 'Botanical Sunroom Tower' },
  { id: 'skill_13', defaultType: 'bling_bling', position: { x: -55, y: 1.4, z: 20 }, areaName: 'West Corridor Archway' },
  { id: 'skill_14', defaultType: 'shades', position: { x: 45, y: 1.4, z: -48 }, areaName: 'Wine Cellar & Pantry' },
  { id: 'skill_15', defaultType: 'claws', position: { x: 62, y: 8.0, z: 40 }, areaName: 'East Dining Catwalk' },
  // Maze Garden Spawns (High risk, high reward!)
  { id: 'skill_16', defaultType: 'lightning', position: { x: 48, y: 1.4, z: 60 }, areaName: 'Maze Garden Archway' },
  { id: 'skill_17', defaultType: 'frog', position: { x: 85, y: 1.4, z: 75 }, areaName: 'Maze North Winding Path' },
  { id: 'skill_18', defaultType: 'bling_bling', position: { x: 120, y: 1.4, z: 65 }, areaName: 'Maze Dead End Alcove' },
  { id: 'skill_19', defaultType: 'claws', position: { x: 95, y: 2.2, z: 105 }, areaName: 'Maze Central Gazebo Fountain' },
  { id: 'skill_20', defaultType: 'spring', position: { x: 130, y: 1.4, z: 135 }, areaName: 'Maze Secret Deep Corner' },
];

export function generateFloatingSkills(): FloatingSkillPickup[] {
  const types: FloatingSkillType[] = ['lightning', 'spring', 'frog', 'claws', 'shades', 'bling_bling'];
  
  return SKILL_SPAWN_NODES.map((node, index) => {
    // Distribute variety, ensuring traps and buffs are spread nicely
    const chosenType = index < 15 ? node.defaultType : types[index % types.length];
    return {
      id: node.id,
      type: chosenType,
      position: { ...node.position },
      isCollected: false,
      areaName: node.areaName,
    };
  });
}
