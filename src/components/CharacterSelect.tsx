import React from 'react';
import { CatCharacter, CatId } from '../types/game';
import { CAT_CHARACTERS } from '../data/characters';
import { soundEngine } from '../utils/audio';
import { Zap, Shield, Sparkles, Swords, Volume2, Check } from 'lucide-react';

interface CharacterSelectProps {
  selectedCatId: CatId;
  onSelectCat: (id: CatId) => void;
  onClose: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedCatId,
  onSelectCat,
  onClose,
}) => {
  const currentCat = CAT_CHARACTERS.find((c) => c.id === selectedCatId) || CAT_CHARACTERS[0];

  const handleTestVoice = (id: CatId) => {
    soundEngine.playCatMeow(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-100 font-['Chakra_Petch']">
              FELINE SYNDICATE: CHARACTER SELECT
            </h2>
            <p className="text-neutral-400 text-sm mt-1">
              Choose your feline operative with unique urban swagger & tactical abilities.
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition font-['Chakra_Petch']"
          >
            CONFIRM OPERATIVE
          </button>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {CAT_CHARACTERS.map((cat) => {
            const isSelected = cat.id === selectedCatId;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCat(cat.id);
                  handleTestVoice(cat.id);
                }}
                className={`relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-neutral-800 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-102'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                {/* Active selection badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-neutral-950 p-1 rounded-full">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Avatar Preview */}
                <div
                  className="w-full h-32 rounded-xl flex items-center justify-center text-5xl mb-3 shadow-inner relative overflow-hidden border"
                  style={{
                    backgroundColor: cat.furColor,
                    borderColor: cat.accentColor,
                  }}
                >
                  <span className="animate-pulse">🐱</span>
                  <div className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                    {cat.pattern.toUpperCase()}
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-extrabold text-lg text-neutral-100 font-['Chakra_Petch']">{cat.name}</h3>
                <div className="text-xs font-semibold text-amber-400 mb-2">{cat.personality}</div>

                <p className="text-xs text-neutral-400 line-clamp-3 mb-3 flex-1">{cat.bio}</p>

                {/* Sound preview button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestVoice(cat.id);
                  }}
                  className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Meow Test
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Operative Deep Dive Stats */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Special Specialty
            </div>
            <div className="text-lg font-bold text-neutral-100 font-['Chakra_Petch'] mb-2">
              {currentCat.specialty}
            </div>
            <div className="text-sm italic text-neutral-400">{currentCat.quote}</div>
          </div>

          {/* Stats Bars */}
          <div className="w-full md:w-72 space-y-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Speed
                </span>
                <span>{currentCat.stats.speed}</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div className="h-full bg-cyan-400" style={{ width: `${currentCat.stats.speed}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> Stealth & Agility
                </span>
                <span>{currentCat.stats.stealth}</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div className="h-full bg-emerald-400" style={{ width: `${currentCat.stats.stealth}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-red-400" /> Brawl / Swagger
                </span>
                <span>{currentCat.stats.brawl}</span>
              </div>
              <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div className="h-full bg-red-400" style={{ width: `${currentCat.stats.brawl}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
