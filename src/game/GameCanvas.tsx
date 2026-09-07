import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { CatCharacter, PlayerCustomization, BanterType, WeirdMission, CatExpression, MultiplayerPlayer, FloatingSkillPickup, ActiveSkillsState } from '../types/game';
import { CAT_CHARACTERS, BANTER_ACTIONS, COMPANION_BANTER_DIALOGUES } from '../data/characters';
import { WEIRD_MISSIONS_POOL, HOUSE_ROOMS } from '../data/missions';
import { FLOATING_SKILLS_INFO } from '../data/skills';
import { Cat3DModel } from './CatModel';
import { WorldBuilder } from './WorldBuilder';
import { HumanAIManager } from './HumanAI';
import { soundEngine } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';

interface GameCanvasProps {
  selectedCharacter: CatCharacter;
  customization: PlayerCustomization['equipped'];
  streetCred: number;
  onAddStreetCred: (amount: number) => void;
  onGameOver: (reason: string) => void;
  isPaused: boolean;
  isInnocentPersona: boolean;
  onToggleInnocentPersona: (active: boolean) => void;
  activeBanter: BanterType | null;
  onTriggerBanter: (type: BanterType) => void;
  onClearBanter: () => void;
  onSurgeCountdownUpdate: (secondsLeft: number, isSurgeActive: boolean, durationLeft: number) => void;
  onSuspicionUpdate: (suspicion: number) => void;
  onHumanDialogueUpdate: (dialogue: string | null) => void;
  onComboUpdate: (combo: number) => void;
  onActiveMissionUpdate: (mission: WeirdMission | null) => void;
  onNextMissionTimerUpdate: (seconds: number) => void;
  onPlayerPositionUpdate: (pos: { x: number; y: number; z: number }, roomName: string) => void;
  onCompanionsUpdate: (companions: any[]) => void;
  onExpressionUpdate: (expr: CatExpression) => void;
  isFocusCamActive: boolean;
  onHumansUpdate: (humans: any[]) => void;
  onMultiplayerPlayersUpdate?: (players: MultiplayerPlayer[]) => void;
  isKissHuntActive?: boolean;
  isInsaneModeActive?: boolean;
  onTriggerSlowMoKiss?: (humanName: string) => void;
  onSprintStateUpdate?: (isSprinting: boolean) => void;
  // Floating Skills & Trap Pickups
  floatingSkills?: FloatingSkillPickup[];
  activeSkills?: ActiveSkillsState;
  onCollectSkill?: (skillId: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedCharacter,
  customization,
  streetCred,
  onAddStreetCred,
  onGameOver,
  isPaused,
  isInnocentPersona,
  onToggleInnocentPersona,
  activeBanter,
  onTriggerBanter,
  onClearBanter,
  onSurgeCountdownUpdate,
  onSuspicionUpdate,
  onHumanDialogueUpdate,
  onComboUpdate,
  onActiveMissionUpdate,
  onNextMissionTimerUpdate,
  onPlayerPositionUpdate,
  onCompanionsUpdate,
  onExpressionUpdate,
  isFocusCamActive,
  onHumansUpdate,
  onMultiplayerPlayersUpdate,
  isKissHuntActive: propIsKissHuntActive = false,
  isInsaneModeActive = false,
  onTriggerSlowMoKiss,
  onSprintStateUpdate,
  floatingSkills = [],
  activeSkills,
  onCollectSkill,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // References for Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerCatModelRef = useRef<Cat3DModel | null>(null);
  const worldBuilderRef = useRef<WorldBuilder | null>(null);
  const humanAIMgrRef = useRef<HumanAIManager | null>(null);

  // Remote 3D Cat Models for live online multiplayer (up to 4 players)
  const remotePlayerModels = useRef<Map<string, { model: Cat3DModel; labelGroup: THREE.Group }>>(new Map());

  // Physics & Player State
  const playerPos = useRef<THREE.Vector3>(new THREE.Vector3(-14, 0.4, 6));
  const playerVel = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const playerRot = useRef<number>(Math.PI); // Facing forward
  const isGrounded = useRef<boolean>(true);
  const isClimbing = useRef<boolean>(false);
  const isDashing = useRef<boolean>(false);
  const isRidingVacuum = useRef<boolean>(false);
  const vacuumMountCooldown = useRef<number>(0);

  // Floating Skills & Trap States
  const hasUsedDoubleJump = useRef<boolean>(false);
  const wasSpacePressed = useRef<boolean>(false);
  const isTouchingWall = useRef<boolean>(false);
  const floatingSkillsRef = useRef<FloatingSkillPickup[]>(floatingSkills);
  floatingSkillsRef.current = floatingSkills;
  const activeSkillsRef = useRef<ActiveSkillsState | undefined>(activeSkills);
  activeSkillsRef.current = activeSkills;
  const floatingSkillMeshesRef = useRef<Map<string, { group: THREE.Group; crystal: THREE.Mesh; ring: THREE.Mesh; aura?: THREE.Mesh; basePosY: number }>>(new Map());

  // Camera Orbit
  const cameraAngle = useRef<{ phi: number; theta: number; distance: number }>({
    phi: 0.35,
    theta: 0,
    distance: 4.8,
  });

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mouseDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Temporary expression / sound timer
  const tempExprTimer = useRef<number>(0);
  const tempExprType = useRef<CatExpression | null>(null);

  // Banter active timer
  const currentBanterTimer = useRef<number>(0);
  const currentBanterType = useRef<BanterType | null>(null);
  const comboStreak = useRef<number>(0);
  const comboResetTimer = useRef<number>(0);

  // Multiplayer sync tick timer
  const lastNetworkSyncTime = useRef<number>(0);

  // Active Meow Sonic Shockwave Rings
  const meowRings = useRef<{ mesh: THREE.Mesh; noteGroup: THREE.Group; startTime: number; maxRadius: number }[]>([]);

  // Spawn visual expanding 3D Meow Sonic Rings with floating charm hearts
  const spawnMeowSonicWave = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Expanding neon ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.55, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(pos.x, pos.y + 0.15, pos.z);
    scene.add(ringMesh);

    // Floating charm hearts & musical notes
    const noteGroup = new THREE.Group();
    noteGroup.position.copy(pos);
    const heartGeo = new THREE.SphereGeometry(0.12, 8, 8);
    heartGeo.scale(1, 1.2, 0.4);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0xdb2777,
      emissiveIntensity: 0.6,
    });

    for (let i = 0; i < 4; i++) {
      const heart = new THREE.Mesh(heartGeo, heartMat);
      const angle = (i / 4) * Math.PI * 2;
      heart.position.set(Math.cos(angle) * 0.6, 0.4, Math.sin(angle) * 0.6);
      noteGroup.add(heart);
    }
    scene.add(noteGroup);

    meowRings.current.push({
      mesh: ringMesh,
      noteGroup,
      startTime: performance.now(),
      maxRadius: 18.0,
    });
  };

  // Trigger Meow Action: sounds, visual shockwave, and slows down all nearby humans!
  const triggerMeowAction = () => {
    soundEngine.playCustomOrSyntheticMeow();
    tempExprType.current = 'happy_purr';
    tempExprTimer.current = 2.0;
    multiplayerClient.sendCatAction('meow');

    // Visual 3D Meow Wave
    spawnMeowSonicWave(playerPos.current);

    // Apply Meow Slowdown effect to all human NPCs
    if (humanAIMgrRef.current) {
      const slowedHumans = humanAIMgrRef.current.applyMeowWave(playerPos.current, onHumanDialogueUpdate);
      if (slowedHumans > 0) {
        onAddStreetCred(50);
        confetti({
          particleCount: 30,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#f472b6', '#fb7185', '#ec4899', '#fde047'],
        });
      }
    }
  };

  // Helper to determine current room name in 3x expanded mansion
  const getCurrentRoomName = (x: number, z: number): string => {
    for (const room of HOUSE_ROOMS) {
      if (
        x >= room.bounds.minX * 2.5 &&
        x <= room.bounds.maxX * 2.5 &&
        z >= room.bounds.minZ * 2.5 &&
        z <= room.bounds.maxZ * 2.5
      ) {
        return room.name;
      }
    }
    return 'Grand Central Atrium';
  };

  // Connect to Multiplayer WebSocket
  useEffect(() => {
    // Room ID from URL or default
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room') || 'PUBLIC_1';

    multiplayerClient.connect(roomParam);

    const handlePlayerJoined = (player: MultiplayerPlayer) => {
      spawnRemotePlayerModel(player);
    };

    const handlePlayerLeft = (data: { id: string }) => {
      removeRemotePlayerModel(data.id);
    };

    const handlePlayerMoved = (player: MultiplayerPlayer) => {
      updateRemotePlayerTransform(player);
    };

    const handleMissionUpdate = (data: any) => {
      if (multiplayerClient.sharedMission) {
        onActiveMissionUpdate({ ...multiplayerClient.sharedMission });
      }
    };

    const handleMissionCompleted = (data: any) => {
      // 1 player completing saves ALL cats!
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      soundEngine.playCelebration();
      onAddStreetCred(data.rewardCred || 1000);
      if (humanAIMgrRef.current) {
        humanAIMgrRef.current.isKissHuntActive = false;
      }
    };

    const handleKissHuntStarted = (data: any) => {
      soundEngine.playKissHuntAlert();
      if (humanAIMgrRef.current) {
        humanAIMgrRef.current.isKissHuntActive = true;
      }
    };

    multiplayerClient.on('player_joined', handlePlayerJoined);
    multiplayerClient.on('player_left', handlePlayerLeft);
    multiplayerClient.on('player_moved', handlePlayerMoved);
    multiplayerClient.on('mission_progress_update', handleMissionUpdate);
    multiplayerClient.on('mission_completed', handleMissionCompleted);
    multiplayerClient.on('new_mission_started', handleMissionUpdate);
    multiplayerClient.on('kiss_hunt_started', handleKissHuntStarted);

    return () => {
      multiplayerClient.off('player_joined', handlePlayerJoined);
      multiplayerClient.off('player_left', handlePlayerLeft);
      multiplayerClient.off('player_moved', handlePlayerMoved);
      multiplayerClient.off('mission_progress_update', handleMissionUpdate);
      multiplayerClient.off('mission_completed', handleMissionCompleted);
      multiplayerClient.off('new_mission_started', handleMissionUpdate);
      multiplayerClient.off('kiss_hunt_started', handleKissHuntStarted);
    };
  }, []);

  // Update profile to server when character/customization changes
  useEffect(() => {
    multiplayerClient.sendPlayerProfile(selectedCharacter.name, selectedCharacter.id, customization);
  }, [selectedCharacter, customization]);

  // Remote 3D Player Mesh helpers
  const spawnRemotePlayerModel = (player: MultiplayerPlayer) => {
    if (!sceneRef.current) return;
    if (remotePlayerModels.current.has(player.id)) return;

    const charDef = CAT_CHARACTERS.find((c) => c.id === player.catId) || CAT_CHARACTERS[0];
    const catModel = new Cat3DModel(charDef, player.customization || {});
    catModel.group.position.set(player.position.x, player.position.y, player.position.z);
    catModel.group.rotation.y = player.rotation;
    sceneRef.current.add(catModel.group);

    // Floating 3D Name Tag & Mic Indicator
    const labelGroup = new THREE.Group();
    labelGroup.position.set(0, 1.3, 0);

    // Canvas label texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(4, 4, 248, 56, 12);
        ctx.fill();
        ctx.strokeStyle = charDef.accentColor || '#38bdf8';
        ctx.lineWidth = 4;
        ctx.roundRect(4, 4, 248, 56, 12);
        ctx.stroke();
      } else {
        ctx.fillRect(4, 4, 248, 56);
        ctx.strokeStyle = charDef.accentColor || '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 56);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.name || 'Operative', 128, 38);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1);
    labelGroup.add(sprite);

    catModel.group.add(labelGroup);

    remotePlayerModels.current.set(player.id, { model: catModel, labelGroup });
  };

  const removeRemotePlayerModel = (id: string) => {
    const entry = remotePlayerModels.current.get(id);
    if (entry && sceneRef.current) {
      sceneRef.current.remove(entry.model.group);
      remotePlayerModels.current.delete(id);
    }
  };

  const updateRemotePlayerTransform = (player: MultiplayerPlayer) => {
    let entry = remotePlayerModels.current.get(player.id);
    if (!entry) {
      spawnRemotePlayerModel(player);
      entry = remotePlayerModels.current.get(player.id);
    }
    if (!entry) return;

    entry.model.group.position.lerp(
      new THREE.Vector3(player.position.x, player.position.y, player.position.z),
      0.3
    );
    entry.model.group.rotation.y = player.rotation;
    entry.model.setExpression(player.currentExpression || 'happy_purr');
    entry.model.updateAnimation(
      {
        action: player.action,
        speed: player.action === 'run' ? 8 : player.action === 'walk' ? 3 : 0,
        time: Date.now() * 0.001,
        isGrounded: !player.isClimbing && player.position.y <= 0.45,
        isClimbing: player.isClimbing,
        isInnocent: player.isLoafing,
        expression: player.currentExpression || 'happy_purr',
      },
      0.016
    );
  };

  // --- Main Three.js Initialization & Game Loop ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getWidth = () => Math.max(container.clientWidth || window.innerWidth || 800, 100);
    const getHeight = () => Math.max(container.clientHeight || window.innerHeight || 600, 100);

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const initialWidth = getWidth();
    const initialHeight = getHeight();
    const camera = new THREE.PerspectiveCamera(
      65,
      initialWidth / initialHeight,
      0.1,
      800
    );
    camera.position.set(-14, 3.2, 10.8);
    cameraRef.current = camera;

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // WebGL Context Lost & Restored protection
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost, keeping animation frame alive.');
    };
    const handleContextRestored = () => {
      console.log('WebGL context restored successfully.');
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 3. 3x Bigger World & Human AI Setup
    const world = new WorldBuilder(scene);
    worldBuilderRef.current = world;

    const humanMgr = new HumanAIManager(scene);
    humanAIMgrRef.current = humanMgr;

    // 4. Player 3D Cat Model
    const catModel = new Cat3DModel(selectedCharacter, customization);
    catModel.group.position.copy(playerPos.current);
    catModel.group.rotation.y = playerRot.current;
    scene.add(catModel.group);
    playerCatModelRef.current = catModel;

    // 5. Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing in inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      keysPressed.current[e.code] = true;
      keysPressed.current[e.key] = true;
      if (e.shiftKey) {
        keysPressed.current['Shift'] = true;
      }

      // Custom Voice Studio Triggers & Expressions (Meow & Hiss only)
      if (e.code === 'KeyH') {
        window.dispatchEvent(new CustomEvent('request-hiss-action'));
      } else if (e.code === 'KeyE') {
        triggerMeowAction();
      } else if (e.code === 'KeyR') {
        soundEngine.playCustomOrSyntheticHiss();
        tempExprType.current = 'angry_hiss';
        tempExprTimer.current = 1.8;
        multiplayerClient.sendCatAction('hiss');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      keysPressed.current[e.key] = false;
      if (!e.shiftKey) {
        keysPressed.current['Shift'] = false;
        keysPressed.current['ShiftLeft'] = false;
        keysPressed.current['ShiftRight'] = false;
      }
    };

    // Custom window event listener for UI Meow button & Microphone Speech Meow
    const handleCustomMeow = () => {
      triggerMeowAction();
    };
    window.addEventListener('cat-trigger-meow', handleCustomMeow);
    window.addEventListener('speech-meow-detected', handleCustomMeow);

    // Custom window event listener for Fierce Claw Hiss & Stun
    const handleTriggerHissStun = () => {
      if (humanAIMgrRef.current) {
        humanAIMgrRef.current.applyHissClawBrag(playerPos.current, (dialogue) => {
          onHumanDialogueUpdate?.(dialogue);
        });
      }
      tempExprType.current = 'angry_hiss';
      tempExprTimer.current = 2.5;
    };
    window.addEventListener('trigger-hiss-stun', handleTriggerHissStun);

    // Disable context menu on right clicks
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);

    const handleWheel = (e: WheelEvent) => {
      cameraAngle.current.distance = THREE.MathUtils.clamp(
        cameraAngle.current.distance + e.deltaY * 0.005,
        2.5,
        8.5
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    // Handle Container & Window Resizing smoothly
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = getWidth();
      const h = getHeight();
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 6. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const rawDelta = (time - lastTime) * 0.001;
      const delta = Math.min(Math.max(Number.isFinite(rawDelta) ? rawDelta : 0.016, 0.001), 0.1);
      lastTime = time;

      // Animate active Meow Sonic Wave Rings
      if (meowRings.current.length > 0) {
        const curMs = performance.now();
        for (let i = meowRings.current.length - 1; i >= 0; i--) {
          const ring = meowRings.current[i];
          const elapsed = (curMs - ring.startTime) / 1000;
          const duration = 1.6;
          const progress = Math.min(1.0, elapsed / duration);

          // Expand radius
          const scale = 1.0 + progress * 24.0;
          ring.mesh.scale.set(scale, scale, scale);

          // Fade opacity
          const mat = ring.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = (1.0 - progress) * 0.9;

          // Float heart notes upwards & spin
          ring.noteGroup.position.y += delta * 1.5;
          ring.noteGroup.rotation.y += delta * 2.5;

          if (progress >= 1.0) {
            scene.remove(ring.mesh);
            scene.remove(ring.noteGroup);
            ring.mesh.geometry.dispose();
            (ring.mesh.material as THREE.Material).dispose();
            meowRings.current.splice(i, 1);
          }
        }
      }

      if (!isPaused) {
        updatePhysicsAndMovement(delta, time * 0.001);
        world.updateWorld(delta, playerPos.current);
        updateFloatingSkills(delta);
        updateStealthAndAI(delta);
        updateCamera(delta);
        checkMissionInteractions();
        syncNetworkState(time);
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('cat-trigger-meow', handleCustomMeow);
      window.removeEventListener('speech-meow-detected', handleCustomMeow);
      window.removeEventListener('trigger-hiss-stun', handleTriggerHissStun);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      floatingSkillMeshesRef.current.forEach((meshData) => {
        scene.remove(meshData.group);
      });
      floatingSkillMeshesRef.current.clear();
      renderer.dispose();
    };
  }, [selectedCharacter, customization]);

  // Sync Insane Mode state directly to HumanAIManager
  useEffect(() => {
    if (humanAIMgrRef.current) {
      humanAIMgrRef.current.isInsaneModeActive = Boolean(isInsaneModeActive);
    }
  }, [isInsaneModeActive]);

  // --- Network State Synchronization (~30Hz) ---
  const syncNetworkState = (time: number) => {
    if (time - lastNetworkSyncTime.current > 33) {
      lastNetworkSyncTime.current = time;

      let action: any = 'idle';
      const speed = new THREE.Vector2(playerVel.current.x, playerVel.current.z).length();
      if (isClimbing.current) action = 'climb';
      else if (!isGrounded.current) action = 'jump';
      else if (speed > 4.5) action = 'run';
      else if (speed > 0.1) action = 'walk';
      else if (isInnocentPersona) action = 'loaf';

      multiplayerClient.sendPlayerState(
        { x: playerPos.current.x, y: playerPos.current.y, z: playerPos.current.z },
        playerRot.current,
        action,
        tempExprType.current || selectedCharacter.defaultExpression,
        isInnocentPersona,
        isClimbing.current,
        isDashing.current
      );

      // Pass connected players array to UI HUD
      if (onMultiplayerPlayersUpdate) {
        const allPlayers = Array.from(multiplayerClient.players.values());
        onMultiplayerPlayersUpdate(allPlayers);
      }
    }
  };

  // --- Cat Movement, Strict Camera-Relative Directions & Solid 3D Collision ---
  const updatePhysicsAndMovement = (delta: number, curTime: number) => {
    if (!playerCatModelRef.current || !worldBuilderRef.current) return;

    // Shift Key = High Speed Sprint Run!
    const wasDashing = isDashing.current;
    isDashing.current = Boolean(
      keysPressed.current['ShiftLeft'] ||
      keysPressed.current['ShiftRight'] ||
      keysPressed.current['Shift']
    );

    if (isDashing.current !== wasDashing) {
      if (isDashing.current) {
        soundEngine.playSprintBurst();
      }
      onSprintStateUpdate?.(isDashing.current);
    }

    // Feline movement speed: 50% reduced speed for both normal and shift sprint
    const baseMoveSpeed = 4.025; // 50% reduced from 8.05
    const catSpeedStat = selectedCharacter?.stats?.speed ?? 80;
    const speedRatio = Math.max(0.7, Math.min(1.4, catSpeedStat / 80));
    let speed = baseMoveSpeed * speedRatio;
    if (isDashing.current) speed *= 2.2; // 8.855 m/s sprint run (50% reduced from 17.71)
    if (isInnocentPersona) speed *= 0.35; // Slow deliberate loaf strut

    // "Lightning" Floating Skill: +30% Speed Boost!
    if (activeSkillsRef.current?.lightningSecondsLeft && activeSkillsRef.current.lightningSecondsLeft > 0) {
      speed *= 1.30;
    }

    // Trap Dancing State (Shades or Bling Bling trap: forced to dance for 5s!)
    const isTrappedInDance = Boolean(
      activeSkillsRef.current?.trapDanceSecondsLeft && activeSkillsRef.current.trapDanceSecondsLeft > 0
    );

    // Check for Climbable Towers, Spiral Steps & Bookcases
    let nearClimbable = false;
    let insideTowerZone = false;
    let targetTowerZone: any = null;

    // 1. Check Cat Tower Zones (Climbing towers with spiral stepping pads)
    if (worldBuilderRef.current.catTowerZones) {
      for (const zone of worldBuilderRef.current.catTowerZones) {
        const d = Math.hypot(playerPos.current.x - zone.center.x, playerPos.current.z - zone.center.z);
        if (d <= zone.radius) {
          nearClimbable = true;
          insideTowerZone = true;
          targetTowerZone = zone;
          break;
        }
      }
    }

    // 2. Check Climbable Colliders (Walls, poles, bookcases) with generous 1.4m query
    if (!nearClimbable) {
      const catBox = new THREE.Box3(
        new THREE.Vector3(playerPos.current.x - 1.4, playerPos.current.y - 0.2, playerPos.current.z - 1.4),
        new THREE.Vector3(playerPos.current.x + 1.4, playerPos.current.y + 1.6, playerPos.current.z + 1.4)
      );

      for (const cBox of worldBuilderRef.current.climbableWalls) {
        if (catBox.intersectsBox(cBox)) {
          nearClimbable = true;
          break;
        }
      }
    }

    // Keyboard Inputs:
    // W / S: Move Forward / Backward
    // A / D: Strafe Left / Right
    // ArrowUp: Look Up
    // ArrowDown: Look Down
    // ArrowLeft / ArrowRight: Turn / Look Left & Right with -40% sensitivity (smooth 0.60x rate)
    
    // Look Up & Down (Pitch) via ArrowUp / ArrowDown
    const pitchSpeed = 1.1; // Smooth pitch speed
    if (keysPressed.current['ArrowUp']) {
      cameraAngle.current.phi = THREE.MathUtils.clamp(
        (cameraAngle.current.phi ?? 0.36) - pitchSpeed * delta,
        -0.45,
        1.15
      );
    }
    if (keysPressed.current['ArrowDown']) {
      cameraAngle.current.phi = THREE.MathUtils.clamp(
        (cameraAngle.current.phi ?? 0.36) + pitchSpeed * delta,
        -0.45,
        1.15
      );
    }

    // Turn / Look Left & Right via ArrowLeft / ArrowRight (-40% sensitivity = 0.60x rate)
    const turnRate = 1.65 * 0.60; // 40% reduced sensitivity for smooth, precise camera steering
    if (keysPressed.current['ArrowLeft']) {
      cameraAngle.current.theta += turnRate * delta;
      playerRot.current = cameraAngle.current.theta - Math.PI;
    }
    if (keysPressed.current['ArrowRight']) {
      cameraAngle.current.theta -= turnRate * delta;
      playerRot.current = cameraAngle.current.theta - Math.PI;
    }

    // WASD Movement (Strictly Camera/Screen-Relative)
    let inputX = 0;
    let inputZ = 0;
    if (!isTrappedInDance) {
      if (keysPressed.current['KeyW']) inputZ += 1;
      if (keysPressed.current['KeyS']) inputZ -= 1;
      if (keysPressed.current['KeyA']) inputX -= 1;
      if (keysPressed.current['KeyD']) inputX += 1;
    } else {
      // Uncontrollable disco groove dance spin when trapped by Shades or Bling Bling!
      playerRot.current += delta * 6.5;
    }

    // Jump Logic: Space key down
    const spacePressedNow = Boolean(keysPressed.current['Space']);
    const spaceFreshPress = spacePressedNow && !wasSpacePressed.current;
    wasSpacePressed.current = spacePressedNow;

    if (spaceFreshPress && !isInnocentPersona && !isTrappedInDance) {
      if (isGrounded.current) {
        let jumpPower = 9.8;
        // "Spring" Floating Skill: Jump 30% higher!
        if (activeSkillsRef.current?.springSecondsLeft && activeSkillsRef.current.springSecondsLeft > 0) {
          jumpPower *= 1.30;
        }
        playerVel.current.y = jumpPower;
        isGrounded.current = false;
        hasUsedDoubleJump.current = false;
        soundEngine.playJump();
      } else if (!isGrounded.current && activeSkillsRef.current?.frogSecondsLeft && activeSkillsRef.current.frogSecondsLeft > 0 && !hasUsedDoubleJump.current) {
        // "Frog" Floating Skill: Double Jump twice up in the air!
        playerVel.current.y = 10.5;
        hasUsedDoubleJump.current = true;
        soundEngine.playDoubleJumpRibbit();
      }
    }

    // "Claws" Skill: Able to climb ANY wall or stick to the wall up and up by jumping/running into it!
    const hasClaws = Boolean(activeSkillsRef.current?.clawsSecondsLeft && activeSkillsRef.current.clawsSecondsLeft > 0);
    const canClimb = nearClimbable || (hasClaws && isTouchingWall.current);

    if (canClimb && !isTrappedInDance && (keysPressed.current['KeyW'] || keysPressed.current['Space'])) {
      isClimbing.current = true;
      playerVel.current.y = hasClaws ? 7.8 : 8.6; // High agile feline climbing burst up and up!

      // Magnetic gentle orbit assistance towards spiral tower tiers
      if (insideTowerZone && targetTowerZone) {
        const dx = targetTowerZone.center.x - playerPos.current.x;
        const dz = targetTowerZone.center.z - playerPos.current.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 1.3) {
          playerPos.current.x += (dx / dist) * 3.5 * delta;
          playerPos.current.z += (dz / dist) * 3.5 * delta;
        } else if (dist < 0.6) {
          playerPos.current.x -= (dx / dist) * 2.0 * delta;
          playerPos.current.z -= (dz / dist) * 2.0 * delta;
        }
      }
    } else if (hasClaws && isTouchingWall.current && keysPressed.current['KeyW']) {
      // Stick to wall without falling down
      isClimbing.current = true;
      if (playerVel.current.y < 0) playerVel.current.y = 0;
    } else {
      isClimbing.current = false;
    }

    // Apply Screen-Relative Movement Direction
    // In our camera spherical coordinate system:
    // Forward (away from camera / up into screen) = (-sin(theta), 0, -cos(theta))
    // Right (to the right on screen) = (cos(theta), 0, -sin(theta))
    const theta = cameraAngle.current.theta;
    const fwd = new THREE.Vector3(-Math.sin(theta), 0, -Math.cos(theta));
    const right = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));

    if (inputX !== 0 || inputZ !== 0) {
      const moveDir = new THREE.Vector3()
        .addScaledVector(fwd, inputZ)
        .addScaledVector(right, inputX);

      if (moveDir.lengthSq() > 0.0001) {
        moveDir.normalize();
        playerVel.current.x = moveDir.x * speed;
        playerVel.current.z = moveDir.z * speed;

        // Smoothly rotate the feline model to face movement direction
        const targetRot = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetRot - playerRot.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerRot.current += diff * Math.min(1.0, 20.0 * delta);
      }
    } else {
      playerVel.current.x *= 0.75;
      playerVel.current.z *= 0.75;
    }

    // Apply Gravity
    if (!isClimbing.current && !isGrounded.current) {
      playerVel.current.y -= 24.0 * delta;
    }

    // === SOLID 3D COLLISION DETECTION WITH SMOOTH SLIDING ===
    const catRadius = 0.42;
    const catHeight = 0.72;
    const curPos = playerPos.current.clone();

    // 1. Horizontal X movement & wall sliding
    let dx = playerVel.current.x * delta;
    let targetX = curPos.x + dx;

    for (const box of worldBuilderRef.current.colliders) {
      if (box.max.y <= 0.1) continue; // skip ground floor

      // If cat is already above box top or stepping up a step (up to 0.48m step height), don't block
      if (curPos.y >= box.max.y - 0.48) continue;
      // If box is above cat's head (high ceiling), don't block
      if (box.min.y >= curPos.y + catHeight) continue;

      if (curPos.z + catRadius * 0.85 > box.min.z && curPos.z - catRadius * 0.85 < box.max.z) {
        if (dx > 0) {
          if (curPos.x + catRadius <= box.min.x && targetX + catRadius > box.min.x) {
            targetX = box.min.x - catRadius;
            playerVel.current.x = 0;
          } else if (targetX + catRadius > box.min.x && targetX - catRadius < box.max.x && curPos.x < box.min.x) {
            targetX = box.min.x - catRadius;
            playerVel.current.x = 0;
          }
        } else if (dx < 0) {
          if (curPos.x - catRadius >= box.max.x && targetX - catRadius < box.max.x) {
            targetX = box.max.x + catRadius;
            playerVel.current.x = 0;
          } else if (targetX - catRadius < box.max.x && targetX + catRadius > box.min.x && curPos.x > box.max.x) {
            targetX = box.max.x + catRadius;
            playerVel.current.x = 0;
          }
        }
      }
    }

    // 2. Horizontal Z movement & wall sliding
    let dz = playerVel.current.z * delta;
    let targetZ = curPos.z + dz;

    for (const box of worldBuilderRef.current.colliders) {
      if (box.max.y <= 0.1) continue;

      if (curPos.y >= box.max.y - 0.48) continue;
      if (box.min.y >= curPos.y + catHeight) continue;

      if (targetX + catRadius * 0.85 > box.min.x && targetX - catRadius * 0.85 < box.max.x) {
        if (dz > 0) {
          if (curPos.z + catRadius <= box.min.z && targetZ + catRadius > box.min.z) {
            targetZ = box.min.z - catRadius;
            playerVel.current.z = 0;
          } else if (targetZ + catRadius > box.min.z && targetZ - catRadius < box.max.z && curPos.z < box.min.z) {
            targetZ = box.min.z - catRadius;
            playerVel.current.z = 0;
          }
        } else if (dz < 0) {
          if (curPos.z - catRadius >= box.max.z && targetZ - catRadius < box.max.z) {
            targetZ = box.max.z + catRadius;
            playerVel.current.z = 0;
          } else if (targetZ - catRadius < box.max.z && targetZ + catRadius > box.min.z && curPos.z > box.max.z) {
            targetZ = box.max.z + catRadius;
            playerVel.current.z = 0;
          }
        }
      }
    }

    // Check if cat is touching/pushing against a solid wall
    isTouchingWall.current = (targetX !== curPos.x + dx) || (targetZ !== curPos.z + dz);

    // 3. Vertical Y movement, Surface Landing & Ceilings
    let targetY = curPos.y + playerVel.current.y * delta;
    let highestGround = 0.38; // Default oak floor height
    let isGroundedNow = false;

    for (const box of worldBuilderRef.current.colliders) {
      const overlapsX = targetX + catRadius * 0.65 > box.min.x && targetX - catRadius * 0.65 < box.max.x;
      const overlapsZ = targetZ + catRadius * 0.65 > box.min.z && targetZ - catRadius * 0.65 < box.max.z;

      if (overlapsX && overlapsZ) {
        const topSurfaceY = box.max.y + 0.38;

        if (curPos.y >= box.max.y - 0.55 || isClimbing.current) {
          if (topSurfaceY > highestGround) {
            highestGround = topSurfaceY;
          }
        }

        // Ceiling collision (skipped when climbing so cat can easily step up to perches)
        if (!isClimbing.current && playerVel.current.y > 0 && curPos.y + catHeight <= box.min.y + 0.2 && targetY + catHeight > box.min.y) {
          targetY = box.min.y - catHeight - 0.05;
          playerVel.current.y = 0;
        }
      }
    }

    if (targetY <= highestGround) {
      targetY = highestGround;
      playerVel.current.y = 0;
      isGroundedNow = true;
      hasUsedDoubleJump.current = false; // Reset double jump on landing
    } else {
      isGroundedNow = false;
    }

    if (isClimbing.current) {
      isGroundedNow = false;
    }

    // Mansion Perimeter Bounds Safety Clamp (320m x 320m world)
    targetX = THREE.MathUtils.clamp(targetX, -156, 156);
    targetZ = THREE.MathUtils.clamp(targetZ, -156, 156);
    targetY = THREE.MathUtils.clamp(targetY, 0.38, 16.0);

    // Guard against NaN
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY) || !Number.isFinite(targetZ)) {
      targetX = -14;
      targetY = 0.38;
      targetZ = 6;
      playerVel.current.set(0, 0, 0);
    }

    isGrounded.current = isGroundedNow;
    playerPos.current.set(targetX, targetY, targetZ);

    // Update Cat Mesh Transform
    playerCatModelRef.current.group.position.copy(playerPos.current);
    playerCatModelRef.current.group.rotation.y = playerRot.current;

    // Update Cat Expression
    let expr: CatExpression = selectedCharacter.defaultExpression;
    if (tempExprTimer.current > 0 && tempExprType.current) {
      expr = tempExprType.current;
      tempExprTimer.current -= delta;
    } else if (isInnocentPersona) {
      expr = 'sleepy_loaf';
    }
    playerCatModelRef.current.setExpression(expr);
    onExpressionUpdate(expr);

    // Update Model Animations
    const horizSpeed = new THREE.Vector2(playerVel.current.x, playerVel.current.z).length();
    let actionState: any = 'idle';
    if (isClimbing.current) actionState = 'climb';
    else if (!isGrounded.current) actionState = 'jump';
    else if (horizSpeed > 4.5) actionState = 'run';
    else if (horizSpeed > 0.1) actionState = 'walk';
    else if (isInnocentPersona) actionState = 'loaf';

    playerCatModelRef.current.updateAnimation(
      {
        action: actionState,
        speed: horizSpeed,
        time: curTime,
        isGrounded: isGrounded.current,
        isClimbing: isClimbing.current,
        isInnocent: isInnocentPersona,
        expression: expr,
      },
      delta
    );

    // Notify room name
    const roomName = getCurrentRoomName(playerPos.current.x, playerPos.current.z);
    onPlayerPositionUpdate({ ...playerPos.current }, roomName);
  };

  // --- Locked-In Directional Camera Chase Perspective (Zero Mouse Clicking Needed) ---
  const updateCamera = (delta: number) => {
    if (!cameraRef.current || !playerCatModelRef.current) return;
    const camera = cameraRef.current;
    const targetPos = playerPos.current.clone().add(new THREE.Vector3(0, 0.65, 0));

    if (!Number.isFinite(targetPos.x) || !Number.isFinite(targetPos.y) || !Number.isFinite(targetPos.z)) {
      targetPos.set(-14, 1.1, 6);
    }

    if (isFocusCamActive) {
      // Focus Close-Up Face Cam
      const forwardX = Math.sin(playerRot.current);
      const forwardZ = Math.cos(playerRot.current);
      const camPos = targetPos.clone().add(new THREE.Vector3(forwardX * 2.0, 0.2, forwardZ * 2.0));
      camera.position.lerp(camPos, 0.2);
      camera.lookAt(targetPos);
    } else {
      // Locked-in perspective: Camera automatically chases smoothly behind the cat's walking heading
      const targetTheta = playerRot.current + Math.PI;
      let diff = targetTheta - cameraAngle.current.theta;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const horizSpeed = new THREE.Vector2(playerVel.current.x, playerVel.current.z).length();
      const followRate = horizSpeed > 0.3 ? 7.0 : 4.0;
      cameraAngle.current.theta += diff * Math.min(1.0, followRate * delta);

      const dist = cameraAngle.current.distance || 4.8;
      const phi = cameraAngle.current.phi ?? 0.36;
      const theta = cameraAngle.current.theta;

      const camX = targetPos.x + dist * Math.cos(phi) * Math.sin(theta);
      const camY = targetPos.y + dist * Math.sin(phi) + 0.35;
      const camZ = targetPos.z + dist * Math.cos(phi) * Math.cos(theta);

      // Dynamically pitch camera gaze target when looking up or down
      const lookPitchOffset = -Math.sin(phi) * 1.25 + 0.1;
      const lookTarget = targetPos.clone().add(new THREE.Vector3(0, lookPitchOffset, 0));

      if (Number.isFinite(camX) && Number.isFinite(camY) && Number.isFinite(camZ)) {
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.25);
        camera.lookAt(lookTarget);
      }
    }

    // Dynamic FOV for high-speed Shift run
    const targetFov = isDashing.current ? 75 : 65;
    if (Math.abs(camera.fov - targetFov) > 0.2) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 7.0);
      camera.updateProjectionMatrix();
    }
  };

  // --- Mission & Prop Interaction Checks ---
  const checkMissionInteractions = () => {
    if (!worldBuilderRef.current || !multiplayerClient.sharedMission) return;
    const mission = multiplayerClient.sharedMission;
    if (mission.completed) return;

    const catPos = playerPos.current;

    // Check interaction range to mission target
    const distToTarget = new THREE.Vector2(
      catPos.x - mission.targetPosition.x,
      catPos.z - mission.targetPosition.z
    ).length();

    if (distToTarget < 3.2) {
      // Specific mission triggers
      if (mission.id === 'stairway_laser_chase') {
        const laserDist = worldBuilderRef.current.laserLightMesh.position.distanceTo(catPos);
        if (laserDist < 2.2) {
          multiplayerClient.sendMissionProgress(mission.currentCount + 1);
          soundEngine.playComboStreak(mission.currentCount + 1);
        }
      } else if (mission.id === 'dining_table_heist') {
        if (catPos.y >= 2.1) {
          multiplayerClient.sendMissionProgress(mission.currentCount + 1);
          soundEngine.playCredEarned();
        }
      } else if (mission.id === 'glass_gravity_knocker') {
        worldBuilderRef.current.kitchenGlasses.forEach((glass) => {
          if (glass.position.distanceTo(catPos) < 1.8 && glass.rotation.z === 0) {
            glass.rotation.z = Math.PI / 2; // Knock over!
            multiplayerClient.sendMissionProgress(mission.currentCount + 1);
            soundEngine.playComboStreak(mission.currentCount + 1);
          }
        });
      } else if (mission.id === 'bathroom_mummy_roll') {
        if (worldBuilderRef.current.toiletPaperRollMesh.position.distanceTo(catPos) < 2.5) {
          multiplayerClient.sendMissionProgress(mission.currentCount + 1);
          soundEngine.playComboStreak(mission.currentCount + 1);
        }
      } else if (mission.id === 'warm_laptop_keyboard_nap') {
        if (isInnocentPersona && catPos.y >= 1.8) {
          multiplayerClient.sendMissionProgress(mission.currentCount + 1);
          soundEngine.playCredEarned();
        }
      } else if (mission.id === 'robo_vacuum_rodeo') {
        if (worldBuilderRef.current.roboVacuumPos.distanceTo(catPos) < 1.8) {
          multiplayerClient.sendMissionProgress(mission.currentCount + 1);
          soundEngine.playComboStreak(mission.currentCount + 1);
        }
      } else if (mission.id === 'curtain_climber_bat') {
        if (isClimbing.current && catPos.y >= 5.0) {
          multiplayerClient.sendMissionProgress(mission.currentCount + 1);
          soundEngine.playCredEarned();
        }
      }
    }
  };

  // --- Human Stealth & Kiss Monster Update ---
  const updateStealthAndAI = (delta: number) => {
    if (!humanAIMgrRef.current) return;

    const remoteCatsList = Array.from(multiplayerClient.players.values()).map((p) => ({
      position: p.position,
      isLoafing: p.isLoafing,
      isClimbing: p.isClimbing,
    }));

    humanAIMgrRef.current.update(
      delta,
      playerPos.current,
      isInnocentPersona,
      isClimbing.current,
      streetCred,
      (humanName) => {
        // Regular human busted
        soundEngine.playBustedSiren();
        onGameOver(`BUSTED BY ${humanName}! You were caught red-pawed on surveillance!`);
      },
      (humanName) => {
        // Scary Kiss Monster caught player on ground!
        if (onTriggerSlowMoKiss) {
          onTriggerSlowMoKiss(humanName);
        } else {
          soundEngine.playKissSound();
          soundEngine.playGameOver();
          onGameOver(
            `💋 BUSTED BY ${humanName}! The scary Kiss Monster ran you down and covered you in 100 sloppy lipstick kisses! Remember: the only way to escape is to climb high onto the cat skyscraper towers, bookcases, or chandeliers!`
          );
        }
      },
      remoteCatsList
    );

    // Sync humans with radar map
    onHumansUpdate(
      humanAIMgrRef.current.humans.map((h) => ({
        name: h.data.name,
        position: { ...h.mesh.position },
        suspicion: h.data.suspicion,
        state: h.data.state,
      }))
    );
  };

  // Cached sprite textures for the floating skill types (prevents re-creating canvases)
  const skillIconTextureCache = useRef<Map<string, THREE.CanvasTexture>>(new Map());

  const getSkillIconTexture = (icon: string): THREE.CanvasTexture => {
    let tex = skillIconTextureCache.current.get(icon);
    if (!tex) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, 64, 64);
      }
      tex = new THREE.CanvasTexture(canvas);
      skillIconTextureCache.current.set(icon, tex);
    }
    return tex;
  };

  // --- Floating Skill 3D Mesh Generator ---
  const createFloatingSkillMesh = (skill: FloatingSkillPickup) => {
    const info = FLOATING_SKILLS_INFO[skill.type];
    const group = new THREE.Group();
    group.position.set(skill.position.x, skill.position.y, skill.position.z);

    // Glowing core octahedral crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.52, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: info.hexColor,
      emissive: info.hexColor,
      emissiveIntensity: 1.85, // Vibrant self-illumination without uniform limits
      roughness: 0.15,
      metalness: 0.25,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    group.add(crystal);

    // Glowing orbital celestial ring
    const ringGeo = new THREE.TorusGeometry(0.85, 0.045, 8, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color: info.hexColor,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // Soft glowing aura disk
    const auraGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const auraMat = new THREE.MeshBasicMaterial({
      color: info.hexColor,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    group.add(aura);

    // Emoji Billboard Icon Sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: getSkillIconTexture(info.icon),
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 0.95;
    sprite.scale.set(0.95, 0.95, 0.95);
    group.add(sprite);

    return { group, crystal, ring, aura, basePosY: skill.position.y };
  };

  // --- Update & Animate Floating Skills & Collision Detection ---
  const updateFloatingSkills = (delta: number) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const skills = floatingSkillsRef.current;

    // Clean up stale or respawned skill meshes to prevent memory and mesh accumulation
    const activeSkillIds = new Set(skills.map((s) => s.id));
    floatingSkillMeshesRef.current.forEach((meshData, id) => {
      if (!activeSkillIds.has(id)) {
        scene.remove(meshData.group);
        meshData.crystal.geometry.dispose();
        (meshData.crystal.material as THREE.Material).dispose();
        meshData.ring.geometry.dispose();
        (meshData.ring.material as THREE.Material).dispose();
        if (meshData.aura) {
          meshData.aura.geometry.dispose();
          (meshData.aura.material as THREE.Material).dispose();
        }
        floatingSkillMeshesRef.current.delete(id);
      }
    });

    skills.forEach((skill, idx) => {
      let meshData = floatingSkillMeshesRef.current.get(skill.id);
      if (!meshData) {
        meshData = createFloatingSkillMesh(skill);
        scene.add(meshData.group);
        floatingSkillMeshesRef.current.set(skill.id, meshData);
      }

      // Sync visibility
      meshData.group.visible = !skill.isCollected;

      if (!skill.isCollected) {
        // Animate floating bob and celestial spinning
        const curTime = Date.now() * 0.003 + idx * 0.5;
        meshData.group.position.y = meshData.basePosY + Math.sin(curTime) * 0.22;
        meshData.crystal.rotation.y += delta * 2.2;
        meshData.crystal.rotation.x += delta * 1.1;
        meshData.ring.rotation.z += delta * 2.8;
        if (meshData.aura) {
          meshData.aura.rotation.z += delta * 0.8;
        }

        // Collision detection with player cat
        const dx = playerPos.current.x - skill.position.x;
        const dz = playerPos.current.z - skill.position.z;
        const dy = Math.abs(playerPos.current.y - meshData.group.position.y);

        if (Math.hypot(dx, dz) < 1.9 && dy < 2.3) {
          onCollectSkill?.(skill.id);
        }
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden outline-none"
    />
  );
};
