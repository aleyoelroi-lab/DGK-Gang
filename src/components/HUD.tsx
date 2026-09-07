import React, { useState } from 'react';
import { BanterType, CatCharacter, WeirdMission, CatExpression, MultiplayerPlayer, BoxColor, FloatingSkillPickup, ActiveSkillsState } from '../types/game';
import { BANTER_ACTIONS } from '../data/characters';
import { HOUSE_ROOMS } from '../data/missions';
import { COLORED_BOXES } from '../data/boxes';
import { FLOATING_SKILLS_INFO } from '../data/skills';
import {
  Sparkles,
  Shield,
  Eye,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  Camera,
  Shirt,
  HelpCircle,
  Compass,
  MapPin,
  Clock,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Users,
  Share2,
  Check,
  Zap,
} from 'lucide-react';
import { multiplayerClient } from '../utils/multiplayer';

interface HUDProps {
  character: CatCharacter;
  streetCred: number;
  combo: number;
  suspicion: number;
  surgeSecondsLeft: number;
  isSurgeActive: boolean;
  surgeDurationLeft: number;
  isInnocentPersona: boolean;
  onToggleInnocentPersona: (active: boolean) => void;
  activeBanter: BanterType | null;
  onTriggerBanter: (type: BanterType) => void;
  humanDialogue: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenShop: () => void;
  onOpenPhotoMode: () => void;
  onOpenHelp: () => void;
  onOpenVoiceStudio: () => void;
  hasCustomMeow?: boolean;
  hasCustomHiss?: boolean;
  activeMission: WeirdMission | null;
  nextMissionSecondsLeft: number;
  playerPos: { x: number; y: number; z: number };
  playerRoomName: string;
  companions: { id: string; character: CatCharacter; position: { x: number; y: number; z: number }; dialogue?: string; currentExpression: CatExpression }[];
  currentExpression: CatExpression;
  isFocusCamActive: boolean;
  onToggleFocusCam: () => void;
  humans: { name: string; position: { x: number; y: number; z: number }; suspicion: number; state: string }[];
  multiplayerPlayers?: MultiplayerPlayer[];
  isKissHuntActive?: boolean;
  kissHuntTimer?: number;
  isSprinting?: boolean;
  speechMeowNotification?: string | null;
  isMicListening?: boolean;
  onToggleMicListening?: () => void;

  // 4 Colored Box Survival Mission
  assignedBoxColor: BoxColor;
  boxMissionSecondsLeft: number;
  isSafeInBox: boolean;
  distToAssignedBox: number;
  isInsaneModeActive: boolean;
  insaneModeSecondsLeft: number;
  boxSurvivalRound: number;

  // Hiss with 5-Minute Reload & Stun
  hissCooldownSecondsLeft: number;
  hissStunSecondsLeft: number;
  onTriggerHiss: () => void;

  // 20 Floating Skills, Traps & Active Buffs
  floatingSkills?: FloatingSkillPickup[];
  activeSkills?: ActiveSkillsState;
  skillRespawnSecondsLeft?: number;
}

