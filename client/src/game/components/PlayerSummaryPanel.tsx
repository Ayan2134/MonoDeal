import { GamePlayer } from '../types';

type PlayerSummaryPanelProps = {
  player: GamePlayer;
  isTurn: boolean;
  isMe?: boolean;
  onViewBoard: () => void;
};

export function PlayerSummaryPanel({ player, isTurn, isMe, onViewBoard }: PlayerSummaryPanelProps) {
  // Calculate bank total
  const bankTotal = player.bank.reduce((sum, card) => sum + (card.value || 0), 0);

  return (
    <div 
      onClick={onViewBoard}
      className={`group relative w-64 flex-shrink-0 cursor-pointer rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
      isTurn 
        ? 'border-brass bg-brass/10 shadow-[0_0_30px_rgba(216,166,87,0.15)] active-turn-glow' 
        : 'border-white/10 bg-[#121417]/60 hover:bg-[#181c20]'
    }`}>
      {/* Player Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${player.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`} />
          <h3 className={`text-sm font-black tracking-tight ${isMe ? 'text-brass' : 'text-white/90'}`}>
            {player.name} {isMe && '(You)'}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 border border-white/5">
           <span className="text-[9px] font-black text-white/40 uppercase">Hand</span>
           <span className="text-xs font-black text-white">{player.hand.length}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-4 grid grid-cols-2 gap-2">
         <div className="rounded-lg bg-black/20 p-2 border border-white/5">
            <span className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Bank Value</span>
            <span className="text-sm font-black text-emerald-400">${bankTotal}M</span>
         </div>
         <div className="rounded-lg bg-black/20 p-2 border border-white/5">
            <span className="block text-[8px] font-black uppercase tracking-widest text-white/30 mb-0.5">Properties</span>
            <span className="text-sm font-black text-sky-400">{player.properties.length} Sets</span>
         </div>
      </div>

      {/* Properties Summary */}
      <div className="space-y-1.5">
        {player.properties.length === 0 ? (
          <div className="text-[10px] text-white/20 italic bg-white/5 rounded py-2 text-center border border-dashed border-white/5">
            No properties on board
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {player.properties.map((set) => (
              <div 
                key={set.setId} 
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 border transition-colors ${
                  set.isComplete 
                    ? 'border-brass/40 bg-brass/10' 
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className={`h-2 w-2 rounded-full bg-prop-${set.color.replace('-', '')}`} />
                <span className={`text-[10px] font-black ${set.isComplete ? 'text-brass' : 'text-white/60'}`}>
                  {set.cards.length}
                </span>
                {set.houseCard && <span className="text-[8px] text-emerald-400 font-black">H</span>}
                {set.hotelCard && <span className="text-[8px] text-red-400 font-black">H</span>}
                {set.isComplete && !set.houseCard && !set.hotelCard && <span className="text-[8px] text-brass">★</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brass/20 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
         <div className="rounded-full bg-brass px-4 py-1.5 text-[10px] font-black text-ink shadow-xl uppercase tracking-widest">
            Inspect Board
         </div>
      </div>

      {/* Active Turn Indicator Badge */}
      {isTurn && (
        <div className="absolute -top-2 -left-2 rounded bg-brass px-2 py-0.5 text-[9px] font-black text-ink shadow-lg ring-2 ring-ink">
          ACTIVE
        </div>
      )}
    </div>
  );
}
