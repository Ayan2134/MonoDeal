import { CardView } from '../CardView';
import { useState } from 'react';
import { PropertyMoveSelector } from './PropertyMoveSelector';
import { Card, GamePlayer, PropertySet } from '../types';

type PlayerBoardSectionProps = {
  player: GamePlayer;
  isCurrentPlayer: boolean;
  onRearrange?: (cardId: string, color: string, setId: string) => void;
  isPlayersTurn?: boolean;
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

const PROPERTY_RENT_TABLES: Record<string, number[]> = {
  brown: [1, 2],
  'light-blue': [1, 2, 3],
  pink: [1, 2, 4],
  orange: [1, 3, 5],
  red: [2, 3, 6],
  yellow: [2, 4, 6],
  green: [2, 4, 7],
  'dark-blue': [3, 8],
  rail: [1, 2, 3, 4],
  utility: [1, 2],
};

function getSetSize(color: string) {
  return PROPERTY_SET_SIZES[color] ?? Number.POSITIVE_INFINITY;
}

export function PlayerBoardSection({ 
  player, 
  isCurrentPlayer, 
  onRearrange, 
  isPlayersTurn 
}: PlayerBoardSectionProps) {
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

  const getRent = (set: PropertySet) => {
    const color = set.color;
    const rentTable = PROPERTY_RENT_TABLES[color] || [];
    const count = Math.min(set.cards.length, rentTable.length);
    let rent = rentTable[count - 1] || 0;
    if (set.houseCard) rent += 3;
    if (set.hotelCard) rent += 4;
    return rent;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 bg-black/20 rounded-xl p-6 border border-white/5">
      {/* Bank Section */}
      <div className="flex flex-col border-r border-white/10 pr-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {isCurrentPlayer ? 'Your Bank' : `${player.name}'s Bank`}
          </span>
          <span className="text-xl font-black text-emerald-400">${bankTotal}M</span>
        </div>
        
        <div className="flex flex-col gap-2 mb-8">
          {sortedDenominations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 py-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Empty Bank</span>
            </div>
          ) : (
            sortedDenominations.map(({ val, count }) => (
              <div key={val} className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-6 rounded-sm bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                    ${val}M
                  </div>
                  <span className="text-xs font-bold text-white/80">Value</span>
                </div>
                <span className="text-xs font-black text-emerald-400">×{count}</span>
              </div>
            ))
          )}
        </div>

        {/* Bank Card Gallery */}
        {player.bank.length > 0 && (
          <div className="mt-auto pt-6 border-t border-white/5">
             <span className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-4">Banked Items</span>
             <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {player.bank.map(card => (
                  <div key={card.id} className="scale-75 origin-top-left -mb-12 -mr-6">
                     <CardView card={card} />
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Properties Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {isCurrentPlayer ? 'Your Properties' : `${player.name}'s Properties`}
          </span>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{player.properties.length} Active Sets</span>
        </div>

        {player.properties.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/5 bg-white/5 py-12 text-center">
            <p className="text-xs font-bold text-white/20 uppercase tracking-[0.3em]">No property sets established</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {player.properties.map((set) => {
              const currentRent = getRent(set);
              return (
                <div key={set.setId} className={`relative flex flex-col rounded-2xl border p-4 shadow-2xl min-w-[200px] transition-all hover:scale-[1.02] ${
                  set.isComplete ? 'border-brass/40 bg-brass/10 shadow-brass/5' : 'border-white/10 bg-white/5 shadow-black/40'
                }`}>
                  {/* Set Header */}
                  <div className="mb-4 flex items-center justify-between gap-4">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <div className={`h-2.5 w-2.5 rounded-full shadow-sm bg-prop-${set.color.replace('-', '')}`} />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{set.color.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-emerald-400">RENT: ${currentRent}M</span>
                           {set.isComplete && <span className="text-[8px] font-black text-brass uppercase tracking-widest">★ Complete</span>}
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5">
                        {set.houseCard && (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500 shadow-lg ring-1 ring-white/20" title="House Attached">
                            <span className="text-[10px] font-black text-ink">H</span>
                          </div>
                        )}
                        {set.hotelCard && (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-red-500 shadow-lg ring-1 ring-white/20" title="Hotel Attached">
                            <span className="text-[10px] font-black text-ink">H</span>
                          </div>
                        )}
                        {!set.isComplete && set.cards.length >= getSetSize(set.color) && (
                          <span className="text-[8px] font-black text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20" title="A complete set must have at least one real property card.">
                             WILD ONLY
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
                             className="absolute -top-2 -right-2 z-50 flex h-7 w-14 items-center justify-center rounded-full bg-brass text-[9px] font-black text-ink opacity-0 shadow-xl transition-all group-hover/card:opacity-100 hover:scale-110 active:scale-95"
                           >
                             Move
                           </button>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
