import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../utils/audio';

interface GrossKissOverlayProps {
  humanName: string;
  onFinishKiss: () => void;
}

export const GrossKissOverlay: React.FC<GrossKissOverlayProps> = ({ humanName, onFinishKiss }) => {
  const [kissStage, setKissStage] = useState<'incoming' | 'impact' | 'smear'>('incoming');
  const [salivaDrops, setSalivaDrops] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const [lipstickPrints, setLipstickPrints] = useState<{ id: number; x: number; y: number; rot: number; scale: number }[]>([]);

  useEffect(() => {
    // Play squelchy wet kiss sound sequence
    soundEngine.playGrossWetKissSquelch();

    // Generate random saliva droplets flying toward camera
    const drops = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      x: 35 + Math.random() * 30,
      y: 35 + Math.random() * 30,
      size: 14 + Math.random() * 28,
      delay: Math.random() * 0.4,
    }));
    setSalivaDrops(drops);

    // Stage 1: Incoming face (0.0s - 0.7s)
    const t1 = setTimeout(() => {
      setKissStage('impact');
      soundEngine.playGrossWetKissSquelch();

      // Slap giant lipstick prints right onto camera lens
      setLipstickPrints([
        { id: 1, x: 50, y: 50, rot: -8, scale: 1.6 },
        { id: 2, x: 38, y: 44, rot: 15, scale: 1.1 },
        { id: 3, x: 62, y: 54, rot: -22, scale: 1.25 },
      ]);
    }, 700);

    // Stage 2: Smeared lens (1.6s)
    const t2 = setTimeout(() => {
      setKissStage('smear');
    }, 1600);

    // Stage 3: Complete transition to Game Over (3.4s)
    const t3 = setTimeout(() => {
      onFinishKiss();
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinishKiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-neutral-950/80 backdrop-blur-md select-none font-['Plus_Jakarta_Sans'] pointer-events-auto">
      {/* Slow-Motion Time-Dilation Vignette */}
      <div className="absolute inset-0 bg-radial from-pink-900/40 via-red-950/70 to-neutral-950/95 animate-pulse" />

      {/* Warning Slow-Mo Stamp */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-red-600/90 text-white font-black text-xs md:text-sm tracking-widest uppercase border border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.7)] flex items-center gap-2 animate-bounce">
        <span>⚠️ SLOW-MO DISASTER: WET KISS INCOMING! 💋</span>
      </div>

      {/* Grotesque Puckered Face Lunging toward Camera */}
      <motion.div
        initial={{ scale: 0.35, opacity: 0.6, rotate: -4 }}
        animate={{
          scale: kissStage === 'incoming' ? 1.35 : kissStage === 'impact' ? 2.4 : 2.6,
          opacity: 1,
          rotate: kissStage === 'impact' ? 4 : 0,
        }}
        transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="relative flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Face Outline & Disgusting Details */}
        <div className="relative w-80 h-96 md:w-96 md:h-[26rem] rounded-[50%_50%_45%_45%] bg-gradient-to-b from-[#bbf7d0] via-[#86efac] to-[#a7f3d0] border-4 border-green-800/40 shadow-2xl flex flex-col items-center justify-center overflow-visible">
          {/* Wild Frizzy Grayish Hair */}
          <div className="absolute -top-12 -left-8 -right-8 h-28 bg-neutral-400 rounded-full blur-[1px] opacity-90 border-4 border-neutral-600" />
          <div className="absolute -top-16 left-6 w-24 h-24 bg-neutral-300 rounded-full blur-[2px]" />
          <div className="absolute -top-16 right-6 w-24 h-24 bg-neutral-300 rounded-full blur-[2px]" />

          {/* Greasy Forehead Wrinkles */}
          <div className="absolute top-12 flex flex-col gap-1.5 w-44 opacity-60">
            <div className="h-1 bg-green-900/50 rounded-full" />
            <div className="h-1 bg-green-900/60 rounded-full w-36 mx-auto" />
            <div className="h-0.5 bg-green-900/40 rounded-full w-28 mx-auto" />
          </div>

          {/* Crazy Dilated Bloodshot Eyes */}
          <div className="absolute top-24 flex items-center justify-between w-56 px-4">
            {/* Left Eye */}
            <div className="relative w-16 h-16 rounded-full bg-red-100 border-4 border-red-600 flex items-center justify-center shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(239,68,68,0.4)_100%)]" />
              {/* Red bloodshot veins */}
              <div className="absolute w-full h-0.5 bg-red-500/70 rotate-45" />
              <div className="absolute w-full h-0.5 bg-red-500/70 -rotate-45" />
              {/* Giant dilated pupil */}
              <div className="w-8 h-8 rounded-full bg-neutral-950 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white -mt-2 -ml-2" />
              </div>
            </div>

            {/* Right Eye */}
            <div className="relative w-16 h-16 rounded-full bg-red-100 border-4 border-red-600 flex items-center justify-center shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(239,68,68,0.4)_100%)]" />
              <div className="absolute w-full h-0.5 bg-red-500/70 rotate-30" />
              <div className="absolute w-full h-0.5 bg-red-500/70 -rotate-30" />
              <div className="w-9 h-9 rounded-full bg-neutral-950 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white -mt-2 -ml-2" />
              </div>
            </div>
          </div>

          {/* Bulbous Wart Nose */}
          <div className="absolute top-40 w-14 h-16 bg-green-300 rounded-full border-2 border-green-700/50 shadow-md flex items-end justify-center pb-1">
            <div className="w-2 h-2 rounded-full bg-amber-800 -mr-4 -mt-4" title="Hairy Wart" />
            <div className="flex gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-900/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-900/60" />
            </div>
          </div>

          {/* Rosy Blush Circles */}
          <div className="absolute top-44 left-4 w-12 h-8 rounded-full bg-pink-500/40 blur-sm" />
          <div className="absolute top-44 right-4 w-12 h-8 rounded-full bg-pink-500/40 blur-sm" />

          {/* GIANT PUCKERED DIRTY LIPSTICK LIPS (LUNGING STRAIGHT AT SCREEN!) */}
          <motion.div
            animate={{
              scale: kissStage === 'incoming' ? [1, 1.3, 1.6] : [1.6, 2.2, 2.0],
            }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="absolute -bottom-6 flex flex-col items-center justify-center"
          >
            {/* Top Greasy Puckered Lip */}
            <div className="relative w-36 h-16 md:w-44 md:h-20 bg-gradient-to-t from-red-700 via-rose-600 to-red-500 rounded-[50%_50%_20%_20%] border-4 border-red-900 shadow-[0_10px_25px_rgba(225,29,72,0.8)] flex items-center justify-center">
              {/* Lip Wrinkles / Crinkles */}
              <div className="absolute inset-0 flex justify-evenly opacity-50">
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
              </div>
              {/* Glossy Lip Spit Glint */}
              <div className="w-16 h-3 bg-white/70 rounded-full blur-[1px] -mt-5" />
            </div>

            {/* Wet Center Suction Hole */}
            <div className="w-14 h-8 bg-red-950 rounded-full border-2 border-red-900 flex items-center justify-center -my-2 z-10 shadow-inner">
              <div className="w-6 h-3 bg-rose-900/80 rounded-full" />
            </div>

            {/* Bottom Giant Puckered Lip */}
            <div className="relative w-40 h-20 md:w-48 md:h-24 bg-gradient-to-b from-red-600 via-rose-600 to-red-800 rounded-[20%_20%_50%_50%] border-4 border-red-950 shadow-2xl flex items-center justify-center">
              <div className="absolute inset-0 flex justify-evenly opacity-50">
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
                <div className="w-0.5 h-full bg-red-950" />
              </div>
              {/* Dripping Saliva Droplet from bottom lip */}
              <div className="absolute -bottom-4 w-3.5 h-8 bg-sky-100/80 rounded-full border border-sky-300/60 shadow animate-bounce" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* FLYING SALIVA & SLOBBER DROPLETS TOWARD CAMERA */}
      {salivaDrops.map((drop) => (
        <motion.div
          key={drop.id}
          initial={{ scale: 0.1, opacity: 0, x: `${drop.x}%`, y: `${drop.y}%` }}
          animate={{
            scale: [0.1, 1.8, 3.5],
            opacity: [0, 0.9, 0.7],
            x: `${drop.x + (Math.random() * 20 - 10)}%`,
            y: `${drop.y + (Math.random() * 20 - 10)}%`,
          }}
          transition={{ duration: 0.8, delay: drop.delay, ease: 'easeOut' }}
          className="absolute rounded-full bg-gradient-to-tr from-cyan-100/90 to-white/90 border border-sky-300/80 shadow-[0_0_15px_rgba(56,189,248,0.6)] pointer-events-none"
          style={{ width: drop.size, height: drop.size * 1.3 }}
        />
      ))}

      {/* WET LIPSTICK SCREEN IMPACT SMEARS (STAMPED ON CAMERA GLASS!) */}
      {kissStage !== 'incoming' && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Smeared greasy glass fog effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-radial from-rose-500/25 via-red-950/40 to-transparent backdrop-blur-[2px]"
          />

          {lipstickPrints.map((print) => (
            <motion.div
              key={print.id}
              initial={{ scale: 0, opacity: 0, rotate: print.rot }}
              animate={{ scale: print.scale, opacity: 0.95, rotate: print.rot }}
              transition={{ type: 'spring', damping: 10, stiffness: 220 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-8xl md:text-9xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
              style={{ left: `${print.x}%`, top: `${print.y}%` }}
            >
              💋
            </motion.div>
          ))}

          {/* Wet drip trails running down the screen */}
          <div className="absolute top-[52%] left-[48%] w-2 h-32 bg-gradient-to-b from-rose-500/80 via-rose-400/40 to-transparent rounded-full blur-[1px]" />
          <div className="absolute top-[46%] left-[38%] w-1.5 h-24 bg-gradient-to-b from-sky-200/90 via-sky-100/40 to-transparent rounded-full" />
          <div className="absolute top-[56%] left-[63%] w-2 h-28 bg-gradient-to-b from-rose-600/80 via-rose-500/30 to-transparent rounded-full" />
        </div>
      )}

      {/* Visceral On-Screen Captions & Escape Action */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-30 max-w-xl w-full px-4 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-neutral-900/95 border-2 border-red-500/80 p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-full"
        >
          <div className="text-pink-400 font-extrabold text-sm md:text-base flex items-center justify-center gap-2">
            <span>💋 {humanName}</span>
            <span className="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded-full border border-red-400/50">
              SMOOCH ATTACK!
            </span>
          </div>
          <div className="text-white text-base md:text-lg font-black mt-1">
            "MWAHHH! GIMME A BIG WET SLOPPY KISS SWEET KITTY!!"
          </div>
          <div className="text-neutral-300 text-xs mt-1 font-semibold flex items-center justify-center gap-1">
            <span>🤢 Gross! Covered in sticky saliva and 10 layers of greasy lipstick!</span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={onFinishKiss}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs md:text-sm tracking-wide shadow-lg transition flex items-center gap-2 border border-red-400 cursor-pointer active:scale-95"
            >
              <span>🐾 WIPE SCREEN & RETRY</span>
              <span className="text-[10px] bg-red-900/70 px-1.5 py-0.5 rounded border border-red-400/40">
                [SPACE / ENTER]
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
