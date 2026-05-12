import { GamePlayer } from '../types';
import { PlayerBoardSection } from './PlayerBoardSection';

type ExpandedBoardModalProps = {
  player: GamePlayer;
  isCurrentPlayer: boolean;
  isPlayersTurn?: boolean;
  onClose: () => void;
  onRearrange?: (cardId: string, color: string, setId: string) => void;
};

export function ExpandedBoardModal({
  player,
  isCurrentPlayer,
  isPlayersTurn,
  onClose,
  onRearrange,
}: ExpandedBoardModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-brass/30 bg-[#121417] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6 bg-white/5">
          <div className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${player.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {player.name}'s Board
              </h2>
              <div className="flex gap-4 mt-1">
                 <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                   Hand: <span className="text-white">{player.hand.length} Cards</span>
                 </span>
                 <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                   Status: <span className={player.status === 'connected' ? 'text-emerald-400' : 'text-white/40'}>{player.status}</span>
                 </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/5 p-3 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <PlayerBoardSection 
            player={player} 
            isCurrentPlayer={isCurrentPlayer} 
            isPlayersTurn={isPlayersTurn}
            onRearrange={onRearrange}
          />
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/5 p-4 bg-black/20 text-center">
           <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Board Inspection Mode</p>
        </div>
      </div>
    </div>
  );
}
