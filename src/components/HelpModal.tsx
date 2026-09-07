import React from 'react';
import { Shield, Sparkles, AlertTriangle, Keyboard, Compass, Camera, Heart, Zap, Box, Volume2 } from 'lucide-react';
import { COLORED_BOXES } from '../data/boxes';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-neutral-950/85 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              📜
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-100 font-['Chakra_Petch'] tracking-wide">
                CURRENT GAME RULES & SURVIVAL GUIDE
              </h2>
              <p className="text-neutral-400 text-xs mt-0.5">
                Master the 4-colored box rounds, floating skill pickups, kiss monster evasion, and feline defenses.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs transition font-['Chakra_Petch'] shadow-lg"
          >
            RETURN TO GAME [ESC / R]
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* Rule 1: 4 Colored Box Survival Round */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2 font-['Chakra_Petch']">
              <Box className="w-4 h-4" /> 1. THE 4-COLORED BOX SURVIVAL MISSION (2-MIN ROUNDS)
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Each round lasts <strong>120 seconds</strong> (2 minutes). Your feline operative is assigned a specific colored cardboard box target located in one of the mansion wings. Before the countdown reaches 0, you <strong>MUST</strong> reach and sit inside your assigned box!
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {COLORED_BOXES.map((box) => (
                <div
                  key={box.id}
                  className="bg-neutral-900 border p-2.5 rounded-xl flex flex-col gap-1"
                  style={{ borderColor: `${box.accentHex}66` }}
                >
                  <div className="flex items-center justify-between font-bold text-neutral-100">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: box.accentHex }} />
                      {box.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-semibold">📍 {box.roomName}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
              ⭐ <strong>Reward:</strong> Sitting safely in your target box when time expires grants <strong>+1,500 Street Cred</strong>, celebratory confetti, and advances to the next round! If caught outside, 12 Humans enter Insane Kiss Hunt Mode for 3 minutes!
            </div>
          </div>

          {/* Rule 2: Kiss Monster & 12 Human Patrols */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2 font-['Chakra_Petch']">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> 2. 12 PATROL HUMANS & THE KISS MONSTER
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-2">
              12 humans patrol the 320m mansion and outdoor hedge maze garden.
            </p>
            <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li><strong>Suspicion & Frenzy:</strong> Making noise, running nearby, or knocking items raises their suspicion meter. At 100%, they sprint to chase and kiss you!</li>
              <li><strong>Slow-Motion Kiss:</strong> If a human catches you (&lt;2.2m), a slow-mo dramatic kiss sequence triggers with lipstick marks.</li>
              <li><strong>Climbing High Safe Havens:</strong> Humans cannot reach cats perched higher than <strong>2.75 meters</strong>! Scale the Alpha Skyscraper, cat trees, bookshelves, or pillars to stay completely safe!</li>
            </ul>
          </div>

          {/* Rule 3: 20 Floating Skills & Traps */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2 font-['Chakra_Petch']">
              <Zap className="w-4 h-4" /> 3. 20 FLOATING SKILLS & HIDDEN TRAPS (3-MIN BUFFS)
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-2.5">
              20 glowing crystals spawn across the mansion and maze garden, respawning every <strong>2 minutes</strong> and on every round change:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="bg-neutral-900 border border-amber-500/30 p-2.5 rounded-xl">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <span>⚡</span> Lightning Speed
                </div>
                <div className="text-[11px] text-neutral-300 mt-1">+30% Movement & Sprint speed for 3 minutes!</div>
              </div>
              <div className="bg-neutral-900 border border-cyan-500/30 p-2.5 rounded-xl">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>🌀</span> Spring Leap
                </div>
                <div className="text-[11px] text-neutral-300 mt-1">+30% Jump height and vertical leap for 3 minutes!</div>
              </div>
              <div className="bg-neutral-900 border border-emerald-500/30 p-2.5 rounded-xl">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>🐸</span> Frog Ribbit
                </div>
                <div className="text-[11px] text-neutral-300 mt-1">Unlocks mid-air <strong>Double Jump</strong>! Press [SPACE] in air.</div>
              </div>
              <div className="bg-neutral-900 border border-orange-500/30 p-2.5 rounded-xl">
                <div className="font-bold text-orange-300 flex items-center gap-1.5">
                  <span>🐾</span> Wall Claws
                </div>
                <div className="text-[11px] text-neutral-300 mt-1">Stick to and scale walls smoothly for 3 minutes!</div>
              </div>
              <div className="bg-neutral-900 border border-pink-500/30 p-2.5 rounded-xl">
                <div className="font-bold text-pink-300 flex items-center gap-1.5">
                  <span>🕶️</span> Cool Shades Trap
                </div>
                <div className="text-[11px] text-pink-200 mt-1">Sneaky trap! Cat wears sunglasses and disco dances for 5s!</div>
              </div>
              <div className="bg-neutral-900 border border-yellow-500/30 p-2.5 rounded-xl">
                <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                  <span>💎</span> Bling Bling Trap
                </div>
                <div className="text-[11px] text-yellow-200 mt-1">Sneaky trap! Cat wears gold chains and disco dances for 5s!</div>
              </div>
            </div>
          </div>

          {/* Rule 4: Defenses: Meow Sonic Wave & Fierce Claw Hiss */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-pink-400 font-bold text-sm mb-2 font-['Chakra_Petch']">
              <Volume2 className="w-4 h-4" /> 4. FELINE DEFENSES: MEOW & FIERCE CLAW HISS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-900 border border-pink-500/30 p-3 rounded-xl">
                <div className="font-bold text-pink-300 flex items-center gap-1.5">
                  <span>🎤</span> Spoken or Keyed Meow [E]
                </div>
                <div className="text-[11px] text-neutral-300 mt-1">
                  Say "Meow" into your microphone or press <strong>[E]</strong> to release a pink sonic charm wave that slows humans by <strong>78%</strong>!
                </div>
              </div>
              <div className="bg-neutral-900 border border-rose-500/30 p-3 rounded-xl">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <span>😾</span> Fierce Claw Hiss [H]
                </div>
                <div className="text-[11px] text-neutral-300 mt-1">
                  Press <strong>[H]</strong> or click the Claw button to unleash an intimidating feline hiss that <strong>STUNS all nearby humans for 10 seconds</strong>! (5-min cooldown)
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Controls Cheat Sheet */}
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2 font-['Chakra_Petch']">
              <Keyboard className="w-4 h-4" /> 5. CONTROLS CHEAT SHEET
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Walk & Strafe</div>
                <div className="text-neutral-100 font-bold">W, A, S, D</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Sprint (2.2x)</div>
                <div className="text-amber-400 font-bold">Hold SHIFT</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Jump / Double Jump</div>
                <div className="text-emerald-400 font-bold">SPACE</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Meow (Distract)</div>
                <div className="text-pink-400 font-bold">E / Voice Mic</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Hiss (10s Stun)</div>
                <div className="text-rose-400 font-bold">H</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Cuteness Cam</div>
                <div className="text-teal-400 font-bold">C</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Photo Mode</div>
                <div className="text-purple-400 font-bold">P</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-400 font-semibold">Game Rules</div>
                <div className="text-amber-300 font-bold">R / Click Rules</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
