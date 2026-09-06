import { GamePlayer } from '../types';
import { useGameStore } from '../../store/gameStore';

type PlayerSummaryPanelProps = {
  player: GamePlayer;
  isTurn: boolean;
  isMe?: boolean;
  onViewBoard: () => void;
};

export function PlayerSummaryPanel({ player, isTurn, isMe, onViewBoard }: PlayerSummaryPanelProps) {
  const { highlightState } = useGameStore();
  const isHighlighted = highlightState.playerIds.includes(player.id);
  const bankTotal = player.bank.reduce((sum, card) => sum + (card.value || 0), 0);
  const completeSets = player.properties.filter((set) => set.isComplete).length;

  return (
    <button
      type="button"
      onClick={onViewBoard}
      className={`group relative flex-shrink-0 cursor-pointer rounded-xl border text-left transition-all duration-300 ${
        // Phone: compact chip. Desktop: full summary card.
        'w-[9.5rem] p-2.5 md:w-64 md:p-4 md:hover:scale-[1.02] md:hover:shadow-xl'
      } ${
        isTurn
          ? 'border-brass bg-brass/10 shadow-[0_0_30px_rgba(216,166,87,0.15)] active-turn-glow'
          : 'border-white/10 bg-[#121417]/60 md:hover:bg-[#181c20]'
      } ${isHighlighted ? 'ring-2 ring-brass bg-brass/5 animate-pulse' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-1 md:mb-4">
        <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
          <div
            className={`h-2 w-2 shrink-0 rounded-full ${
              player.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/20'
            }`}
          />
          <h3 className={`truncate text-xs font-black tracking-tight md:text-sm ${isMe ? 'text-brass' : 'text-white/90'}`}>
            {player.name}
            {isMe ? ' (You)' : ''}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/5 bg-white/5 px-1.5 py-0.5">
          <span className="hidden text-[9px] font-black uppercase text-white/40 md:inline">Hand</span>
          <span className="text-[10px] font-black text-white md:text-xs">{player.hand.length}</span>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-1.5 md:mb-4 md:gap-2">
        <div className="rounded-lg border border-white/5 bg-black/20 p-1.5 md:p-2">
          <span className="mb-0.5 block text-[7px] font-black uppercase tracking-widest text-white/30 md:text-[8px]">Bank</span>
          <span className="text-xs font-black text-emerald-400 md:text-sm">${bankTotal}M</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/20 p-1.5 md:p-2">
          <span className="mb-0.5 block text-[7px] font-black uppercase tracking-widest text-white/30 md:text-[8px]">Sets</span>
          <span className="text-xs font-black text-sky-400 md:text-sm">
            {completeSets}/{player.properties.length}
          </span>
        </div>
      </div>

      <div className="hidden space-y-1.5 md:block">
        {player.properties.length === 0 ? (
          <div className="rounded border border-dashed border-white/5 bg-white/5 py-2 text-center text-[10px] italic text-white/20">
            No properties on board
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {player.properties.map((set) => (
              <div
                key={set.setId}
                className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${
                  set.isComplete ? 'border-brass/40 bg-brass/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className={`h-2 w-2 rounded-full bg-prop-${set.color.replace('-', '')}`} />
                <span className={`text-[10px] font-black ${set.isComplete ? 'text-brass' : 'text-white/60'}`}>
                  {set.cards.length}
                </span>
                {set.houseCard ? <span className="text-[8px] font-black text-emerald-400">H</span> : null}
                {set.hotelCard ? <span className="text-[8px] font-black text-red-400">H</span> : null}
                {set.isComplete && !set.houseCard && !set.hotelCard ? <span className="text-[8px] text-brass">★</span> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color dots only on phone */}
      <div className="flex flex-wrap gap-1 md:hidden">
        {player.properties.slice(0, 8).map((set) => (
          <div
            key={set.setId}
            className={`h-2 w-2 rounded-full ${set.isComplete ? 'ring-1 ring-brass' : ''} bg-prop-${set.color.replace('-', '')}`}
          />
        ))}
      </div>

      <div className="absolute inset-0 hidden items-center justify-center rounded-xl bg-brass/20 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 md:flex">
        <div className="rounded-full bg-brass px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-ink shadow-xl">
          Inspect Board
        </div>
      </div>

      {isTurn ? (
        <div className="absolute -left-1 -top-1 rounded bg-brass px-1.5 py-0.5 text-[8px] font-black text-ink shadow-lg ring-2 ring-ink md:-left-2 md:-top-2 md:px-2 md:text-[9px]">
          ACTIVE
        </div>
      ) : null}
    </button>
  );
}
