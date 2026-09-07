export type CatId = 'orange_gangster' | 'black_ninja' | 'sassy_tabby' | 'brawler_calico';

export interface CatCharacter {
  id: CatId;
  name: string;
  alias: string;
  personality: string;
  bio: string;
  furColor: string;
  accentColor: string;
  eyeColor: string;
  pattern: 'solid' | 'stripes' | 'ninja_mask' | 'brawler_patches';
  stats: {
    speed: number;
    agility: number;
    stealth: number;
    charm: number;
    brawl: number;
  };
  specialty: string;
  quote: string;
  defaultExpression: CatExpression;
}

export type CatExpression = 'happy_purr' | 'sassy_eyeroll' | 'cute_blep' | 'gangster_smirk' | 'shocked_busted' | 'focused_hunter' | 'sleepy_loaf' | 'angry_hiss';

export type AccessorySlot = 'head' | 'eyes' | 'neck' | 'body' | 'paws';

export interface StreetwearItem {
  id: string;
  name: string;
  slot: AccessorySlot;
  cost: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
  color: string;
  previewIcon: string;
}

export type BanterType = 'tickle' | 'dance' | 'purr' | 'play_hide' | 'mischief_prank';

export interface BanterDefinition {
  type: BanterType;
  name: string;
  key: string;
  description: string;
  credReward: number;
  duration: number; // in seconds
  icon: string;
  humorDialogue: string[];
}

export interface PlayerCustomization {
  selectedCatId: CatId;
  equipped: {
    head?: string;
    eyes?: string;
    neck?: string;
    body?: string;
    paws?: string;
  };
}

export interface HumanNpc {
  id: string;
  name: string;
  role: 'homeowner' | 'cleaner' | 'snack_chef' | 'pet_parent' | 'kiss_hunter';
  position: { x: number; y: number; z: number };
  rotation: number;
  state: 'idle' | 'patrolling' | 'investigating' | 'busted' | 'charmed' | 'tickled' | 'tripped' | 'kiss_hunt' | 'puckering' | 'kissing';
  suspicion: number; // 0 - 100
  visionAngle: number;
  visionDistance: number;
  investigateTarget?: { x: number; z: number };
  stateTimer: number;
  dialogue?: string;
  dialogueTimer?: number;
  isKissMonster?: boolean;
}

// Multiplayer Types (Max 4 Players)
export interface MultiplayerPlayer {
  id: string;
  slot: number; // 1 to 4
  name: string;
  catId: CatId;
  customization?: PlayerCustomization['equipped'];
  position: { x: number; y: number; z: number };
  rotation: number;
  action: 'idle' | 'walk' | 'run' | 'jump' | 'loaf' | 'climb' | 'banter';
  currentBanter?: BanterType;
  currentExpression: CatExpression;
  isLoafing: boolean;
  isClimbing: boolean;
  isDashing: boolean;
  isMicActive: boolean;
  isSpeaking: boolean;
  ping: number;
  lastUpdate: number;
}

export interface MultiplayerRoomState {
  roomId: string;
  players: MultiplayerPlayer[];
  sharedMission: WeirdMission | null;
  isKissHuntActive: boolean;
  kissHuntTimer: number;
  missionCompletedBy?: string;
}

export type WebRTCSignalType = 'offer' | 'answer' | 'ice_candidate';

export interface WebRTCSignalPacket {
  type: WebRTCSignalType;
  targetId: string;
  senderId: string;
  signal: any;
}

export type BoxColor = 'Red' | 'Blue' | 'Green' | 'Gold';

export interface ColoredBox {
  id: string;
  color: BoxColor;
  name: string;
  hexColor: string;
  accentHex: number;
  position: { x: number; y: number; z: number };
  roomName: string;
}

export interface BoxSurvivalMission {
  assignedColor: BoxColor;
  durationSeconds: number; // 10 mins = 600s
  secondsLeft: number;
  isCatInBox: boolean;
  isInsaneMode: boolean;
  insaneSecondsLeft: number; // 3 mins = 180s
  roundNumber: number;
}

// 7 Weird House Missions (Legacy compatibility)
export type MissionId =
  | 'stairway_laser_chase'
  | 'dining_table_heist'
  | 'glass_gravity_knocker'
  | 'bathroom_mummy_roll'
  | 'warm_laptop_keyboard_nap'
  | 'robo_vacuum_rodeo'
  | 'curtain_climber_bat';

export interface WeirdMission {
  id: MissionId;
  title: string;
  icon: string;
  category: 'Stealth' | 'Agility' | 'Chaos' | 'Cuteness' | 'Heist';
  description: string;
  objective: string;
  targetRoom: string;
  targetPosition: { x: number; y: number; z: number };
  targetCount: number;
  currentCount: number;
  durationSeconds: number; // 15 mins = 900
  secondsLeft: number;
  rewardCred: number;
  completed: boolean;
  flavorQuote: string;
  hint: string;
}

export interface HouseRoom {
  id: string;
  name: string;
  shortName: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  color: string;
  icon: string;
}

export interface CompanionCatAI {
  id: string;
  character: CatCharacter;
  position: { x: number; y: number; z: number };
  rotation: number;
  action: 'idle' | 'walk' | 'run' | 'jump' | 'loaf' | 'banter' | 'nap';
  currentBanter?: BanterType;
  currentExpression: CatExpression;
  targetPos: { x: number; y: number; z: number };
  dialogue?: string;
  dialogueTimer: number;
  currentRoom: string;
  interactionCooldown: number;
}

export interface InteractiveProp {
  id: string;
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
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  isInteracted?: boolean;
  interactProgress?: number; // 0 to 1 or count
  roomName: string;
}

// Floating Skills & Trap Pickups System (Every 2 mins, 20 skills across map)
export type FloatingSkillType = 'lightning' | 'spring' | 'frog' | 'claws' | 'shades' | 'bling_bling';

export interface FloatingSkillDefinition {
  type: FloatingSkillType;
  name: string;
  isTrap: boolean;
  description: string;
  duration: number; // in seconds: 180s for buffs, 5s for traps
  icon: string;
  color: string;
  hexColor: number;
}

export interface FloatingSkillPickup {
  id: string;
  type: FloatingSkillType;
  position: { x: number; y: number; z: number };
  isCollected: boolean;
  areaName: string;
}

export interface ActiveSkillsState {
  lightningSecondsLeft: number; // +30% speed for 3 mins
  springSecondsLeft: number;    // +30% jump height for 3 mins
  frogSecondsLeft: number;      // Jump twice in air (double jump) for 3 mins
  clawsSecondsLeft: number;     // Stick & climb any wall for 3 mins
  trapDanceSecondsLeft: number; // Trap: dance uncontrollably for 5s
  trapType: 'shades' | 'bling_bling' | null;
}
