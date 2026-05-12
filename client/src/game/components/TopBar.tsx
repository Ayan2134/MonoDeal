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
};

export function TopBar({
  currentTurnPlayerName,
  isMyTurn,
  phase,
  actionsRemaining,
  deckCount,
  discardCount,
  gameEnded,
}: TopBarProps) {
  const { isConnected } = useSocketStatus();

  const phaseLabel = {
    [TurnPhase.Draw]: 'Draw',
    [TurnPhase.Action]: 'Action',
    [TurnPhase.End]: 'End',
  }[phase];

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-[#181c20]/80 px-6 backdrop-blur-md">
      {/* Left: Turn Info */}
      <div className="flex items-center gap-4">
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
