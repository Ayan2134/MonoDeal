import { useState } from 'react';
import type { GamePlayer, PropertySet } from '../types';

type DealBreakerTargetSelectorProps = {
  opponents: GamePlayer[];
  onConfirm: (targetPlayerId: string, setId: string) => void;
  onCancel: () => void;
};

export function DealBreakerTargetSelector({
  opponents,
  onConfirm,
  onCancel,
}: DealBreakerTargetSelectorProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // Filter opponents who actually have at least one COMPLETE property set
  const validOpponents = opponents.filter(p => p.properties.some(s => s.isComplete));

  const selectedOpponent = opponents.find(p => p.id === selectedPlayerId);
  const completeSets = selectedOpponent?.properties.filter(s => s.isComplete) || [];

  const handleConfirm = () => {
    if (!selectedPlayerId || !selectedSetId) return;
    onConfirm(selectedPlayerId, selectedSetId);
  };

  const isReady = selectedPlayerId && selectedSetId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-brass/30 bg-[#181c20] p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-bold text-brass">Play Deal Breaker</h2>
        <p className="mb-6 text-sm text-white/60">Steal a complete property set.</p>

        {validOpponents.length === 0 ? (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-400">
            No opponents currently have a complete property set to steal.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
                1. Select Target Player
              </h3>
              <div className="space-y-2">
                {validOpponents.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPlayerId(p.id);
                      setSelectedSetId(null); // reset selection
                    }}
                    className={`w-full rounded-lg px-4 py-3 text-left font-medium transition ${
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

            {selectedOpponent && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
                  2. Select Complete Set
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {completeSets.map(set => (
                    <button
                      key={set.setId}
                      onClick={() => setSelectedSetId(set.setId)}
                      className={`rounded-lg px-4 py-3 font-semibold capitalize transition ${
                        selectedSetId === set.setId
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {set.color.replace('-', ' ')} ({set.cards.length} cards)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
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
            className="rounded-lg bg-brass px-6 py-2 font-semibold text-ink transition hover:bg-[#e6bc72] disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
