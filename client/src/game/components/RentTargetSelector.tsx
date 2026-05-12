import { useState } from 'react';
import type { ActionCard, PropertySet, PropertyColor, Card } from '../types';

type RentTargetSelectorProps = {
  card: ActionCard;
  ownedSets: PropertySet[];
  opponents: { id: string; name: string }[];
  hand: Card[];
  actionsRemaining: number;
  initialModifierIds?: string[];
  onConfirm: (setId: string, targetPlayerId?: string, modifierCardIds?: string[]) => void;
  onCancel: () => void;
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

const HOUSE_BONUS = 3;
const HOTEL_BONUS = 4;

export function RentTargetSelector({
  card,
  ownedSets,
  opponents,
  hand,
  actionsRemaining,
  initialModifierIds = [],
  onConfirm,
  onCancel,
}: RentTargetSelectorProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>(initialModifierIds);

  const isWildcard = !!card.wildcardRent;
  const supportedColors = card.supportedColors || [];

  // Find all "Double The Rent" cards in hand
  const doubleRentCards = hand.filter(c => c.type === 'action' && (c as any).actionId === 'double-the-rent');

  const validSets = ownedSets.filter(set => {
    if (set.cards.length === 0 || set.color === 'wild') return false;
    if (isWildcard) return true;
    return supportedColors.includes(set.color as PropertyColor);
  });

  const needsPlayerSelection = isWildcard;

  // Calculate preview rent
  let baseRent = 0;
  let finalRent = 0;
  let multiplier = Math.pow(2, selectedModifierIds.length);

  if (selectedSetId) {
    const set = validSets.find(s => s.setId === selectedSetId);
    if (set) {
      const color = set.color;
      const rentTable = PROPERTY_RENT_TABLES[color] || [];
      const count = Math.min(set.cards.length, rentTable.length);
      baseRent = rentTable[count - 1] || 0;
      
      // Add buildings
      if (set.houseCard) baseRent += HOUSE_BONUS;
      if (set.hotelCard) baseRent += HOTEL_BONUS;
      
      finalRent = baseRent * multiplier;
    }
  }

  const handleConfirm = () => {
    if (needsPlayerSelection && !selectedPlayerId) return;
    if (!selectedSetId) return;
    onConfirm(selectedSetId, selectedPlayerId || undefined, selectedModifierIds);
  };

  const toggleModifier = (cardId: string) => {
    setSelectedModifierIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      
      // Check if we have enough actions
      const totalActionsRequired = 1 + prev.length + 1; // Rent + existing modifiers + this one
      if (totalActionsRequired > actionsRemaining) return prev;
      
      return [...prev, cardId];
    });
  };

  const isReady = selectedSetId && (!needsPlayerSelection || selectedPlayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-brass/30 bg-[#181c20] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="mb-2 text-2xl font-bold text-brass">Play Rent</h2>
        
        {needsPlayerSelection && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
              1. Select Target Player
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {opponents.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`rounded-lg px-4 py-3 text-left font-medium transition ${
                    selectedPlayerId === p.id 
                      ? 'bg-brass text-ink' 
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            {needsPlayerSelection ? '2. Select Property Color' : 'Select Property Color'}
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {validSets.map(set => (
              <button
                key={set.setId}
                onClick={() => setSelectedSetId(set.setId)}
                className={`flex flex-col items-center rounded-lg px-4 py-3 font-semibold transition border-2 ${
                  selectedSetId === set.setId
                    ? 'border-emerald-500 bg-emerald-500/20 text-white'
                    : 'border-transparent bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className={`mb-1 h-2 w-full rounded-full bg-prop-${set.color.replace('-', '')}`} />
                <span className="capitalize text-xs">{set.color.replace('-', ' ')} ({set.cards.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Double The Rent Modifiers */}
        {doubleRentCards.length > 0 && selectedSetId && (
          <div className="mb-6 border-t border-white/10 pt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
              3. Boost with Double The Rent?
            </h3>
            <div className="space-y-2">
              {doubleRentCards.map((dr, idx) => {
                const isSelected = selectedModifierIds.includes(dr.id);
                const canAfford = (1 + selectedModifierIds.length + (isSelected ? 0 : 1)) <= actionsRemaining;
                
                return (
                  <button
                    key={dr.id}
                    onClick={() => toggleModifier(dr.id)}
                    disabled={!isSelected && !canAfford}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-3 transition ${
                      isSelected 
                        ? 'bg-sky-500 text-white' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                       <span className="font-bold">Double The Rent #{idx + 1}</span>
                       {!isSelected && !canAfford && <span className="text-[10px] text-red-400 font-normal">(Not enough actions)</span>}
                    </div>
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-white bg-white/20' : 'border-white/20'}`}>
                      {isSelected && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Preview */}
        {selectedSetId && (
           <div className="mb-6 rounded-xl bg-ink/50 p-4 border border-white/5">
              <div className="flex justify-between text-sm text-white/40 mb-1">
                 <span>Base Rent:</span>
                 <span>{baseRent}M</span>
              </div>
              {selectedModifierIds.length > 0 && (
                <div className="flex justify-between text-sm text-sky-400 mb-1">
                   <span>Multipliers:</span>
                   <span>×{multiplier}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-black text-brass pt-2 border-t border-white/5">
                 <span>TOTAL RENT:</span>
                 <span>{finalRent}M</span>
              </div>
           </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/20 px-6 py-2 font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isReady}
            className="rounded-lg bg-brass px-6 py-2 font-semibold text-ink transition hover:bg-[#e6bc72] disabled:opacity-50 shadow-lg shadow-brass/20"
          >
            Confirm Rent ({1 + selectedModifierIds.length} Plays)
          </button>
        </div>
      </div>
    </div>
  );
}
