import React, { useEffect } from 'react';
import { Mic, MicOff, Play, Shield, Zap, Keyboard, Sparkles, Check } from 'lucide-react';

interface WelcomeControlsModalProps {
  onStartWithMic: () => void;
  onStartWithoutMic: () => void;
}

export const WelcomeControlsModal: React.FC<WelcomeControlsModalProps> = ({
  onStartWithMic,
  onStartWithoutMic,
}) => {
  // Listen for ENTER or SPACE to start quickly with mic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onStartWithMic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartWithMic]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-neutral-950/85 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 md:p-8 shadow-2xl flex flex-col justify-between animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
              🐱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-neutral-100 font-['Chakra_Petch'] tracking-wide">
                  BIG HOUSE FELINE ADVENTURE
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  READY TO PLAY
                </span>
              </div>
              <p className="text-neutral-400 text-xs mt-0.5">
                Survive 4-colored box missions, collect 20 floating skills, and outsmart 12 humans!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-5">
          {/* Microphone Live Voice & Speech-to-Meow Permission Prompt */}
          <div className="bg-gradient-to-r from-neutral-950 via-indigo-950/40 to-neutral-950 border border-indigo-500/40 p-4 rounded-2xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm font-['Chakra_Petch']">
                <Mic className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>MICROPHONE PERMISSION (LIVE VOICE & SPEECH MEOW)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 font-semibold">
                Recommended
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Enable your microphone to automatically talk with other cats in real-time <strong>4-player voice chat</strong> and say <strong className="text-pink-400">"MEOW"</strong> out loud into your mic to charm and slow nearby humans by <strong>78%</strong>!
            </p>
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="text-emerald-400">✓</span> You can mute or toggle your microphone at any time using the HUD button or [M].
            </div>
          </div>

          {/* 5. Quick Controls Reference */}
          <div className="bg-neutral-950/90 border border-neutral-800 p-4 md:p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm md:text-base font-['Chakra_Petch']">
                <Keyboard className="w-4 h-4" />
                <span>5. Quick Controls Reference</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">Press [R] anytime for Rules</span>
            </div>

            {/* Controls Table */}
            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/90 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-800/80 text-neutral-300 border-b border-neutral-700/60 font-semibold font-['Chakra_Petch'] uppercase text-[11px] tracking-wider">
                    <th className="py-2.5 px-3 md:px-4">Action</th>
                    <th className="py-2.5 px-3 md:px-4">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/70 text-neutral-200">
                  <tr className="hover:bg-neutral-800/40 transition">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Walk & Strafe</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-amber-300">W, A, S, D</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition bg-neutral-900/40">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Sprint (2.2x)</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-amber-400">Hold [SHIFT]</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Jump / Double Jump</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-emerald-400">[SPACE] (Press twice with Frog buff)</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition bg-neutral-900/40">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Meow (Slows Humans)</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-pink-400">[E] or speak "Meow" into mic</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Fierce Hiss (10s Stun)</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-rose-400">[H]</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition bg-neutral-900/40">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Cuteness Camera</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-teal-300">[C]</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Photo Mode</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-purple-400">[P]</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition bg-neutral-900/40">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">Cat Voice Studio</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-pink-300">[M]</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/40 transition">
                    <td className="py-2 px-3 md:px-4 font-semibold text-neutral-200">In-Game Rules Guide</td>
                    <td className="py-2 px-3 md:px-4 font-mono font-bold text-amber-300">[R] or click "RULES [R]" in top-right HUD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-neutral-800">
          <button
            onClick={onStartWithoutMic}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs transition font-['Chakra_Petch'] flex items-center justify-center gap-2 border border-neutral-700"
          >
            <MicOff className="w-4 h-4 text-neutral-400" />
            <span>PLAY WITHOUT MIC</span>
          </button>
          <button
            onClick={onStartWithMic}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs md:text-sm transition font-['Chakra_Petch'] shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4 text-neutral-950" />
            <span>ENABLE MIC & START GAME [ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
