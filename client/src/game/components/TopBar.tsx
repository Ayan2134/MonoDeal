import { useState } from 'react';
import { TurnPhase } from '../types';
import { useSocketStatus } from '../../socket/useSocketStatus';

type TopBarProps = {
  currentTurnPlayerName: string;
  isMyTurn: boolean;
  phase: TurnPhase;
  actionsRemaining: number;
  deckCount: number;
  discardCount: number;
  gameEnded: boolean;
  roomCode?: string;
  inviteLink?: string;
  onOpenEncyclopedia?: () => void;
};

export function TopBar({
  currentTurnPlayerName,
  isMyTurn,
  phase,
  actionsRemaining,
  deckCount,
  discardCount,
  gameEnded,
  roomCode,
  inviteLink,
  onOpenEncyclopedia,
}: TopBarProps) {
  const { isConnected } = useSocketStatus();
  const [copied, setCopied] = useState(false);

  const phaseLabel = {
    [TurnPhase.Draw]: 'Draw',
    [TurnPhase.Action]: 'Action',
    [TurnPhase.End]: 'End',
  }[phase];

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      // Primary method using modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = inviteLink;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-[#181c20]/80 px-6 backdrop-blur-md">
      {/* Left: Turn Info & Room Code */}
      <div className="flex items-center gap-6">
        <div className={`flex items-center gap-3 rounded-full border px-4 py-1 transition-all ${
          isMyTurn 
            ? 'border-brass bg-brass/20 active-turn-glow' 
            : 'border-white/10 bg-white/5'
        }`}>
          <div className={`h-2 w-2 rounded-full ${isMyTurn ? 'bg-brass animate-pulse' : 'bg-white/20'}`} />
          <span className={`text-sm font-bold tracking-wide ${isMyTurn ? 'text-brass' : 'text-white/60'}`}>
            {isMyTurn ? "YOUR TURN" : `WAITING FOR ${currentTurnPlayerName.toUpperCase()}`}
          </span>
        </div>

        {roomCode && (
          <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Room Code</span>
              <span className="text-sm font-black tracking-tighter text-brass">{roomCode}</span>
            </div>
            {inviteLink && (
              <button
                onClick={handleCopyInvite}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold transition-all ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    <span>INVITE</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {!gameEnded && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Phase</span>
            <span className="text-xs font-bold text-white">{phaseLabel}</span>
          </div>
        )}
      </div>

      {/* Center: Actions */}
      {!gameEnded && isMyTurn && (
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i}
              className={`h-2 w-8 rounded-full transition-all duration-500 ${
                i < actionsRemaining ? 'bg-brass shadow-[0_0_10px_rgba(216,166,87,0.5)]' : 'bg-white/10'
              }`}
            />
          ))}
          <span className="ml-2 text-xs font-bold text-brass/80">{actionsRemaining} ACTIONS LEFT</span>
        </div>
      )}

      {/* Right: Pile Counts & Connection */}
      <div className="flex items-center gap-6">
        <button
          onClick={onOpenEncyclopedia}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 transition-all hover:bg-white/10 hover:border-brass/40 group/btn"
        >
          <svg className="text-white/40 group-hover/btn:text-brass transition-colors" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/btn:text-white transition-colors">Rulebook</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Deck</span>
            <span className="text-sm font-bold text-white/80">{deckCount}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Discard</span>
            <span className="text-sm font-bold text-white/80">{discardCount}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
          <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            {isConnected ? 'Sync' : 'Lost'}
          </span>
        </div>
      </div>
    </div>
  );
}
