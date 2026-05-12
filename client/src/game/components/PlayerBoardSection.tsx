import { CardView } from '../CardView';
import { useState } from 'react';
import { PropertyMoveSelector } from './PropertyMoveSelector';
import { Card, GamePlayer, PropertySet } from '../types';

type PlayerBoardSectionProps = {
  player: GamePlayer;
  isCurrentPlayer: boolean;
};

const PROPERTY_SET_SIZES: Record<string, number> = {
  brown: 2,
  'light-blue': 3,
  pink: 3,
  orange: 3,
  red: 3,
  yellow: 3,
  green: 3,
  'dark-blue': 2,
  rail: 4,
  utility: 2,
};

function getSetSize(color: string) {
  return PROPERTY_SET_SIZES[color] ?? Number.POSITIVE_INFINITY;
}

export function PlayerBoardSection({ player, isCurrentPlayer, onRearrange, isPlayersTurn }: PlayerBoardSectionProps & { onRearrange?: (cardId: string, color: string, setId: string) => void, isPlayersTurn?: boolean }) {
  const [movingCard, setMovingCard] = useState<{ card: Card, set: PropertySet } | null>(null);
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
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 bg-black/20 rounded-xl p-4 border border-white/5">
      {/* Bank Section */}
      <div className="flex flex-col border-r border-white/10 pr-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Your Bank</span>
          <span className="text-xl font-black text-emerald-400">${bankTotal}M</span>
        </div>
        
        <div className="flex flex-col gap-2">
          {sortedDenominations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 py-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Empty</span>
            </div>
          ) : (
            sortedDenominations.map(({ val, count }) => (
              <div key={val} className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-6 rounded-sm bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                    ${val}M
                  </div>
                  <span className="text-xs font-bold text-white/80">Denomination</span>
                </div>
                <span className="text-xs font-black text-emerald-400">×{count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Properties Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Your Properties</span>
          <span className="text-xs font-bold text-white/60">{player.properties.length} Active Sets</span>
        </div>

        {player.properties.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-white/5 bg-white/5 py-8 text-center">
            <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No properties played yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {player.properties.map((set) => (
              <div key={set.setId} className={`relative flex flex-col rounded-xl border p-3 shadow-lg ${
                set.isComplete ? 'border-brass/30 bg-brass/5' : 'border-white/10 bg-white/5'
              }`}>
                {/* Set Header */}
                <div className="mb-3 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full bg-prop-${set.color.replace('-', '')}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{set.color.replace('-', ' ')}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      {set.houseCard && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-emerald-500 shadow-lg" title="House Attached">
                          <span className="text-[10px] font-black text-ink">H</span>
                        </div>
                      )}
                      {set.hotelCard && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-500 shadow-lg" title="Hotel Attached">
                          <span className="text-[10px] font-black text-ink">H</span>
                        </div>
                      )}
                      {set.isComplete && !set.houseCard && !set.hotelCard && (
                        <span className="text-[10px] font-black text-brass animate-pulse">★ COMPLETE</span>
                      )}
                      {!set.isComplete && set.cards.length >= getSetSize(set.color) && (
                        <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-1 rounded" title="A complete set must have at least one real property card (not just wildcards).">
                           NEEDS REAL PROP
                        </span>
                      )}
                   </div>
                </div>

                {/* Card Stack */}
                <div className="flex -space-x-16 overflow-visible pb-2 pl-2 pr-12">
                  {set.cards.map((card, i) => (
                    <div key={card.id} style={{ zIndex: i }} className="group/card relative">
                       <CardView card={card} />
                       {isCurrentPlayer && isPlayersTurn && (
                         <button 
                           onClick={() => setMovingCard({ card, set })}
                           className="absolute -top-2 -right-2 z-50 flex h-6 w-12 items-center justify-center rounded-full bg-brass text-[8px] font-black text-ink opacity-0 shadow-lg transition group-hover/card:opacity-100 hover:scale-110"
                         >
                           MOVE
                         </button>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {movingCard && (
          <PropertyMoveSelector
            card={movingCard.card}
            currentSet={movingCard.set}
            allSets={player.properties}
            onConfirm={(color, setId) => {
              onRearrange?.(movingCard.card.id, color, setId);
              setMovingCard(null);
            }}
            onCancel={() => setMovingCard(null)}
          />
        )}
      </div>
    </div>
  );
}
