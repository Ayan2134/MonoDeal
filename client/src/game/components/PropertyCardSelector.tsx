import { useState } from 'react';
import { GamePlayer, PropertySet, Card } from '../types';
import { CardView } from '../CardView';

type PropertyCardSelectorProps = {
  title: string;
  players: GamePlayer[];
  onlyIncompleteSets?: boolean;
  maxSelection?: number;
  onConfirm: (selections: { playerId: string; cardId: string }[]) => void;
  onCancel: () => void;
  onInspectCard?: (card: Card) => void;
};

export function PropertyCardSelector({
  title,
  players,
  onlyIncompleteSets = true,
  maxSelection = 1,
  onConfirm,
  onCancel,
}: PropertyCardSelectorProps) {
  const [selectedCards, setSelectedCards] = useState<{ playerId: string; cardId: string }[]>([]);

  const toggleSelection = (playerId: string, cardId: string) => {
    setSelectedCards(prev => {
      const isSelected = prev.find(s => s.cardId === cardId);
      if (isSelected) {
        return prev.filter(s => s.cardId !== cardId);
      }
      if (prev.length >= maxSelection) {
        if (maxSelection === 1) return [{ playerId, cardId }];
        return prev;
      }
      return [...prev, { playerId, cardId }];
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-brass/30 bg-[#181c20] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-brass uppercase tracking-wider">{title}</h2>
            <p className="text-sm text-white/40">Select {maxSelection} {maxSelection === 1 ? 'property card' : 'property cards'}</p>
          </div>
          <button 
            onClick={onCancel}
            className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {players.map(player => {
            const eligibleSets = onlyIncompleteSets 
              ? player.properties.filter(s => !s.isComplete)
              : player.properties;
            
            if (eligibleSets.length === 0) return null;

            return (
              <div key={player.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brass" />
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">{player.name}'s Collection</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {eligibleSets.map(set => (
                    set.cards.map(card => {
                      const isSelected = !!selectedCards.find(s => s.cardId === card.id);
                      return (
                        <div key={card.id} className="relative group">
                          <CardView 
                            card={card} 
                            isSelected={isSelected}
                            onClick={() => toggleSelection(player.id, card.id)}
                            onInspect={() => onInspectCard?.(card)}
                          />
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-brass text-ink font-black shadow-lg">
                              ✓
                            </div>
                          )}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
            );
          })}
          
          {players.every(p => (onlyIncompleteSets ? p.properties.filter(s => !s.isComplete) : p.properties).length === 0) && (
            <div className="py-20 text-center">
              <p className="text-white/20 font-bold uppercase tracking-[0.2em]">No eligible properties found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border border-white/10 font-bold text-white/60 hover:bg-white/10 transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(selectedCards)}
            disabled={selectedCards.length !== maxSelection}
            className="px-8 py-2 rounded-lg bg-brass font-black text-ink shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}
