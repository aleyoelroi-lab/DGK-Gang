import React, { useState } from 'react';
import { AccessorySlot, PlayerCustomization, StreetwearItem } from '../types/game';
import { STREETWEAR_CATALOG } from '../data/characters';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Check, Lock, Shirt } from 'lucide-react';

interface StreetwearShopProps {
  customization: PlayerCustomization['equipped'];
  streetCred: number;
  onEquipItem: (slot: AccessorySlot, itemId?: string) => void;
  onUnlockItem: (itemId: string, cost: number) => void;
  unlockedItems: string[];
  onClose: () => void;
}

export const StreetwearShop: React.FC<StreetwearShopProps> = ({
  customization,
  streetCred,
  onEquipItem,
  onUnlockItem,
  unlockedItems,
  onClose,
}) => {
  const [activeSlot, setActiveSlot] = useState<AccessorySlot>('head');

  const slots: { slot: AccessorySlot; label: string; icon: string }[] = [
    { slot: 'head', label: 'Headwear', icon: '🧢' },
    { slot: 'eyes', label: 'Eyewear', icon: '🕶️' },
    { slot: 'neck', label: 'Neckwear', icon: '⛓️' },
    { slot: 'body', label: 'Jackets & Fits', icon: '🧥' },
    { slot: 'paws', label: 'Paw Kicks', icon: '👟' },
  ];

  const currentItems = STREETWEAR_CATALOG.filter((item) => item.slot === activeSlot);

  const handleBuyOrEquip = (item: StreetwearItem) => {
    const isUnlocked = unlockedItems.includes(item.id) || item.unlocked;

    if (isUnlocked) {
      // Toggle equip
      const isCurrentlyEquipped = customization[item.slot] === item.id;
      onEquipItem(item.slot, isCurrentlyEquipped ? undefined : item.id);
      soundEngine.playScoreJingle();
    } else {
      // Purchase
      if (streetCred >= item.cost) {
        onUnlockItem(item.id, item.cost);
        onEquipItem(item.slot, item.id);
        soundEngine.playScoreJingle();
        confetti({ particleCount: 30, spread: 60 });
      } else {
        soundEngine.playGameOver();
      }
    }
  };

  const getRarityBadge = (rarity: StreetwearItem['rarity']) => {
    const colors = {
      common: 'bg-neutral-700 text-neutral-300 border-neutral-600',
      rare: 'bg-blue-900/60 text-blue-300 border-blue-500/50',
      epic: 'bg-purple-900/60 text-purple-300 border-purple-500/50',
      legendary: 'bg-amber-900/60 text-amber-300 border-amber-500/50',
    };
    return (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${colors[rarity]}`}>
        {rarity}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Shirt className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-100 font-['Chakra_Petch']">
                STREETWEAR WARDROBE
              </h2>
            </div>
            <p className="text-neutral-400 text-sm mt-1">
              Unlock exclusive drip and customize your feline swagger for the streets.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{streetCred.toLocaleString()} Street Cred</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl transition text-sm"
            >
              DONE
            </button>
          </div>
        </div>

        {/* Slot Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-neutral-800/80">
          {slots.map((s) => (
            <button
              key={s.slot}
              onClick={() => setActiveSlot(s.slot)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition ${
                activeSlot === s.slot
                  ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-950/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {/* None / Unequip Option */}
          <div
            onClick={() => onEquipItem(activeSlot, undefined)}
            className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition ${
              !customization[activeSlot]
                ? 'bg-neutral-800 border-amber-400'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-xl text-neutral-500 mb-2 border border-neutral-800">
              🚫
            </div>
            <h4 className="font-bold text-sm text-neutral-200">Default (None)</h4>
            <span className="text-xs text-neutral-500 mt-1">Unequip item</span>
          </div>

          {currentItems.map((item) => {
            const isUnlocked = unlockedItems.includes(item.id) || item.unlocked;
            const isEquipped = customization[item.slot] === item.id;
            const canAfford = streetCred >= item.cost;

            return (
              <div
                key={item.id}
                onClick={() => handleBuyOrEquip(item)}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                  isEquipped
                    ? 'bg-neutral-800 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                {/* Status Badges */}
                <div className="flex justify-between items-center mb-2">
                  {getRarityBadge(item.rarity)}
                  {isEquipped && (
                    <span className="text-[10px] bg-amber-500 text-neutral-950 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" /> EQUIPPED
                    </span>
                  )}
                </div>

                {/* Preview Icon */}
                <div
                  className="w-full h-24 rounded-xl flex items-center justify-center text-4xl mb-3 shadow-inner border border-neutral-800/60"
                  style={{ backgroundColor: `${item.color}22` }}
                >
                  <span>{item.previewIcon}</span>
                </div>

                {/* Info */}
                <h4 className="font-extrabold text-sm text-neutral-100 font-['Chakra_Petch']">{item.name}</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5 mb-3 flex-1">{item.description}</p>

                {/* Action button */}
                <button
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isEquipped
                      ? 'bg-neutral-700 text-neutral-300'
                      : isUnlocked
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                      : canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {isEquipped ? (
                    'Unequip'
                  ) : isUnlocked ? (
                    'Equip Item'
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Unlock ({item.cost} Cred)
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
