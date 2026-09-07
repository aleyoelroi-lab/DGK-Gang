import React, { useState, useEffect } from 'react';
import { CatCharacter, CatId, MultiplayerPlayer } from '../types/game';
import { CAT_CHARACTERS } from '../data/characters';
import { Users, Copy, Check, Wifi, Globe, Shield, Play, Mic, MicOff, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { multiplayerClient } from '../utils/multiplayer';

interface MultiplayerLobbyProps {
  roomCode: string;
  onUpdateRoomCode: (code: string) => void;
  selectedCatId: CatId;
  onClose: () => void;
  onStartGame: () => void;
  multiplayerPlayers?: MultiplayerPlayer[];
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  roomCode,
  onUpdateRoomCode,
  selectedCatId,
  onClose,
  onStartGame,
  multiplayerPlayers = [],
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleMic = () => {
    const active = multiplayerClient.toggleMicrophone();
    setIsMicMuted(!active);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      const formatted = inputCode.trim().toUpperCase();
      onUpdateRoomCode(formatted);
      multiplayerClient.connect(formatted);
      confetti({ particleCount: 30, spread: 60 });
    }
  };

  const allPlayers = [
    {
      id: 'local_host',
      name: 'You (Player 1)',
      catId: selectedCatId,
      isSpeaking: !isMicMuted,
      ping: '10ms',
    },
    ...multiplayerPlayers.map((p, idx) => ({
      id: p.id,
      name: p.name || `Player ${idx + 2}`,
      catId: p.catId,
      isSpeaking: p.isSpeaking,
      ping: `${p.ping || 24}ms`,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 text-pink-400 rounded-2xl border border-pink-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-neutral-100 font-['Chakra_Petch']">
                  DON'T GET KISS: MULTIPLAYER SQUAD
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  MAX 4 PLAYERS
                </span>
              </div>
              <p className="text-neutral-400 text-xs mt-0.5">
                All players receive the same quest simultaneously. 1 player finishing saves everyone from the scary Kiss Monster!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-sm transition"
          >
            CLOSE
          </button>
        </div>

        {/* Share Link Banner */}
        <div className="bg-neutral-950/90 border border-neutral-800 p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-[11px] uppercase font-bold text-neutral-400">Share Link Online (Instant Join)</div>
              <div className="text-base font-bold font-['Chakra_Petch'] text-amber-400 tracking-wider">
                Room: {roomCode}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
            >
              {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Link Copied!' : 'Copy Game Link'}
            </button>

            <form onSubmit={handleJoin} className="flex gap-1.5">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Custom Room"
                className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-100 font-mono w-28 uppercase focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition border border-neutral-700"
              >
                Switch
              </button>
            </form>
          </div>
        </div>

        {/* Real-time Voice Chat Feature Notice */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300">Live Voice Chat (Mic Automatically ON)</div>
              <div className="text-[11px] text-neutral-300">
                You can talk to other players in real-time to coordinate quest targets and call out the Kiss Monster.
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleMic}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              !isMicMuted
                ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200'
                : 'bg-red-950 border-red-500 text-red-300'
            }`}
          >
            {!isMicMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>{!isMicMuted ? 'Mic Active' : 'Unmute Mic'}</span>
          </button>
        </div>

        {/* Players In Lobby (Slots 1 to 4) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Connected Cats ({allPlayers.length}/4)
            </h3>
            <span className="text-[11px] text-neutral-400">Map: 3X Mansion with 5 Climbing Towers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((slotIdx) => {
              const player = allPlayers[slotIdx];
              if (player) {
                const char = CAT_CHARACTERS.find((c) => c.id === player.catId) || CAT_CHARACTERS[0];
                return (
                  <div
                    key={slotIdx}
                    className="flex items-center justify-between p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border shadow"
                        style={{ backgroundColor: char.furColor, borderColor: char.accentColor }}
                      >
                        🐱
                      </div>
                      <div>
                        <div className="font-bold text-neutral-100 text-sm flex items-center gap-1.5">
                          <span>{player.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-400 font-bold border border-neutral-700">
                            {char.name.split(' ')[0]}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {player.ping}
                          </span>
                          <span>•</span>
                          <span className="text-neutral-400">{char.personality}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-emerald-400">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slotIdx}
                  className="flex items-center justify-between p-3.5 bg-neutral-950/30 border border-dashed border-neutral-800/80 rounded-2xl text-neutral-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-center text-lg">
                      🐾
                    </div>
                    <div>
                      <div className="font-bold text-neutral-400 text-sm">Slot #{slotIdx + 1}: Waiting...</div>
                      <div className="text-[10px] text-neutral-500">Open for online friend via share link</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-neutral-900 rounded-lg border border-neutral-800 font-semibold text-neutral-400">
                    EMPTY
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Don't Get Kiss Key Rules Card */}
        <div className="bg-red-950/30 border border-red-500/30 p-3.5 rounded-2xl mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>"Don't Get Kiss" Escape Rules</span>
          </div>
          <div className="text-[11px] text-neutral-300 space-y-1">
            <p>
              • <strong>Co-op Quest:</strong> Work together to complete the active weird quest before the countdown timer hits 0.
            </p>
            <p>
              • <strong>1 Finishes = All Saved:</strong> If any single player finishes the objective, all cats are saved!
            </p>
            <p>
              • <strong>The Kiss Hunt:</strong> If time expires, Aunt Gertrude will chase cats at <strong>1.5x speed</strong> with puckered lips.
            </p>
            <p>
              • <strong>Climb High to Escape:</strong> Humans cannot climb! Hold <strong>W or Space</strong> near Cat Skyscraper Towers, bookcases, or chandeliers to reach safety.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Multiplayer lobby active • WebRTC Mesh Voice Active</span>
          </div>

          <button
            onClick={onStartGame}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>ENTER MANSION NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