export const HUD: React.FC<HUDProps> = ({
  character,
  streetCred,
  combo,
  suspicion,
  surgeSecondsLeft,
  isSurgeActive,
  surgeDurationLeft,
  isInnocentPersona,
  onToggleInnocentPersona,
  activeBanter,
  onTriggerBanter,
  humanDialogue,
  isMuted,
  onToggleMute,
  onOpenShop,
  onOpenPhotoMode,
  onOpenHelp,
  onOpenVoiceStudio,
  hasCustomMeow = false,
  hasCustomHiss = false,
  activeMission,
  nextMissionSecondsLeft,
  playerPos,
  playerRoomName,
  companions,
  currentExpression,
  isFocusCamActive,
  onToggleFocusCam,
  humans,
  multiplayerPlayers = [],
  isKissHuntActive = false,
  kissHuntTimer = 0,
  isSprinting = false,
  speechMeowNotification = null,
  isMicListening = true,
  onToggleMicListening,

  // 4 Colored Box Survival Mission
  assignedBoxColor,
  boxMissionSecondsLeft,
  isSafeInBox,
  distToAssignedBox,
  isInsaneModeActive,
  insaneModeSecondsLeft,
  boxSurvivalRound,

  // Hiss with 5-Minute Reload & Stun
  hissCooldownSecondsLeft,
  hissStunSecondsLeft,
  onTriggerHiss,

  // 20 Floating Skills & Traps
  floatingSkills = [],
  activeSkills,
  skillRespawnSecondsLeft = 120,
}) => {
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const currentAssignedBox = COLORED_BOXES.find((b) => b.color === assignedBoxColor) || COLORED_BOXES[0];

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(Math.max(0, secs) / 60);
    const s = Math.floor(Math.max(0, secs) % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleMic = () => {
    const active = multiplayerClient.toggleMicrophone();
    setIsMicMuted(!active);
  };

  const handleCopyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Expression UI Metadata
  const expressionMeta: { [key in CatExpression]: { label: string; icon: string; color: string; desc: string } } = {
    happy_purr: { label: 'Happy Purr', icon: '💖', color: 'text-pink-400', desc: 'Vibrating bliss & pink cheek blush' },
    sassy_eyeroll: { label: 'Sassy Eye-Roll', icon: '🙄', color: 'text-teal-300', desc: 'Supreme feline judgment' },
    cute_blep: { label: 'Cute Blep', icon: '😋', color: 'text-amber-400', desc: 'Pink tongue out with sparkly eyes' },
    gangster_smirk: { label: 'Don Smirk', icon: '😼', color: 'text-emerald-400', desc: 'Iron paw confidence' },
    shocked_busted: { label: 'Shocked / Busted', icon: '🙀', color: 'text-red-400', desc: 'Airplane ears & huge dilated eyes' },
    focused_hunter: { label: 'Stealth Hunter', icon: '🥷', color: 'text-indigo-400', desc: 'Sharp shadow focus' },
    sleepy_loaf: { label: 'Innocent Loaf', icon: '🍞', color: 'text-amber-200', desc: 'Sweet harmless pet disguise' },
    angry_hiss: { label: 'Angry Hiss', icon: '😾', color: 'text-rose-500', desc: 'Airplane ears hiss & skkkkk sound' },
  };

  const currentExpr = expressionMeta[currentExpression] || expressionMeta.happy_purr;

  // Calculate distance to active mission target
  const getDistanceToMission = () => {
    if (!activeMission) return null;
    const dx = activeMission.targetPosition.x - playerPos.x;
    const dz = activeMission.targetPosition.z - playerPos.z;
    return Math.round(Math.sqrt(dx * dx + dz * dz));
  };

  const missionDist = getDistanceToMission();
  const totalConnected = multiplayerPlayers.length + 1;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-5 select-none z-30 font-['Plus_Jakarta_Sans']">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Player Cat ID & 4-Player Online Voice Squad */}
        <div className="flex flex-col gap-2">
          {/* Main Cat Stats Card */}
          <div className="pointer-events-auto flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 px-3.5 py-2.5 rounded-2xl shadow-xl backdrop-blur-md">
            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold border shadow-inner flex-shrink-0"
              style={{
                backgroundColor: character.furColor,
                borderColor: character.accentColor,
                color: '#111',
              }}
            >
              🐱
              <div className="absolute -bottom-1 -right-1 text-sm bg-neutral-950/90 rounded-full px-1 border border-neutral-700">
                {currentExpr.icon}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-100 text-sm md:text-base font-['Chakra_Petch']">{character.name}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {character.personality}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-extrabold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{streetCred.toLocaleString()} Cred</span>
                </div>
                <div className="text-neutral-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{playerRoomName}</span>
                </div>
                {combo > 1 && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 font-bold rounded border border-red-500/30 animate-pulse">
                    <Flame className="w-3 h-3" /> {combo}x COMBO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4-Player Online Squad & Automatic Voice Chat Bar */}
          <div className="pointer-events-auto flex items-center justify-between gap-3 bg-neutral-900/90 border border-indigo-500/30 px-3 py-2 rounded-xl shadow-lg backdrop-blur-md max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-300">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Squad: {totalConnected}/4</span>
              </div>

              {/* Connected Player Slots Icons */}
              <div className="flex items-center -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center text-[10px]" title="You (Player 1)">
                  🐱
                </div>
                {multiplayerPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${
                      p.isSpeaking ? 'border-emerald-400 bg-emerald-950/80 animate-pulse' : 'border-indigo-400 bg-indigo-950/60'
                    }`}
                    title={`${p.name} (${p.isSpeaking ? 'Speaking' : 'Mic Active'})`}
                  >
                    🐱
                  </div>
                ))}
              </div>
            </div>

            {/* Mic Auto-On & Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleMic}
                title={isMicMuted ? 'Mic Muted - Click to Unmute' : 'Voice Chat Auto ON - Click to Mute'}
                className={`px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 ${
                  !isMicMuted
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-red-950/70 border-red-500/50 text-red-300'
                }`}
              >
                {!isMicMuted ? <Mic className="w-3.5 h-3.5 animate-pulse" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{!isMicMuted ? 'Mic ON' : 'Muted'}</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                title="Copy Multiplayer Game Link (Max 4 Players)"
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-indigo-300 border border-neutral-700 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: 4 Colored Box Survival Mission & 12 Humans Insane Alert */}
        <div className="flex flex-col items-center max-w-md w-full">
          {/* 12 Humans Insane Mode Active Alert (Lasts 3 Minutes) */}
          {isInsaneModeActive ? (
            <div className="pointer-events-auto w-full bg-red-950/95 border-2 border-red-500 text-red-100 p-3 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.7)] backdrop-blur-md animate-pulse">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-3xl animate-bounce">💋😱</span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-red-400 font-['Chakra_Petch']">
                      ⚠️ 12 HUMANS INSANE CHASE (3 MINS)!
                    </div>
                    <div className="text-[11px] text-red-200 font-bold">
                      12 humans in hyper-frenzy (+30% speed) chasing for a kiss!
                    </div>
                  </div>
                </div>
                <div className="text-right font-black text-amber-300 text-base font-['Chakra_Petch']">
                  {formatTime(insaneModeSecondsLeft)}
                </div>
              </div>
              <div
                className={`mt-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-center border ${
                  isSafeInBox
                    ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300'
                    : 'bg-red-900/80 border-red-500/60 text-amber-200'
                }`}
              >
                {isSafeInBox ? (
                  <span>🛡️ SAFE INSIDE YOUR [{assignedBoxColor.toUpperCase()}] BOX! You are immune!</span>
                ) : (
                  <span>🏃 OUTSIDE BOX! Rush to your {assignedBoxColor} Box ({distToAssignedBox}m away) or climb high onto a Cat Skyscraper!</span>
                )}
              </div>
            </div>
          ) : (
            <div className="pointer-events-auto w-full bg-neutral-900/90 border border-neutral-700 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-base shadow-md font-black"
                    style={{ backgroundColor: currentAssignedBox.hexColor }}
                  >
                    📦
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black font-['Chakra_Petch'] text-amber-300 tracking-wide uppercase">
                        ROUND {boxSurvivalRound}: {assignedBoxColor.toUpperCase()} BOX MISSION
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-black border text-neutral-950"
                        style={{ backgroundColor: currentAssignedBox.hexColor, borderColor: '#ffffff' }}
                      >
                        {assignedBoxColor.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-300 font-medium">
                      Find & enter the {assignedBoxColor} Box before 10 mins!
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center justify-end gap-1 text-sm font-black font-['Chakra_Petch'] text-amber-400">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>{formatTime(boxMissionSecondsLeft)}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-bold">10 Min Deadline</div>
                </div>
              </div>

              {/* Status & Distance to assigned box */}
              <div
                className={`flex items-center justify-between text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                  isSafeInBox
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{currentAssignedBox.name} ({currentAssignedBox.roomName})</span>
                </div>
                <div className="font-bold">
                  {isSafeInBox ? (
                    <span className="text-emerald-300 flex items-center gap-1">✅ SAFE INSIDE BOX!</span>
                  ) : (
                    <span className="text-amber-400">{distToAssignedBox}m away</span>
                  )}
                </div>
              </div>

              {/* Urgency Warning when <= 60s */}
              {boxMissionSecondsLeft <= 60 && boxMissionSecondsLeft > 0 && !isSafeInBox && (
                <div className="mt-2 bg-red-950/90 border border-red-500/80 p-2 rounded-xl text-red-200 flex items-center justify-between gap-2 animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce flex-shrink-0" />
                    <span className="text-[11px] font-bold">
                      ⚠️ UNDER 1 MINUTE! Enter your {assignedBoxColor} Box or 12 humans hunt for kisses!
                    </span>
                  </div>
                  <span className="text-xs font-black text-amber-300 bg-red-900/60 px-1.5 py-0.5 rounded border border-red-500/50 font-['Chakra_Petch']">
                    {boxMissionSecondsLeft}s
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 5-Min Human Surge Warning Alert */}
          {isSurgeActive && (
            <div className="pointer-events-auto mt-2 bg-red-950/95 border-2 border-red-500 text-red-200 px-5 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md animate-pulse flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">🚨 HUMAN INSPECTION SCAN!</div>
                <div className="text-sm font-black font-['Chakra_Petch'] text-red-100">
                  HOLD [SPACE] TO LOAF! {surgeDurationLeft.toFixed(1)}s
                </div>
              </div>
            </div>
          )}

          {/* High-Speed Shift Sprint Run Indicator */}
          {isSprinting && (
            <div className="pointer-events-auto mt-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs md:text-sm px-4 py-1.5 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.85)] border border-yellow-200 flex items-center gap-2 animate-pulse">
              <Zap className="w-4 h-4 fill-current text-neutral-950 animate-bounce" />
              <span>⚡ SHIFT SPRINT ACTIVE: 2.2x MAXIMUM SPEED!</span>
            </div>
          )}

          {/* Spoken Meow Voice Recognition Toast */}
          {speechMeowNotification && (
            <div className="pointer-events-auto mt-2 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 text-white px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.7)] border-2 border-pink-300 font-extrabold text-xs md:text-sm flex items-center gap-2 animate-bounce">
              <span className="text-base">🎤</span>
              <span>SPOKEN MEOW DETECTED: "{speechMeowNotification}"! 🐾</span>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-black border border-pink-200/40">
                HUMANS SLOWED 78%!
              </span>
            </div>
          )}

          {/* Human Dialogue Speech Bubble */}
          {humanDialogue && (
            <div className="mt-2 bg-white/95 text-neutral-900 px-3.5 py-1.5 rounded-2xl shadow-2xl border border-neutral-300 text-xs font-semibold text-center animate-fade-in max-w-sm">
              💬 {humanDialogue}
            </div>
          )}
        </div>

        {/* Top Right: House Map Radar & Quick Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
            <button
              onClick={onOpenVoiceStudio}
              title="Cat Voice Studio - Record Real Meows & Hisses [M]"
              className={`p-2 rounded-xl transition flex items-center gap-1.5 ${
                hasCustomMeow || hasCustomHiss
                  ? 'bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 border border-pink-500/40 shadow-sm'
                  : 'hover:bg-neutral-800 text-neutral-300 hover:text-amber-400'
              }`}
            >
              <Mic className="w-4 h-4" />
              {(hasCustomMeow || hasCustomHiss) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
            <button
              onClick={onOpenShop}
              title="Streetwear Wardrobe"
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition"
            >
              <Shirt className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenPhotoMode}
              title="Cuteness Photo Mode [P]"
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-pink-400 transition"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-300 hover:text-cyan-400 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onOpenHelp}
              title="Game Rules & Survival Guide [R]"
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline font-['Chakra_Petch']">RULES [R]</span>
            </button>
          </div>

          {/* House Interactive Mini-Map / Radar (3x Scaled) */}
          <div className="pointer-events-auto relative bg-neutral-900/90 border border-neutral-800 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md w-44 md:w-56">
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <span className="flex items-center gap-1 text-cyan-400">
                <Compass className="w-3 h-3" /> 3X Mansion Map
              </span>
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="hover:text-neutral-200 transition"
                title="Expand / Minimize Map"
              >
                {isMapExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>

            {/* Radar Canvas / Grid Display (320m x 320m World Coordinate Frame) */}
            <div
              className={`relative bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden transition-all duration-300 ${
                isMapExpanded ? 'h-64' : 'h-40'
              }`}
            >
              {/* Coordinate projection helper */}
              {(() => {
                const toMapPercent = (coord: number) => Math.max(3, Math.min(97, ((coord + 160) / 320) * 100));

                return (
                  <>
                    {/* Maze Garden Area Outline (North-East: X 45..145, Z 55..145) */}
                    <div
                      className="absolute border border-emerald-500/50 bg-emerald-950/30 rounded flex items-center justify-center text-[7px] font-black text-emerald-400 pointer-events-none"
                      style={{
                        left: `${toMapPercent(45)}%`,
                        top: `${toMapPercent(55)}%`,
                        width: `${(100 / 320) * 100}%`,
                        height: `${(90 / 320) * 100}%`,
                      }}
                      title="Labyrinth Hedge Maze Garden"
                    >
                      🌿 Maze
                    </div>

                    {/* 4 Colored Box Survival Targets */}
                    {COLORED_BOXES.map((box) => {
                      const isTarget = box.color === assignedBoxColor;
                      return (
                        <div
                          key={box.id}
                          className={`absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-sm border flex items-center justify-center text-[7px] font-black z-20 transition-all ${
                            isTarget ? 'scale-125 ring-2 ring-white animate-pulse' : 'opacity-85'
                          }`}
                          style={{
                            backgroundColor: box.hexColor,
                            borderColor: isTarget ? '#ffffff' : '#000000',
                            left: `${toMapPercent(box.position.x)}%`,
                            top: `${toMapPercent(box.position.z)}%`,
                            boxShadow: isTarget ? `0 0 12px ${box.hexColor}` : undefined,
                          }}
                          title={`${box.name} (${box.roomName}) ${isTarget ? '★ YOUR ASSIGNED TARGET ★' : ''}`}
                        >
                          📦
                        </div>
                      );
                    })}

                    {/* Climbing Tower Safe Haven Indicators */}
                    <div
                      className="absolute w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center justify-center text-[7px] z-10"
                      style={{ left: `${toMapPercent(0)}%`, top: `${toMapPercent(0)}%`, transform: 'translate(-50%, -50%)' }}
                      title="Alpha Skyscraper (Climb to Escape Kiss!)"
                    >
                      🧗
                    </div>
                    <div
                      className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center justify-center text-[6px] z-10"
                      style={{ left: `${toMapPercent(-60)}%`, top: `${toMapPercent(-30)}%` }}
                      title="Beta Tower (Safe High Haven)"
                    >
                      🧗
                    </div>
                    <div
                      className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center justify-center text-[6px] z-10"
                      style={{ left: `${toMapPercent(70)}%`, top: `${toMapPercent(60)}%` }}
                      title="Gamma Tower (Safe High Haven)"
                    >
                      🧗
                    </div>

                    {/* 20 Floating Skills & Traps on Map */}
                    {floatingSkills.map((skill) => {
                      if (skill.isCollected) return null;
                      const info = FLOATING_SKILLS_INFO[skill.type];
                      return (
                        <div
                          key={skill.id}
                          className="absolute w-2.5 h-2.5 -ml-1 -mt-1 rounded-full flex items-center justify-center text-[7px] z-15 animate-bounce shadow"
                          style={{
                            left: `${toMapPercent(skill.position.x)}%`,
                            top: `${toMapPercent(skill.position.z)}%`,
                          }}
                          title={`Skill: ${info.name}`}
                        >
                          <span>{info.icon}</span>
                        </div>
                      );
                    })}

                    {/* Remote Multiplayer Cats */}
                    {multiplayerPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border border-indigo-300 shadow z-25"
                        style={{
                          backgroundColor: '#818cf8',
                          left: `${toMapPercent(p.position.x)}%`,
                          top: `${toMapPercent(p.position.z)}%`,
                        }}
                        title={`Cat: ${p.name}`}
                      />
                    ))}

                    {/* Humans Markers (12 humans) */}
                    {humans.map((h, i) => (
                      <div
                        key={i}
                        className={`absolute w-2.5 h-2.5 -ml-1 -mt-1 rounded-full shadow z-20 ${
                          h.state === 'kiss_hunt'
                            ? 'bg-pink-500 border border-red-300 animate-ping'
                            : 'bg-red-500 border border-red-300'
                        }`}
                        style={{
                          left: `${toMapPercent(h.position.x)}%`,
                          top: `${toMapPercent(h.position.z)}%`,
                        }}
                        title={`Human: ${h.name}`}
                      />
                    ))}

                    {/* Player Cat Marker */}
                    <div
                      className="absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow-xl z-30"
                      style={{
                        backgroundColor: character.furColor,
                        left: `${toMapPercent(playerPos.x)}%`,
                        top: `${toMapPercent(playerPos.z)}%`,
                      }}
                      title="You"
                    >
                      <div className="w-1 h-1 bg-white rounded-full mx-auto my-0.5 animate-ping" />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Radar Legend & Counters (Cats, Humans, Boxes, Skills) */}
            <div className="mt-1.5 px-2 py-1 bg-neutral-900/90 rounded border border-neutral-800 text-[8px] flex items-center justify-between text-neutral-300 font-bold">
              <span className="text-amber-300">🐱 Cats ({1 + multiplayerPlayers.length})</span>
              <span className="text-rose-400">👤 Humans ({humans.length})</span>
              <span className="text-sky-400">📦 Boxes (4)</span>
              <span className="text-amber-200">✨ Skills ({floatingSkills.filter((s) => !s.isCollected).length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-3 w-full">
        {/* Left: Suspicion Meter & Innocent Loaf Button */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Suspicion Bar */}
          <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-2xl shadow-xl backdrop-blur-md w-44 md:w-52">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neutral-400" />
                <span>Human Alert</span>
              </span>
              <span
                className={`text-xs font-black font-['Chakra_Petch'] ${
                  suspicion > 70 ? 'text-red-400 animate-pulse' : suspicion > 30 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {Math.round(suspicion)}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className={`h-full transition-all duration-300 ${
                  suspicion > 70 ? 'bg-red-500' : suspicion > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, suspicion)}%` }}
              />
            </div>
          </div>

          {/* Innocent Loaf / Pet Persona Toggle Button */}
          <button
            onClick={() => onToggleInnocentPersona(!isInnocentPersona)}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs md:text-sm border shadow-xl backdrop-blur-md transition flex items-center gap-2 ${
              isInnocentPersona
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-amber-500/20'
                : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border-neutral-700'
            }`}
            title="Toggle Innocent Pet Persona [B] or [Q]"
          >
            <Shield className="w-4 h-4" />
            <div>
              <div className="leading-tight">{isInnocentPersona ? 'Loafing (Innocent)' : 'Innocent Loaf'}</div>
              <div className="text-[9px] opacity-75 font-normal">[B / Q]</div>
            </div>
          </button>

          {/* Quick Cat Vocals: Meow (Slows Humans!) & Hiss */}
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('cat-trigger-meow'));
              }}
              className={`px-3 py-1.5 hover:bg-pink-500/20 hover:text-pink-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                hasCustomMeow
                  ? 'bg-pink-950/70 border-pink-500/50 text-pink-200'
                  : 'bg-neutral-800 border-neutral-700/60 text-neutral-300'
              }`}
              title="Meow [E] - Charms and drastically slows down nearby humans by 78%!"
            >
              <span className="text-sm">🐱</span>
              <span>Meow [E]</span>
              <span className="text-[9px] bg-pink-500/30 text-pink-300 px-1 py-0.2 rounded font-bold border border-pink-400/30">
                SLOWS 🐾
              </span>
              {hasCustomMeow && (
                <span className="text-[9px] bg-pink-500/40 text-pink-300 px-1 py-0.2 rounded font-black border border-pink-400/40">
                  REAL
                </span>
              )}
            </button>

            {/* Mic Speech-to-Meow detector button */}
            <button
              onClick={onToggleMicListening}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isMicListening
                  ? 'bg-rose-950/80 hover:bg-rose-900/80 border-rose-500/60 text-rose-200'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700/60 text-neutral-400'
              }`}
              title="Say 'MEOW' in microphone to charm and slow humans!"
            >
              <Mic className={`w-3.5 h-3.5 ${isMicListening ? 'text-rose-400 animate-pulse' : 'text-neutral-500'}`} />
              <span>Mic Meow</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-black border ${
                  isMicListening
                    ? 'bg-rose-500/40 text-rose-200 border-rose-400/40'
                    : 'bg-neutral-700 text-neutral-400 border-neutral-600'
                }`}
              >
                {isMicListening ? 'SAY "MEOW"' : 'MUTED'}
              </span>
            </button>
            {/* Fierce Claw Hiss & Stun Button (Say 'Hiss' or Key H) */}
            <button
              onClick={onTriggerHiss}
              disabled={hissCooldownSecondsLeft > 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                hissStunSecondsLeft > 0
                  ? 'bg-amber-500 text-neutral-950 border-amber-300 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                  : hissCooldownSecondsLeft > 0
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-500/70 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              }`}
              title="Fierce Claw Hiss [H] or say 'HISS' in mic! Stuns all 12 humans for 10s! 5 min reload."
            >
              <span className="text-sm">⚔️</span>
              <span>Hiss [H]</span>
              {hissStunSecondsLeft > 0 ? (
                <span className="text-[9px] bg-neutral-950 text-amber-300 px-1.5 py-0.2 rounded font-black border border-amber-400">
                  STUN {hissStunSecondsLeft}s
                </span>
              ) : hissCooldownSecondsLeft > 0 ? (
                <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-bold border border-neutral-700">
                  {Math.floor(hissCooldownSecondsLeft / 60)}m {hissCooldownSecondsLeft % 60}s
                </span>
              ) : (
                <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded font-black border border-amber-400/40">
                  STUN 10s
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Center/Right: Floating Skills & Traps Status Bar (Replaces legacy skills 1-5) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-2.5 rounded-2xl shadow-xl backdrop-blur-md overflow-x-auto max-w-full">
          {/* Trap Alert Banner if trapped */}
          {activeSkills?.trapDanceSecondsLeft && activeSkills.trapDanceSecondsLeft > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/25 border border-pink-400 text-pink-200 animate-bounce">
              <span className="text-xl">🕺</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-wider uppercase text-pink-300">
                  {activeSkills.trapType === 'shades' ? '🕶️ Cool Shades Trap!' : '💎 Bling Bling Trap!'}
                </span>
                <span className="text-xs font-bold text-white">
                  Dancing for {activeSkills.trapDanceSecondsLeft}s!
                </span>
              </div>
            </div>
          ) : null}

          {/* Active Buff Badges */}
          {activeSkills?.lightningSecondsLeft && activeSkills.lightningSecondsLeft > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 shadow-sm">
              <span className="text-base">⚡</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-amber-300 uppercase">Speed +30%</span>
                <span className="text-[11px] font-black font-['Chakra_Petch']">
                  {formatTime(activeSkills.lightningSecondsLeft)}
                </span>
              </div>
            </div>
          ) : null}

          {activeSkills?.springSecondsLeft && activeSkills.springSecondsLeft > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-sm">
              <span className="text-base">🌀</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-cyan-300 uppercase">Jump +30%</span>
                <span className="text-[11px] font-black font-['Chakra_Petch']">
                  {formatTime(activeSkills.springSecondsLeft)}
                </span>
              </div>
            </div>
          ) : null}

          {activeSkills?.frogSecondsLeft && activeSkills.frogSecondsLeft > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 shadow-sm">
              <span className="text-base">🐸</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-emerald-300 uppercase">Double Jump</span>
                <span className="text-[11px] font-black font-['Chakra_Petch']">
                  {formatTime(activeSkills.frogSecondsLeft)}
                </span>
              </div>
            </div>
          ) : null}

          {activeSkills?.clawsSecondsLeft && activeSkills.clawsSecondsLeft > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/20 border border-orange-400 text-orange-200 shadow-sm">
              <span className="text-base">🐾</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-orange-300 uppercase">Wall Claws</span>
                <span className="text-[11px] font-black font-['Chakra_Petch']">
                  {formatTime(activeSkills.clawsSecondsLeft)}
                </span>
              </div>
            </div>
          ) : null}

          {/* If no buffs or traps are active, show floating skills respawn timer and count */}
          {(!activeSkills ||
            (!activeSkills.lightningSecondsLeft &&
              !activeSkills.springSecondsLeft &&
              !activeSkills.frogSecondsLeft &&
              !activeSkills.clawsSecondsLeft &&
              !activeSkills.trapDanceSecondsLeft)) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300">
              <span className="text-base">✨</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-amber-300 uppercase">
                  Floating Skills ({floatingSkills.filter((s) => !s.isCollected).length}/20 on Map)
                </span>
                <span className="text-[11px] font-bold text-neutral-200 flex items-center gap-1.5">
                  <span>Respawn:</span>
                  <span className="font-['Chakra_Petch'] font-black text-amber-400">
                    {formatTime(skillRespawnSecondsLeft)}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
