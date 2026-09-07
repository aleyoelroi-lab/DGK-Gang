import React, { useEffect, useState } from 'react';

interface ClawBragOverlayProps {
  isActive: boolean;
  stunSecondsLeft: number;
}

export const ClawBragOverlay: React.FC<ClawBragOverlayProps> = ({ isActive, stunSecondsLeft }) => {
  const [slashAnim, setSlashAnim] = useState<boolean>(false);

  useEffect(() => {
    if (isActive) {
      setSlashAnim(true);
      const t = setTimeout(() => setSlashAnim(false), 2400);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  if (!isActive && stunSecondsLeft <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden">
      {/* Fierce Claw Slash Visual FX */}
      {slashAnim && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Blood-orange / amber dramatic flash */}
          <div className="absolute inset-0 bg-amber-500/15 backdrop-blur-[1px] animate-pulse" />

          {/* 3 Giant Razor Claw Slash Marks */}
          <svg className="w-[85vw] max-w-4xl h-[60vh] drop-shadow-[0_0_35px_rgba(245,158,11,0.9)] animate-in zoom-in-50 duration-300">
            <defs>
              <linearGradient id="clawGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            {/* Slash 1 */}
            <path
              d="M 120 40 Q 380 260 780 480"
              stroke="url(#clawGlow)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              className="opacity-95"
            />
            {/* Slash 2 */}
            <path
              d="M 220 30 Q 480 250 880 470"
              stroke="url(#clawGlow)"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              className="opacity-100"
            />
            {/* Slash 3 */}
            <path
              d="M 320 20 Q 580 240 980 460"
              stroke="url(#clawGlow)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              className="opacity-95"
            />
          </svg>
        </div>
      )}

      {/* Floating Stun Status Banner */}
      {stunSecondsLeft > 0 && (
        <div className="absolute top-20 flex flex-col items-center gap-1 bg-amber-950/90 border-2 border-amber-400/90 text-amber-100 px-6 py-3 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.6)] backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-lg font-black font-['Chakra_Petch'] tracking-wider text-amber-300">
              FIERCE CLAW BRAG: ALL 12 HUMANS STUNNED!
            </span>
            <span className="text-2xl">😱</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-amber-200">
            <span>Humans are trembling in fear of razor claws!</span>
            <span className="bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full font-black text-sm">
              {Math.ceil(stunSecondsLeft)}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
