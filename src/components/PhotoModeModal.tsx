import React, { useState } from 'react';
import { Camera, Download, Sparkles, Sliders, Image as ImageIcon } from 'lucide-react';

interface PhotoModeModalProps {
  onClose: () => void;
}

export const PhotoModeModal: React.FC<PhotoModeModalProps> = ({ onClose }) => {
  const [filter, setFilter] = useState<'cyberpunk' | 'vhs' | 'noir' | 'sunset' | 'none'>('cyberpunk');
  const [sticker, setSticker] = useState<string>('🕶️');

  const filters = [
    { id: 'cyberpunk', name: 'Cyber Neon', style: 'hue-rotate-90 saturate-200 contrast-125' },
    { id: 'vhs', name: 'Retro VHS', style: 'sepia contrast-150 brightness-90' },
    { id: 'noir', name: 'Noir Detective', style: 'grayscale contrast-200 brightness-90' },
    { id: 'sunset', name: 'Warm Sunset', style: 'sepia-50 saturate-150 hue-rotate-[-20deg]' },
    { id: 'none', name: 'Natural', style: '' },
  ];

  const stickers = ['🕶️', '👑', '🐟', '🔥', '🥷', '💖', '⭐', '✨'];

  const handleCapture = () => {
    // Find canvas and create snapshot
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `feline-syndicate-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-pink-400" />
            <h2 className="text-xl font-extrabold text-neutral-100 font-['Chakra_Petch']">
              FELINE SYNDICATE: PHOTO STUDIO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-xs transition"
          >
            EXIT PHOTO MODE
          </button>
        </div>

        {/* Filter selection */}
        <div className="mb-4">
          <label className="text-xs uppercase font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Cinematic Visual Filters
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  filter === f.id
                    ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stickers */}
        <div className="mb-6">
          <label className="text-xs uppercase font-bold text-neutral-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Feline Stamp / Sticker
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stickers.map((s) => (
              <button
                key={s}
                onClick={() => setSticker(s)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition ${
                  sticker === s
                    ? 'bg-amber-500/20 border-amber-400 scale-110'
                    : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Capture Snapshot Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={handleCapture}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl transition font-['Chakra_Petch']"
          >
            <Download className="w-4 h-4" /> CAPTURE & DOWNLOAD 4K SNAPSHOT
          </button>
        </div>
      </div>
    </div>
  );
};
