import { useMemo, useState } from 'react';
import type { Card } from '../types';
import { CardView } from '../CardView';

export function DiscardOverlay({
  cards,
  requiredCount,
  onConfirm,
  onCancel,
  onInspectCard,
}: {
  cards: Card[];
  requiredCount: number;
  onConfirm: (cardIds: string[]) => void;
  onCancel: () => void;
  onInspectCard: (card: Card) => void;
}) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const toggleSelection = (cardId: string) => {
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= requiredCount) {
        return prev;
      }
      return [...prev, cardId];
    });
  };

  const isReady = selectedCardIds.length === requiredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-brass/30 bg-[#181c20] p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-bold text-brass">
          Hand Limit Reached
        </h2>
        <p className="mb-6 text-white/80">
          You have {cards.length} cards, but the limit is 7. You must discard{' '}
          <span className="font-bold text-white">{requiredCount}</span> cards.
        </p>

        <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {cards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => toggleSelection(card.id)}
                  className={`cursor-pointer transition-transform hover:scale-105 ${
                    isSelected ? 'ring-2 ring-red-500 rounded-lg scale-105 opacity-50' : ''
                  }`}
                >
                  <CardView 
                    card={card} 
                    onInspect={() => onInspectCard(card)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/20 px-6 py-2 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedCardIds)}
            disabled={!isReady}
            className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
          >
            Discard {selectedCardIds.length}/{requiredCount}
          </button>
        </div>
      </div>
    </div>
  );
}
