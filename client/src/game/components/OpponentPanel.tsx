import { GamePlayer, Card } from '../types';
import { CardView } from '../CardView';

type OpponentPanelProps = {
  player: GamePlayer;
  isTurn: boolean;
};

export function OpponentPanel({ player, isTurn }: OpponentPanelProps) {
  // Calculate bank breakdown
  const bankBreakdown = player.bank.reduce((acc, card) => {
    const val = card.value || 0;
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const bankTotal = player.bank.reduce((sum, card) => sum + (card.value || 0), 0);
  const sortedDenominations = Object.entries(bankBreakdown)
    .map(([val, count]) => ({ val: Number(val), count }))
    .sort((a, b) => b.val - a.val);

  return (
    <div className={`relative w-64 flex-shrink-0 rounded-xl border p-4 transition-all duration-300 ${
      isTurn 
        ? 'border-brass bg-brass/5 shadow-[0_0_20px_rgba(216,166,87,0.1)] active-turn-glow' 
        : 'border-white/10 bg-[#121417]/60'
    }`}>
      {/* Player Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${player.status === 'connected' ? 'bg-emerald-500' : 'bg-white/20'}`} />
          <h3 className="text-sm font-bold text-white/90">{player.name}</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 border border-white/5">
           <span className="text-[10px] font-bold text-white/40">HAND</span>
           <span className="text-xs font-bold text-white">{player.hand.length}</span>
        </div>
      </div>

      {/* Bank Area */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Bank</span>
          <span className="text-sm font-black text-emerald-400">${bankTotal}M</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {sortedDenominations.length === 0 ? (
            <span className="text-[10px] text-white/20 italic">Empty</span>
          ) : (
            sortedDenominations.map(({ val, count }) => (
              <div key={val} className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-300">${val}M</span>
                <span className="text-[9px] font-medium text-emerald-300/60">×{count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Properties Area */}
      <div>
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/30">Properties</span>
        <div className="flex flex-wrap gap-1.5">
          {player.properties.length === 0 ? (
            <span className="text-[10px] text-white/20 italic">No sets</span>
          ) : (
            player.properties.map((set) => (
              <div 
                key={set.setId} 
                className={`group relative flex items-center gap-1 rounded px-2 py-1 border border-white/10 ${
                  set.isComplete ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                <div className={`h-2.5 w-2.5 rounded-full bg-prop-${set.color.replace('-', '')}`} />
                <span className={`text-[10px] font-bold ${set.isComplete ? 'text-white' : 'text-white/60'}`}>
                  {set.cards.length}
                </span>
                {set.houseCard && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="House" />}
                {set.hotelCard && <div className="h-1.5 w-1.5 rounded-full bg-red-500" title="Hotel" />}
                {set.isComplete && !set.houseCard && !set.hotelCard && <span className="text-[8px] text-brass">★</span>}
                
                {/* Mini card stack on hover would be cool, but keeping it simple first */}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Turn Indicator Badge */}
      {isTurn && (
        <div className="absolute -top-2 -right-2 rounded bg-brass px-2 py-0.5 text-[9px] font-black text-ink shadow-lg">
          CURRENTLY PLAYING
        </div>
      )}
    </div>
  );
}
