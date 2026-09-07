import { MultiplayerPlayer, WeirdMission, WebRTCSignalPacket } from '../types/game';
import { soundEngine } from './audio';

type MessageCallback = (data: any) => void;

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public myId: string | null = null;
  public mySlot: number = 1;
  public roomId: string = 'LOBBY_1';
  public players: Map<string, MultiplayerPlayer> = new Map();
  public sharedMission: WeirdMission | null = null;
  public isKissHuntActive: boolean = false;
  public kissHuntTimer: number = 0;
  
  // Voice Chat (WebRTC)
  public localAudioStream: MediaStream | null = null;
  public isMicActive: boolean = true;
  public isSpeaking: boolean = false;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private audioAnalyser: AnalyserNode | null = null;
  private audioCtx: AudioContext | null = null;

  // Listeners
  private listeners: Map<string, Set<MessageCallback>> = new Map();

  constructor() {
    // Attempt automatic mic initialization on first load
    this.initMicrophone();
  }

  public async initMicrophone(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        this.localAudioStream = stream;
        this.isMicActive = true;
        this.setupVoiceActivityDetection(stream);

        // Attach to existing peer connections
        this.peerConnections.forEach((pc) => {
          stream.getAudioTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        });

        this.emit('mic_status_changed', { isMicActive: true, isSpeaking: false });
        return true;
      }
    } catch (err) {
      console.warn('Microphone permission not granted or device unavailable:', err);
      this.isMicActive = false;
      this.emit('mic_status_changed', { isMicActive: false, isSpeaking: false });
    }
    return false;
  }

  private setupVoiceActivityDetection(stream: MediaStream) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioCtx.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.audioAnalyser || !this.isMicActive) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            this.emit('speaking_changed', false);
          }
          requestAnimationFrame(checkVolume);
          return;
        }

        this.audioAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speakingNow = average > 18;

        if (speakingNow !== this.isSpeaking) {
          this.isSpeaking = speakingNow;
          this.emit('speaking_changed', this.isSpeaking);
        }

        requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Voice activity detection setup error:', e);
    }
  }

  public toggleMicrophone(): boolean {
    if (!this.localAudioStream) {
      this.initMicrophone();
      return true;
    }
    this.isMicActive = !this.isMicActive;
    this.localAudioStream.getAudioTracks().forEach((t) => {
      t.enabled = this.isMicActive;
    });
    this.emit('mic_status_changed', { isMicActive: this.isMicActive, isSpeaking: this.isSpeaking });
    return this.isMicActive;
  }

  public connect(roomId: string = 'LOBBY_1') {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.roomId = roomId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}?room=${encodeURIComponent(roomId)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connected', { roomId: this.roomId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.warn('Failed to parse websocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected', {});
        // Auto-reconnect after 3s
        setTimeout(() => {
          if (!this.isConnected) {
            this.connect(this.roomId);
          }
        }, 3000);
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
      };
    } catch (e) {
      console.warn('WebSocket connection error:', e);
    }
  }

  private handleServerMessage(data: any) {
    switch (data.type) {
      case 'init_state':
        this.myId = data.myId;
        this.mySlot = data.mySlot;
        this.roomId = data.roomId;
        this.sharedMission = data.sharedMission;
        this.isKissHuntActive = data.isKissHuntActive;
        this.kissHuntTimer = data.kissHuntTimer;

        this.players.clear();
        (data.players || []).forEach((p: MultiplayerPlayer) => {
          if (p.id !== this.myId) {
            this.players.set(p.id, p);
            this.initPeerConnection(p.id, true); // Initiate WebRTC voice connection
          }
        });

        this.emit('init_state', data);
        break;

      case 'player_joined':
        if (data.player && data.player.id !== this.myId) {
          this.players.set(data.player.id, data.player);
          this.initPeerConnection(data.player.id, false);
          this.emit('player_joined', data.player);
        }
        break;

      case 'player_moved':
        if (data.id && data.id !== this.myId) {
          const p = this.players.get(data.id);
          if (p) {
            p.position = data.position;
            p.rotation = data.rotation;
            p.action = data.action;
            p.currentExpression = data.currentExpression;
            p.isLoafing = data.isLoafing;
            p.isClimbing = data.isClimbing;
            p.isDashing = data.isDashing;
            p.isMicActive = data.isMicActive;
            p.isSpeaking = data.isSpeaking;
            p.lastUpdate = Date.now();
            this.emit('player_moved', p);
          }
        }
        break;

      case 'player_profile_updated':
        if (data.id && data.id !== this.myId) {
          const p = this.players.get(data.id);
          if (p) {
            p.name = data.name;
            p.catId = data.catId;
            p.customization = data.customization;
            this.emit('player_profile_updated', p);
          }
        }
        break;

      case 'player_left':
        if (data.id) {
          this.players.delete(data.id);
          this.closePeerConnection(data.id);
          this.emit('player_left', data);
        }
        break;

      case 'mission_progress_update':
        if (this.sharedMission) {
          this.sharedMission.currentCount = data.currentCount;
          this.sharedMission.targetCount = data.targetCount;
        }
        this.emit('mission_progress_update', data);
        break;

      case 'mission_completed':
        if (this.sharedMission) {
          this.sharedMission.completed = true;
        }
        this.isKissHuntActive = false;
        this.emit('mission_completed', data);
        break;

      case 'new_mission_started':
        this.sharedMission = data.mission;
        this.isKissHuntActive = false;
        soundEngine.playNewTaskArrival();
        this.emit('new_mission_started', data.mission);
        break;

      case 'mission_time_warning_30s':
        soundEngine.playThirtySecondsWarning();
        this.emit('mission_time_warning_30s', data);
        break;

      case 'mission_time_sync':
        if (this.sharedMission) {
          this.sharedMission.secondsLeft = data.secondsLeft;
        }
        this.isKissHuntActive = data.isKissHuntActive;
        this.kissHuntTimer = data.kissHuntTimer;
        this.emit('mission_time_sync', data);
        break;

      case 'kiss_hunt_started':
        this.isKissHuntActive = true;
        this.kissHuntTimer = 60;
        this.emit('kiss_hunt_started', data);
        break;

      case 'cat_action_triggered':
        this.emit('cat_action_triggered', data);
        break;

      case 'webrtc_signal':
        this.handleWebRTCSignal(data);
        break;
    }
  }

  // --- WebRTC Mesh Signaling for Voice Chat ---
  private initPeerConnection(peerId: string, isInitiator: boolean) {
    if (this.peerConnections.has(peerId)) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      this.peerConnections.set(peerId, pc);

      if (this.localAudioStream) {
        this.localAudioStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, this.localAudioStream!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal(peerId, 'ice_candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          let audioEl = this.remoteAudioElements.get(peerId);
          if (!audioEl) {
            audioEl = new Audio();
            audioEl.autoplay = true;
            this.remoteAudioElements.set(peerId, audioEl);
          }
          audioEl.srcObject = event.streams[0];
          audioEl.play().catch(() => {});
        }
      };

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            this.sendSignal(peerId, 'offer', pc.localDescription);
          })
          .catch((err) => console.warn('WebRTC offer error:', err));
      }
    } catch (err) {
      console.warn('Failed to init RTCPeerConnection:', err);
    }
  }

  private async handleWebRTCSignal(data: { senderId: string; signalType: string; signal: any }) {
    const { senderId, signalType, signal } = data;
    let pc = this.peerConnections.get(senderId);

    if (!pc) {
      this.initPeerConnection(senderId, false);
      pc = this.peerConnections.get(senderId);
    }

    if (!pc) return;

    try {
      if (signalType === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignal(senderId, 'answer', pc.localDescription);
      } else if (signalType === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signalType === 'ice_candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(signal));
      }
    } catch (e) {
      console.warn('WebRTC signal handling error:', e);
    }
  }

  private sendSignal(targetId: string, signalType: string, signal: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'webrtc_signal',
          targetId,
          signalType,
          signal,
        })
      );
    }
  }

  private closePeerConnection(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      this.remoteAudioElements.delete(peerId);
    }
  }

  // --- Public Message Dispatchers ---
  public sendPlayerProfile(name: string, catId: string, customization?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'update_profile',
          name,
          catId,
          customization,
        })
      );
    }
  }

  public sendPlayerState(
    position: { x: number; y: number; z: number },
    rotation: number,
    action: string,
    currentExpression: string,
    isLoafing: boolean,
    isClimbing: boolean,
    isDashing: boolean
  ) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'player_state',
          position,
          rotation,
          action,
          currentExpression,
          isLoafing,
          isClimbing,
          isDashing,
          isMicActive: this.isMicActive,
          isSpeaking: this.isSpeaking,
        })
      );
    }
  }

  public sendMissionProgress(currentCount: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'mission_progress',
          currentCount,
        })
      );
    }
  }

  public sendCatAction(actionType: string, soundId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'cat_action',
          actionType,
          soundId,
        })
      );
    }
  }

  // Event System
  public on(event: string, callback: MessageCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: MessageCallback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => cb(data));
    }
  }
}

export const multiplayerClient = new MultiplayerClient();
