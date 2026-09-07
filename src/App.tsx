import React, { useState, useEffect } from 'react';
import {
  CatId,
  BanterType,
  AccessorySlot,
  PlayerCustomization,
  WeirdMission,
  CatExpression,
  MultiplayerPlayer,
  BoxColor,
  FloatingSkillPickup,
  ActiveSkillsState,
} from './types/game';
import { CAT_CHARACTERS } from './data/characters';
import { COLORED_BOXES, getRandomBoxColor } from './data/boxes';
import { generateFloatingSkills, FLOATING_SKILLS_INFO } from './data/skills';
import { GameCanvas } from './game/GameCanvas';
import { HUD } from './components/HUD';
import { StreetwearShop } from './components/StreetwearShop';
import { HelpModal } from './components/HelpModal';
import { GameOverModal } from './components/GameOverModal';
import { PhotoModeModal } from './components/PhotoModeModal';
import { VoiceStudioModal } from './components/VoiceStudioModal';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { GrossKissOverlay } from './components/GrossKissOverlay';
import { ClawBragOverlay } from './components/ClawBragOverlay';
import { soundEngine } from './utils/audio';
import { multiplayerClient } from './utils/multiplayer';
import { speechMeowDetector } from './utils/speechMeowDetector';

export default function App() {
  // Random Initial Cat Selection on Start
  const [selectedCatId, setSelectedCatId] = useState<CatId>(() => {
    const randomIndex = Math.floor(Math.random() * CAT_CHARACTERS.length);
    return CAT_CHARACTERS[randomIndex].id;
  });

  const [customization, setCustomization] = useState<PlayerCustomization['equipped']>({
    head: 'head_snapback',
    eyes: 'eyes_thug_shades',
    neck: 'neck_gold_chain',
    body: 'body_camo_hoodie',
    paws: 'paws_red_kicks',
  });

  const [unlockedItems, setUnlockedItems] = useState<string[]>([
    'head_snapback',
    'head_ninja_band',
    'eyes_thug_shades',
    'neck_gold_chain',
    'neck_red_bandana',
    'body_camo_hoodie',
    'paws_red_kicks',
  ]);

  const [streetCred, setStreetCred] = useState<number>(850);
  const [combo, setCombo] = useState<number>(0);
  const [suspicion, setSuspicion] = useState<number>(0);
  const [surgeSecondsLeft, setSurgeSecondsLeft] = useState<number>(300);
  const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);
  const [surgeDurationLeft, setSurgeDurationLeft] = useState<number>(0);
  const [isInnocentPersona, setIsInnocentPersona] = useState<boolean>(false);
  const [activeBanter, setActiveBanter] = useState<BanterType | null>(null);
  const [humanDialogue, setHumanDialogue] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // House Simulation & Mission States
  const [activeMission, setActiveMission] = useState<WeirdMission | null>(null);
  const [nextMissionSecondsLeft, setNextMissionSecondsLeft] = useState<number>(600);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; z: number }>({ x: -14, y: 0.4, z: 6 });
  const [playerRoomName, setPlayerRoomName] = useState<string>('Grand Central Atrium');
  const [companions, setCompanions] = useState<any[]>([]);
  const [currentExpression, setCurrentExpression] = useState<CatExpression>('happy_purr');
  const [isFocusCamActive, setIsFocusCamActive] = useState<boolean>(false);
  const [humans, setHumans] = useState<any[]>([]);

  // 4 COLORED BOX SURVIVAL MISSION (Replaces all legacy tasks)
  // Cats are assigned 1 of 4 colored boxes to find and enter within 10 minutes.
  // Whoever is not in their assigned box will be hunted by 12 insane humans for 3 minutes!
  const [assignedBoxColor, setAssignedBoxColor] = useState<BoxColor>(() => getRandomBoxColor());
  const [boxMissionSecondsLeft, setBoxMissionSecondsLeft] = useState<number>(600); // 10 minutes (600s)
  const [isSafeInBox, setIsSafeInBox] = useState<boolean>(false);
  const [isInsaneModeActive, setIsInsaneModeActive] = useState<boolean>(false);
  const [insaneModeSecondsLeft, setInsaneModeSecondsLeft] = useState<number>(180); // 3 minutes (180s)
  const [boxSurvivalRound, setBoxSurvivalRound] = useState<number>(1);

  // HISS WITH CLAW BRAG & 5-MIN RELOAD SYSTEM
  // Hiss reloads every 5 minutes (300s). Stuns all 12 humans for 10s only!
  const [hissCooldownSecondsLeft, setHissCooldownSecondsLeft] = useState<number>(0);
  const [hissStunSecondsLeft, setHissStunSecondsLeft] = useState<number>(0);
  const [isClawBragActive, setIsClawBragActive] = useState<boolean>(false);

  // 20 FLOATING SKILLS & TRAPS
  // Spawns 20 skills every 2 minutes or upon every new round/task.
  // Buffs ("lightning", "spring", "frog", "claws") last 3 minutes (180s).
  // Traps ("shades", "bling_bling") lock the cat in a dance for 5s!
  const [floatingSkills, setFloatingSkills] = useState<FloatingSkillPickup[]>(() => generateFloatingSkills());
  const [skillRespawnSecondsLeft, setSkillRespawnSecondsLeft] = useState<number>(120); // 2 minutes (120s)
  const [activeSkills, setActiveSkills] = useState<ActiveSkillsState>({
    lightningSecondsLeft: 0,
    springSecondsLeft: 0,
    frogSecondsLeft: 0,
    clawsSecondsLeft: 0,
    trapDanceSecondsLeft: 0,
    trapType: null,
  });

  // 2-Minute Skills Respawn Timer Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSkillRespawnSecondsLeft((prev) => {
        if (prev <= 1) {
          // 2 minutes reached! Respawn 20 fresh skills across the map!
          setFloatingSkills(generateFloatingSkills());
          setSpeechMeowNotification('✨ 20 Floating Skills have respawned across the grounds & maze!');
          setTimeout(() => setSpeechMeowNotification(null), 3000);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Respawn 20 floating skills whenever a new box survival round / task begins
  useEffect(() => {
    setFloatingSkills(generateFloatingSkills());
    setSkillRespawnSecondsLeft(120);
  }, [boxSurvivalRound]);

  // Active Skills & Traps Countdown Timer (1s ticks)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSkills((prev) => {
        const hasAnyActive =
          prev.lightningSecondsLeft > 0 ||
          prev.springSecondsLeft > 0 ||
          prev.frogSecondsLeft > 0 ||
          prev.clawsSecondsLeft > 0 ||
          prev.trapDanceSecondsLeft > 0;
        if (!hasAnyActive) return prev;

        return {
          lightningSecondsLeft: Math.max(0, prev.lightningSecondsLeft - 1),
          springSecondsLeft: Math.max(0, prev.springSecondsLeft - 1),
          frogSecondsLeft: Math.max(0, prev.frogSecondsLeft - 1),
          clawsSecondsLeft: Math.max(0, prev.clawsSecondsLeft - 1),
          trapDanceSecondsLeft: Math.max(0, prev.trapDanceSecondsLeft - 1),
          trapType: prev.trapDanceSecondsLeft <= 1 ? null : prev.trapType,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Collecting a Floating Skill or Trap
  const handleCollectSkill = (skillId: string) => {
    const skill = floatingSkills.find((s) => s.id === skillId);
    if (!skill || skill.isCollected) return;

    // Mark as collected
    setFloatingSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, isCollected: true } : s))
    );

    const info = FLOATING_SKILLS_INFO[skill.type];

    if (info.isTrap) {
      // Trap: 5 seconds dance trap!
      setActiveSkills((prev) => ({
        ...prev,
        trapDanceSecondsLeft: 5,
        trapType: skill.type,
      }));
      soundEngine.playTrapDanceTrigger();
      setSpeechMeowNotification(`⚠️ TRAP TRIGGERED! ${info.name}! Dancing uncontrollably for 5s!`);
      setTimeout(() => setSpeechMeowNotification(null), 3000);
    } else {
      // Buff: 3 minutes duration!
      soundEngine.playSkillPickup(skill.type);
      setActiveSkills((prev) => {
        const next = { ...prev };
        if (skill.type === 'lightning') next.lightningSecondsLeft = 180;
        if (skill.type === 'spring') next.springSecondsLeft = 180;
        if (skill.type === 'frog') next.frogSecondsLeft = 180;
        if (skill.type === 'claws') next.clawsSecondsLeft = 180;
        return next;
      });
      setSpeechMeowNotification(`✨ SKILL ACQUIRED: ${info.name}! Active for 3 minutes!`);
      setTimeout(() => setSpeechMeowNotification(null), 3500);
    }
  };

  // 4 COLORED BOX SURVIVAL MISSION & DISTANCE COMPUTATION
  const currentAssignedBox = COLORED_BOXES.find((b) => b.color === assignedBoxColor) || COLORED_BOXES[0];
  const distToAssignedBox = Math.round(
    Math.hypot(playerPos.x - currentAssignedBox.position.x, playerPos.z - currentAssignedBox.position.z)
  );
  // Inside box check: within 2.2m of box center and close to ground floor level
  const isInsideBoxNow = distToAssignedBox <= 2.2 && playerPos.y <= 0.85;

  useEffect(() => {
    if (isInsideBoxNow !== isSafeInBox) {
      setIsSafeInBox(isInsideBoxNow);
      if (isInsideBoxNow) {
        soundEngine.playBoxEnteredSafe();
      }
    }
  }, [isInsideBoxNow, isSafeInBox]);

  // 10-Minute Box Mission Deadline & 3-Minute 12 Humans Insane Chase Mode
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInsaneModeActive) {
        setBoxMissionSecondsLeft((prev) => {
          if (prev <= 1) {
            // 10 minutes reached! Activate Insane Mode!
            setIsInsaneModeActive(true);
            setInsaneModeSecondsLeft(180); // 3 minutes of insane chasing!
            soundEngine.playInsaneModeAlarm();
            if (isInsideBoxNow) {
              setStreetCred((c) => c + 500);
              soundEngine.playCredEarned();
            }
            return 0;
          }
          return prev - 1;
        });
      } else {
        setInsaneModeSecondsLeft((prev) => {
          if (prev <= 1) {
            // 3 minutes of Insane Mode survived! Reset to next round!
            setIsInsaneModeActive(false);
            setBoxMissionSecondsLeft(600); // New 10-minute round!
            setAssignedBoxColor(getRandomBoxColor());
            setBoxSurvivalRound((r) => r + 1);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isInsaneModeActive, isInsideBoxNow]);

  // Hiss Reload Cooldown (5 Minutes / 300s) & 10-Second Stun Timer
  useEffect(() => {
    if (hissCooldownSecondsLeft <= 0 && hissStunSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setHissCooldownSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setHissStunSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [hissCooldownSecondsLeft, hissStunSecondsLeft]);

  // Trigger Fierce Claw Hiss
  const triggerHissAction = () => {
    if (hissCooldownSecondsLeft > 0) {
      const mins = Math.floor(hissCooldownSecondsLeft / 60);
      const secs = hissCooldownSecondsLeft % 60;
      setSpeechMeowNotification(`⏳ Hiss Reloading: ${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      setTimeout(() => setSpeechMeowNotification(null), 2500);
      return;
    }

    setHissCooldownSecondsLeft(300); // 5-minute reload!
    setHissStunSecondsLeft(10); // 10-second stun only!
    setIsClawBragActive(true);
    soundEngine.playFierceHissWithClaws();
    multiplayerClient.sendCatAction('hiss');

    // Notify GameCanvas AI manager to freeze all 12 humans for 10 seconds
    window.dispatchEvent(new CustomEvent('trigger-hiss-stun'));

    setSpeechMeowNotification('⚔️ FIERCE CLAW HISS! All 12 humans stunned for 10s!');
    setTimeout(() => {
      setIsClawBragActive(false);
      setSpeechMeowNotification(null);
    }, 2800);
  };

  // Listen for speech hiss & request-hiss-action events
  useEffect(() => {
    const handleSpeechHissEvent = () => {
      triggerHissAction();
    };
    window.addEventListener('speech-hiss-detected', handleSpeechHissEvent);
    window.addEventListener('request-hiss-action', handleSpeechHissEvent);

    return () => {
      window.removeEventListener('speech-hiss-detected', handleSpeechHissEvent);
      window.removeEventListener('request-hiss-action', handleSpeechHissEvent);
    };
  }, [hissCooldownSecondsLeft]);

  // Multiplayer & Don't Get Kiss state
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<MultiplayerPlayer[]>([]);
  const [roomCode, setRoomCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'PUBLIC_1';
  });
  const [isKissHuntActive, setIsKissHuntActive] = useState<boolean>(false);
  const [kissHuntTimer, setKissHuntTimer] = useState<number>(0);

  // Modals & Panels
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showPhotoMode, setShowPhotoMode] = useState<boolean>(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState<boolean>(false);
  const [showLobby, setShowLobby] = useState<boolean>(false);
  const [voiceUpdateTick, setVoiceUpdateTick] = useState<number>(0);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);

  // Slow-Mo Kiss Disaster, Shift Sprint, and Voice Speech-to-Meow States
  const [slowMoKissInfo, setSlowMoKissInfo] = useState<{ humanName: string } | null>(null);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [speechMeowNotification, setSpeechMeowNotification] = useState<string | null>(null);
  const [isMicListening, setIsMicListening] = useState<boolean>(true);

  const currentCharacter = CAT_CHARACTERS.find((c) => c.id === selectedCatId) || CAT_CHARACTERS[0];

  // Initialize Speech-to-Meow microphone listening
  useEffect(() => {
    if (isMicListening) {
      speechMeowDetector.start();
    } else {
      speechMeowDetector.stop();
    }

    const handleSpeechMeowEvent = (e: any) => {
      const detectedText = e.detail?.transcript || 'MEOW!';
      setSpeechMeowNotification(detectedText);
      setTimeout(() => {
        setSpeechMeowNotification(null);
      }, 3000);
    };

    window.addEventListener('speech-meow-detected', handleSpeechMeowEvent);
    return () => {
      window.removeEventListener('speech-meow-detected', handleSpeechMeowEvent);
      speechMeowDetector.stop();
    };
  }, [isMicListening]);

  // Listen to multiplayer Kiss Hunt events
  useEffect(() => {
    const handleKissHunt = (data: { durationSeconds: number }) => {
      setIsKissHuntActive(true);
      setKissHuntTimer(data.durationSeconds || 60);
    };

    const handleMissionCleared = () => {
      setIsKissHuntActive(false);
    };

    multiplayerClient.on('kiss_hunt_started', handleKissHunt);
    multiplayerClient.on('mission_completed', handleMissionCleared);
    multiplayerClient.on('new_mission_started', handleMissionCleared);

    return () => {
      multiplayerClient.off('kiss_hunt_started', handleKissHunt);
      multiplayerClient.off('mission_completed', handleMissionCleared);
      multiplayerClient.off('new_mission_started', handleMissionCleared);
    };
  }, []);

  // Disable Context Menu on Right Click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Kiss Hunt countdown timer
  useEffect(() => {
    if (!isKissHuntActive || kissHuntTimer <= 0) return;
    const interval = setInterval(() => {
      setKissHuntTimer((prev) => {
        if (prev <= 1) {
          setIsKissHuntActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isKissHuntActive, kissHuntTimer]);

  // Handlers
  const handleAddStreetCred = (amount: number) => {
    setStreetCred((prev) => prev + amount);
  };

  const handleGameOver = (reason: string) => {
    setGameOverReason(reason);
    setIsInnocentPersona(false);
  };

  const handleRespawn = () => {
    setGameOverReason(null);
    setSuspicion(0);
    setIsInnocentPersona(true);
    // Pick another random cat on respawn!
    const randomIndex = Math.floor(Math.random() * CAT_CHARACTERS.length);
    setSelectedCatId(CAT_CHARACTERS[randomIndex].id);
    soundEngine.playInnocentPurr();
  };

  const handleEquipItem = (slot: AccessorySlot, itemId?: string) => {
    setCustomization((prev) => ({
      ...prev,
      [slot]: itemId,
    }));
  };

  const handleUnlockItem = (itemId: string, cost: number) => {
    if (streetCred >= cost) {
      setStreetCred((prev) => prev - cost);
      setUnlockedItems((prev) => [...prev, itemId]);
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.setMuted(nextMute);
  };

  const handleTriggerBanter = (type: BanterType) => {
    setActiveBanter(type);
    setIsInnocentPersona(false);
  };

  // Keyboard shortcut to toggle Cuteness Focus Cam [C], Photo Mode [P], Voice Studio [M], or Lobby [L]
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'p' || e.key === 'P') {
        setShowPhotoMode((prev) => !prev);
      }
      if (e.key === 'r' || e.key === 'R') {
        setShowHelp((prev) => !prev);
      }
      if (e.key === 'c' || e.key === 'C') {
        setIsFocusCamActive((prev) => !prev);
      }
      if (e.key === 'm' || e.key === 'M') {
        setShowVoiceStudio((prev) => !prev);
      }
      if (e.key === 'l' || e.key === 'L') {
        setShowLobby((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 font-['Plus_Jakarta_Sans'] select-none">
      {/* 3D Game Canvas Engine */}
      <GameCanvas
        selectedCharacter={currentCharacter}
        customization={customization}
        streetCred={streetCred}
        onAddStreetCred={handleAddStreetCred}
        onGameOver={handleGameOver}
        isPaused={Boolean(gameOverReason || showShop || showHelp || showPhotoMode || showVoiceStudio || showLobby || slowMoKissInfo)}
        isInnocentPersona={isInnocentPersona}
        onToggleInnocentPersona={setIsInnocentPersona}
        activeBanter={activeBanter}
        onTriggerBanter={handleTriggerBanter}
        onClearBanter={() => setActiveBanter(null)}
        onSurgeCountdownUpdate={(secs, active, dur) => {
          setSurgeSecondsLeft(secs);
          setIsSurgeActive(active);
          setSurgeDurationLeft(dur);
        }}
        onSuspicionUpdate={setSuspicion}
        onHumanDialogueUpdate={setHumanDialogue}
        onComboUpdate={setCombo}
        onActiveMissionUpdate={setActiveMission}
        onNextMissionTimerUpdate={setNextMissionSecondsLeft}
        onPlayerPositionUpdate={(pos, room) => {
          setPlayerPos(pos);
          setPlayerRoomName(room);
        }}
        onCompanionsUpdate={setCompanions}
        onExpressionUpdate={setCurrentExpression}
        isFocusCamActive={isFocusCamActive}
        onHumansUpdate={setHumans}
        onMultiplayerPlayersUpdate={setMultiplayerPlayers}
        isKissHuntActive={isKissHuntActive}
        isInsaneModeActive={isInsaneModeActive}
        onTriggerSlowMoKiss={(humanName) => setSlowMoKissInfo({ humanName })}
        onSprintStateUpdate={setIsSprinting}
        floatingSkills={floatingSkills}
        activeSkills={activeSkills}
        onCollectSkill={handleCollectSkill}
      />

      {/* Heads-Up Display (HUD) */}
      <HUD
        character={currentCharacter}
        streetCred={streetCred}
        combo={combo}
        suspicion={suspicion}
        surgeSecondsLeft={surgeSecondsLeft}
        isSurgeActive={isSurgeActive}
        surgeDurationLeft={surgeDurationLeft}
        isInnocentPersona={isInnocentPersona}
        onToggleInnocentPersona={setIsInnocentPersona}
        activeBanter={activeBanter}
        onTriggerBanter={handleTriggerBanter}
        humanDialogue={humanDialogue}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenShop={() => setShowShop(true)}
        onOpenPhotoMode={() => setShowPhotoMode(true)}
        onOpenHelp={() => setShowHelp(true)}
        onOpenVoiceStudio={() => setShowVoiceStudio(true)}
        hasCustomMeow={soundEngine.hasCustomMeow()}
        hasCustomHiss={soundEngine.hasCustomHiss()}
        activeMission={activeMission}
        nextMissionSecondsLeft={nextMissionSecondsLeft}
        playerPos={playerPos}
        playerRoomName={playerRoomName}
        companions={companions}
        currentExpression={currentExpression}
        isFocusCamActive={isFocusCamActive}
        onToggleFocusCam={() => setIsFocusCamActive((prev) => !prev)}
        humans={humans}
        multiplayerPlayers={multiplayerPlayers}
        isKissHuntActive={isKissHuntActive}
        kissHuntTimer={kissHuntTimer}
        isSprinting={isSprinting}
        speechMeowNotification={speechMeowNotification}
        isMicListening={isMicListening}
        onToggleMicListening={() => setIsMicListening((prev) => !prev)}

        // 4 Colored Box Survival Mission
        assignedBoxColor={assignedBoxColor}
        boxMissionSecondsLeft={boxMissionSecondsLeft}
        isSafeInBox={isSafeInBox}
        distToAssignedBox={distToAssignedBox}
        isInsaneModeActive={isInsaneModeActive}
        insaneModeSecondsLeft={insaneModeSecondsLeft}
        boxSurvivalRound={boxSurvivalRound}

        // Fierce Claw Hiss with 5-Minute Reload & 10s Stun
        hissCooldownSecondsLeft={hissCooldownSecondsLeft}
        hissStunSecondsLeft={hissStunSecondsLeft}
        onTriggerHiss={triggerHissAction}

        // 20 Floating Skills, Traps & Active Buffs
        floatingSkills={floatingSkills}
        activeSkills={activeSkills}
        skillRespawnSecondsLeft={skillRespawnSecondsLeft}
      />

      {/* Fierce Claw Brag Slash Overlay & 10s Stun Status */}
      {isClawBragActive && (
        <ClawBragOverlay
          stunSecondsLeft={hissStunSecondsLeft}
          onAnimationComplete={() => setIsClawBragActive(false)}
        />
      )}

      {/* Slow-Motion Wet Gross Kiss Disaster Sequence */}
      {slowMoKissInfo && (
        <GrossKissOverlay
          humanName={slowMoKissInfo.humanName}
          onFinishKiss={() => {
            const humanCaught = slowMoKissInfo.humanName;
            setSlowMoKissInfo(null);
            handleGameOver(
              `💋 CAUGHT IN SLOW-MO BY ${humanCaught}! You were pinned and covered in sloppy saliva and 100 layers of greasy lipstick! Remember: climb onto the tall cat skyscraper towers, bookcases, or chandeliers to stay completely safe!`
            );
          }}
        />
      )}

      {/* Modals & Dialogs */}
      {showLobby && (
        <MultiplayerLobby
          roomCode={roomCode}
          onUpdateRoomCode={setRoomCode}
          selectedCatId={selectedCatId}
          onClose={() => setShowLobby(false)}
          onStartGame={() => setShowLobby(false)}
          multiplayerPlayers={multiplayerPlayers}
        />
      )}

      {showVoiceStudio && (
        <VoiceStudioModal
          onClose={() => setShowVoiceStudio(false)}
          onVoiceUpdated={() => setVoiceUpdateTick((t) => t + 1)}
        />
      )}

      {showShop && (
        <StreetwearShop
          customization={customization}
          streetCred={streetCred}
          onEquipItem={handleEquipItem}
          onUnlockItem={handleUnlockItem}
          unlockedItems={unlockedItems}
          onClose={() => setShowShop(false)}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showPhotoMode && <PhotoModeModal onClose={() => setShowPhotoMode(false)} />}

      {gameOverReason && (
        <GameOverModal
          reason={gameOverReason}
          streetCred={streetCred}
          character={currentCharacter}
          onRetry={handleRespawn}
          onOpenShop={() => {
            setGameOverReason(null);
            setShowShop(true);
          }}
        />
      )}
    </div>
  );
}
