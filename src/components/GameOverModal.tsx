import React from 'react';
import { CatCharacter } from '../types/game';
import { AlertOctagon, RotateCcw, Sparkles, Shirt, Compass } from 'lucide-react';

interface GameOverModalProps {
  reason: string;
  streetCred: number;
  character: CatCharacter;
  onRetry: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  streetCred,
  character,
  onRetry,
  onOpenShop,
}) => {
  const isKissDefeat = reason.includes('KISS') || reason.includes('Gertrude') || reason.includes('💋');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-lg font-['Plus_Jakarta_Sans'] select-none animate-fade-in">
      <div className="bg-neutral-900 border-2 border-red-500/80 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center flex flex-col items-center">
        {/* Warning / Kiss Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 mb-4 animate-bounce text-3xl">
          {isKissDefeat ? '💋' : <AlertOctagon className="w-8 h-8" />}
        </div>

        {/* Newspaper Style Headline */}
        <div className="text-xs uppercase font-extrabold tracking-widest text-red-400 mb-1">
          {isKissDefeat ? '💋 CAUGHT BY THE KISS MONSTER!' : 'MISSION FAILED • CAUGHT BY SURVEILLANCE'}
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-neutral-100 font-['Chakra_Petch'] mb-3">
          {isKissDefeat ? "YOU GOT KISSED!" : "BUSTED BY HUMANS!"}
        </h2>

        <div className="text-neutral-300 text-sm mb-4 bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl">
          {reason}
        </div>

        {/* Pro Tip on High Climbing Towers */}
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl text-[11px] text-emerald-200 font-semibold mb-6 flex items-center gap-2 text-left">
          <span className="text-xl">🧗</span>
          <div>
            <strong>Escape Tip:</strong> Humans run 1.5x faster but cannot climb! Next time, sprint straight for the high cat skyscraper towers or chandeliers (hold W/Space) to reach safety!
          </div>
        </div>

        {/* Retained Street Cred */}
        <div className="bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-2xl w-full mb-6 flex items-center justify-around">
          <div>
            <div className="text-xs text-neutral-400 font-semibold">Operative</div>
            <div className="font-bold text-neutral-200">{character.name}</div>
          </div>
          <div className="h-8 w-px bg-neutral-800" />
          <div>
            <div className="text-xs text-neutral-400 font-semibold">Street Cred Kept</div>
            <div className="font-extrabold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> {streetCred.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-2xl flex items-center justify-center gap-2 transition font-['Chakra_Petch'] shadow-lg shadow-amber-500/20"
          >
            <RotateCcw className="w-4 h-4" /> RESPAWN OPERATIVE
          </button>
          <button
            onClick={onOpenShop}
            className="py-3 px-5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl flex items-center justify-center gap-2 transition border border-neutral-700"
          >
            <Shirt className="w-4 h-4" /> Drip Wardrobe
          </button>
        </div>
      </div>
    </div>
  );
};
