import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audio';
import {
  Mic,
  Square,
  Play,
  Trash2,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface VoiceStudioModalProps {
  onClose: () => void;
  onVoiceUpdated?: () => void;
}

type VocalType = 'meow' | 'hiss';

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({ onClose, onVoiceUpdated }) => {
  const [activeTab, setActiveTab] = useState<VocalType>('meow');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // States for Meow & Hiss recordings
  const [hasMeow, setHasMeow] = useState<boolean>(false);
  const [hasHiss, setHasHiss] = useState<boolean>(false);
  const [meowMeta, setMeowMeta] = useState<any>(null);
  const [hissMeta, setHissMeta] = useState<any>(null);

  // Pitch / Playback rate modifiers
  const [meowPitch, setMeowPitch] = useState<number>(1.0);
  const [hissPitch, setHissPitch] = useState<number>(1.0);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Refresh saved statuses
  const reloadStatuses = () => {
    setHasMeow(soundEngine.hasCustomMeow());
    setHasHiss(soundEngine.hasCustomHiss());
    setMeowMeta(soundEngine.getCustomAudioMetadata('meow'));
    setHissMeta(soundEngine.getCustomAudioMetadata('hiss'));
  };

  useEffect(() => {
    reloadStatuses();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setMicVolumeLevel(0);
  };

  const startRecording = async (type: VocalType) => {
    setErrorMsg(null);
    setSuccessToast(null);
    stopRecordingCleanup();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Setup live visualizer analyser
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!audioAnalyserRef.current) return;
        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Create MediaRecorder
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          if (base64Data) {
            await soundEngine.saveCustomRecording(type, base64Data, {
              duration: recordingDuration,
              timestamp: Date.now(),
            });
            reloadStatuses();
            if (onVoiceUpdated) onVoiceUpdated();
            setSuccessToast(
              type === 'meow'
                ? '🐱 Real Meow permanently saved to game!'
                : '😾 Real Skkkkkkkk / Hiss permanently saved to game!'
            );
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter (max 5 seconds recording)
      const startTime = Date.now();
      recordingTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordingDuration(elapsed);
        if (elapsed >= 4.5) {
          stopRecording();
        }
      }, 100);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg(err.message || 'Microphone permission denied or not available.');
      stopRecordingCleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

  const handleDelete = (type: VocalType) => {
    soundEngine.clearCustomRecording(type);
    reloadStatuses();
    if (onVoiceUpdated) onVoiceUpdated();
    setSuccessToast(
      type === 'meow'
        ? 'Restored default procedural synth Meow.'
        : 'Restored default procedural synth Skkkkkkkk / Hiss.'
    );
  };

  const handlePreview = (type: VocalType) => {
    const pitch = type === 'meow' ? meowPitch : hissPitch;
    soundEngine.playCustomAudioDirect(type, pitch, 1.2);
  };

  const handleTestInGame = (type: VocalType) => {
    if (type === 'meow') {
      soundEngine.playMeowMeow();
    } else {
      soundEngine.playAngryHiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
              🎙️
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-['Chakra_Petch'] text-neutral-100 flex items-center gap-2">
                <span>Cat Voice Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                  Permanent Audio Memory
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Record your real cat voice (or your own voice!) for in-game Meows and Hisses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              if (!isRecording) setActiveTab('meow');
            }}
            className={`flex-1 py-3 px-4 rounded-t-2xl font-bold text-sm transition flex items-center justify-center gap-2 border-t border-x ${
              activeTab === 'meow'
                ? 'bg-neutral-900 border-neutral-700 text-pink-300 shadow-md'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <span>🐱</span>
            <span>Real Meow Meow</span>
            <span className="text-xs opacity-75 font-mono">[Key E]</span>
            {hasMeow && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" title="Custom Voice Saved" />
            )}
          </button>
          <button
            onClick={() => {
              if (!isRecording) setActiveTab('hiss');
            }}
            className={`flex-1 py-3 px-4 rounded-t-2xl font-bold text-sm transition flex items-center justify-center gap-2 border-t border-x ${
              activeTab === 'hiss'
                ? 'bg-neutral-900 border-neutral-700 text-red-300 shadow-md'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <span>😾</span>
            <span>Real Skkkkkkkk / Hiss</span>
            <span className="text-xs opacity-75 font-mono">[Key R]</span>
            {hasHiss && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" title="Custom Voice Saved" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Notification Banners */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-xs text-red-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Active Vocal Card */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-['Chakra_Petch'] text-neutral-100">
                    {activeTab === 'meow' ? '🐱 Cute Meow Vocalization' : '😾 Angry Skkkkkkkk / Hiss'}
                  </h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                      (activeTab === 'meow' && hasMeow) || (activeTab === 'hiss' && hasHiss)
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {(activeTab === 'meow' && hasMeow) || (activeTab === 'hiss' && hasHiss)
                      ? 'Custom Real Recording Active'
                      : 'Default Synth Engine'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {activeTab === 'meow'
                    ? 'Plays when pressing [E], interacting with humans, or loafing happily.'
                    : 'Plays when pressing [R], alarming intruders, or causing mischievous havoc.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestInGame(activeTab)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-neutral-700"
                  title="Test trigger vocal"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Voice [{activeTab === 'meow' ? 'E' : 'R'}]</span>
                </button>
              </div>
            </div>

            {/* Live Audio Visualizer / Level Meter */}
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[120px] overflow-hidden">
              {isRecording ? (
                <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
                  <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span>RECORDING: {recordingDuration.toFixed(1)}s / 4.5s</span>
                  </div>

                  {/* Equalizer Bars Simulation from Analyser */}
                  <div className="flex items-end justify-center gap-1.5 h-12 w-full max-w-xs">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const heightPercent = Math.max(
                        10,
                        Math.min(100, (micVolumeLevel * (1 + Math.sin(i + recordingDuration * 8))) / 1.5)
                      );
                      return (
                        <div
                          key={i}
                          className="w-2 rounded-t-sm transition-all duration-75"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: i % 2 === 0 ? '#ec4899' : '#f59e0b',
                          }}
                        />
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-neutral-400 text-center animate-pulse">
                    {activeTab === 'meow'
                      ? 'Say or meow clearly into your mic! (e.g. "Meoww!")'
                      : 'Hiss or spit clearly into your mic! (e.g. "Skkkkkkkkkk!")'}
                  </p>
                </div>
              ) : ((activeTab === 'meow' && hasMeow) || (activeTab === 'hiss' && hasHiss)) ? (
                <div className="flex flex-col items-center gap-2 w-full py-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved Audio Clip Ready & Stored in Game</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Saved clip duration: ~{activeTab === 'meow' ? meowMeta?.duration?.toFixed(1) || '1.2' : hissMeta?.duration?.toFixed(1) || '1.4'}s
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handlePreview(activeTab)}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-pink-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Preview Clip</span>
                    </button>
                    <button
                      onClick={() => handleDelete(activeTab)}
                      className="px-3 py-2 bg-neutral-800 hover:bg-red-500/20 hover:text-red-300 text-neutral-400 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-neutral-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset to Default Synth</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-neutral-400 py-3">
                  <Mic className="w-8 h-8 text-neutral-600 mb-1" />
                  <p className="text-xs font-medium text-neutral-300">
                    No custom {activeTab === 'meow' ? 'meow' : 'skkkkkkkk/hiss'} recorded yet.
                  </p>
                  <p className="text-[11px] text-neutral-500 max-w-sm">
                    Press Record below, speak or make your best cat sound into your microphone, and it will be saved permanently.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons: Record & Stop */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={() => startRecording(activeTab)}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-red-600/25 active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {(activeTab === 'meow' && hasMeow) || (activeTab === 'hiss' && hasHiss)
                      ? 'Re-Record New Clip'
                      : `Record Real ${activeTab === 'meow' ? 'Meow' : 'Skkkkkkkk'}`}
                  </span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 animate-pulse active:scale-95"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop & Save Recording</span>
                </button>
              )}
            </div>

            {/* Pitch & Style Preset Adjuster */}
            {((activeTab === 'meow' && hasMeow) || (activeTab === 'hiss' && hasHiss)) && (
              <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Voice Style & Pitch Presets</span>
                  </span>
                  <span className="text-amber-400 font-mono">
                    {(activeTab === 'meow' ? meowPitch : hissPitch).toFixed(2)}x Speed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (activeTab === 'meow') setMeowPitch(0.85);
                      else setHissPitch(0.85);
                      soundEngine.playCustomAudioDirect(activeTab, 0.85, 1.2);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-neutral-300 border border-neutral-700/60 transition text-center"
                  >
                    😼 Deep Big Cat
                  </button>
                  <button
                    onClick={() => {
                      if (activeTab === 'meow') setMeowPitch(1.0);
                      else setHissPitch(1.0);
                      soundEngine.playCustomAudioDirect(activeTab, 1.0, 1.2);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-amber-300 border border-amber-500/30 transition text-center"
                  >
                    ✨ Natural Real
                  </button>
                  <button
                    onClick={() => {
                      if (activeTab === 'meow') setMeowPitch(1.25);
                      else setHissPitch(1.25);
                      soundEngine.playCustomAudioDirect(activeTab, 1.25, 1.2);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-[11px] font-semibold text-pink-300 border border-pink-500/30 transition text-center"
                  >
                    🐱 Squeaky Kitten
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="bg-neutral-950/40 border border-neutral-800/80 rounded-2xl p-4 text-xs text-neutral-400 space-y-2">
            <div className="font-bold text-neutral-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>How In-Game Custom Cat Audio Works</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
              <li>
                <strong className="text-pink-300">Key [E] (Cute Meow):</strong> Whenever you press [E] during gameplay, your cat will immediately vocalize your recorded meow!
              </li>
              <li>
                <strong className="text-red-300">Key [R] (Skkkkkkkk Hiss):</strong> Pressing [R] plays your ferocious real hiss, triggers airplane ears, and increases mischievous credibility.
              </li>
              <li>
                <strong className="text-emerald-300">Persistent Storage:</strong> Your audio is permanently encoded into your browser's persistent storage. Even if you reload or reopen the game, your real sounds stay loaded.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for In-Game Play</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-xl text-xs font-bold transition border border-neutral-700"
          >
            Done / Return to Game
          </button>
        </div>
      </div>
    </div>
  );
};
