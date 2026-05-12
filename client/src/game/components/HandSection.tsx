import { useState } from 'react';
import { Card, CardDestination, CardType, type PropertySet } from '../types';
import { CardView } from '../CardView';
import { CardContextMenu } from './CardContextMenu';
import { WildcardColorSelector } from './WildcardColorSelector';
import { RentTargetSelector } from './RentTargetSelector';
import { DealBreakerTargetSelector } from './DealBreakerTargetSelector';
import { PropertyCardSelector } from './PropertyCardSelector';
import { BuildingTargetSelector } from './BuildingTargetSelector';
import type { ActionCard, GamePlayer, PropertyColor } from '../types';

type HandSectionProps = {
  cards: Card[];
  isPlayersTurn: boolean;
  isLoading: boolean;
  gameEnded: boolean;
  actionsRemaining: number;
  players?: GamePlayer[];
  playerId?: string;
  onPlayCard: (cardId: string, destination: CardDestination, propertyColor?: PropertySet['color'], targets?: any, targetSetId?: string) => void;
  onRearrange: (cardId: string, targetColor: string, targetSetId: string) => void;
  onInspectCard?: (card: Card) => void;
};

export function HandSection({
  cards,
  isPlayersTurn,
  isLoading,
  gameEnded,
  actionsRemaining,
  players = [],
  playerId,
  onPlayCard,
  onRearrange,
  onInspectCard,
}: HandSectionProps) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [wildcardCardId, setWildcardCardId] = useState<string | null>(null);
  const [wildcardCardName, setWildcardCardName] = useState<string>('');
  const [targetActionId, setTargetActionId] = useState<string | null>(null);
  const [rentCardId, setRentCardId] = useState<string | null>(null);
  const [dealBreakerCardId, setDealBreakerCardId] = useState<string | null>(null);
  const [slyDealCardId, setSlyDealCardId] = useState<string | null>(null);
  const [forcedDealCardId, setForcedDealCardId] = useState<string | null>(null);
  const [forcedDealStep, setForcedDealStep] = useState<1 | 2 | null>(null);
  const [forcedDealInitiatorCard, setForcedDealInitiatorCard] = useState<{ playerId: string; cardId: string } | null>(null);
  const [buildingCardId, setBuildingCardId] = useState<string | null>(null);
  const [buildingType, setBuildingType] = useState<'house' | 'hotel' | null>(null);
  const [doubleRentCardId, setDoubleRentCardId] = useState<string | null>(null);
  const [pendingDTRId, setPendingDTRId] = useState<string | null>(null);

  const currentPlayer = players.find(p => p.id === playerId);
  
  function handlePlayProperty(cardId: string, color?: PropertySet['color'], targetSetId?: string) {
    onPlayCard(cardId, CardDestination.Property, color, undefined, targetSetId);
    setExpandedCardId(null);
  }

  function handlePlayAction(cardId: string, actionId?: string) {
    if (actionId === 'rent') {
      setRentCardId(cardId);
      return;
    }
    if (actionId === 'deal-breaker') {
      setDealBreakerCardId(cardId);
      return;
    }
    if (actionId === 'sly-deal') {
      setSlyDealCardId(cardId);
      return;
    }
    if (actionId === 'forced-deal') {
      setForcedDealCardId(cardId);
      setForcedDealStep(1);
      return;
    }
    if (actionId === 'house' || actionId === 'hotel') {
      setBuildingCardId(cardId);
      setBuildingType(actionId as 'house' | 'hotel');
      return;
    }
    if (actionId === 'double-the-rent') {
      setDoubleRentCardId(cardId);
      setPendingDTRId(cardId);
      return;
    }

    const requiresTarget = actionId && ['debt-collector', 'sly-deal', 'forced-swap'].includes(actionId);
    
    if (requiresTarget) {
      setTargetActionId(cardId);
      return;
    }

    onPlayCard(cardId, CardDestination.Discard);
    setExpandedCardId(null);
  }

  function confirmTarget(cardId: string, targetId: string) {
    onPlayCard(cardId, CardDestination.Discard, undefined, { playerIds: [targetId] });
    setTargetActionId(null);
    setExpandedCardId(null);
  }

  function handleBankAsMoney(cardId: string) {
    onPlayCard(cardId, CardDestination.Bank);
    setExpandedCardId(null);
  }

  function handleWildcardColor(cardId: string, color: PropertySet['color'], targetSetId?: string) {
    handlePlayProperty(cardId, color, targetSetId);
    setWildcardCardId(null);
  }

  function handleRentConfirm(setId: string, targetPlayerId?: string, modifierCardIds?: string[]) {
    if (!rentCardId) return;
    onPlayCard(rentCardId, CardDestination.Discard, undefined, {
      propertySetIds: [setId],
      playerIds: targetPlayerId ? [targetPlayerId] : [],
      modifierCardIds
    });
    setRentCardId(null);
    setExpandedCardId(null);
  }

  function handleDealBreakerConfirm(targetPlayerId: string, setId: string) {
    if (!dealBreakerCardId) return;
    onPlayCard(dealBreakerCardId, CardDestination.Discard, undefined, {
      playerIds: [targetPlayerId],
      propertySetIds: [setId]
    });
    setDealBreakerCardId(null);
    setExpandedCardId(null);
  }

  function handleSlyDealConfirm(selections: { playerId: string; cardId: string }[]) {
    if (!slyDealCardId || selections.length !== 1) return;
    const { playerId: targetPlayerId, cardId: targetCardId } = selections[0];
    onPlayCard(slyDealCardId, CardDestination.Discard, undefined, {
      playerIds: [targetPlayerId],
      propertyCardIds: [targetCardId]
    });
    setSlyDealCardId(null);
    setExpandedCardId(null);
  }

  function handleForcedDealInitiatorConfirm(selections: { playerId: string; cardId: string }[]) {
    if (selections.length !== 1) return;
    setForcedDealInitiatorCard(selections[0]);
    setForcedDealStep(2);
  }

  function handleForcedDealTargetConfirm(selections: { playerId: string; cardId: string }[]) {
    if (!forcedDealCardId || !forcedDealInitiatorCard || selections.length !== 1) return;
    const { playerId: targetPlayerId, cardId: targetCardId } = selections[0];
    onPlayCard(forcedDealCardId, CardDestination.Discard, undefined, {
      playerIds: [targetPlayerId],
      propertyCardIds: [forcedDealInitiatorCard.cardId, targetCardId]
    });
    setForcedDealCardId(null);
    setForcedDealStep(null);
    setForcedDealInitiatorCard(null);
    setExpandedCardId(null);
  }

  function handleBuildingConfirm(setId: string) {
    if (!buildingCardId) return;
    onPlayCard(buildingCardId, CardDestination.Discard, undefined, {
      propertySetIds: [setId]
    });
    setBuildingCardId(null);
    setBuildingType(null);
    setExpandedCardId(null);
  }

  const activeRentCard = rentCardId ? cards.find(c => c.id === rentCardId) as ActionCard | undefined : undefined;
  const activeWildcardCard = wildcardCardId ? cards.find(c => c.id === wildcardCardId) as any : undefined;

  // Calculate card fan rotations
  const getRotation = (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const diff = index - mid;
    return diff * 4; // 4 degrees per card
  };

  const getTranslateY = (index: number, total: number) => {
    const mid = (total - 1) / 2;
    const diff = Math.abs(index - mid);
    return diff * 4; // slight curve
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent pb-4 pt-12">
      <div className="card-fan-container">
        {cards.length === 0 ? (
          <div className="mb-8 rounded-full border border-white/10 bg-white/5 px-8 py-2 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">Your hand is empty</p>
          </div>
        ) : (
          cards.map((card, index) => {
            const isExpanded = expandedCardId === card.id;
            const rotation = getRotation(index, cards.length);
            const translateY = getTranslateY(index, cards.length);

            return (
              <div
                key={card.id}
                className="card-fan-item relative"
                style={{ 
                  transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                  zIndex: index
                }}
              >
                <CardView 
                  card={card} 
                  isSelected={isExpanded} 
                  onInspect={() => onInspectCard?.(card)}
                  onClick={() => {
                    if (gameEnded) return;
                    setExpandedCardId(isExpanded ? null : card.id);
                  }} 
                />

                {isExpanded && (
                  <div className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 zoom-in-95">
                    <div className="rounded-xl border border-brass/30 bg-[#181c20] p-3 shadow-2xl shadow-black/80 backdrop-blur-md">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-brass/60">Choose Action</p>
                      <CardContextMenu
                        card={card}
                        isPlayersTurn={isPlayersTurn}
                        isLoading={isLoading}
                        gameEnded={gameEnded}
                        onPlayAsProperty={() => handlePlayProperty(card.id)}
                        onPlayAsAction={() => handlePlayAction(card.id, (card as any).actionId)}
                        onBankAsMoney={() => handleBankAsMoney(card.id)}
                        onSelectWildcardColor={() => {
                          setWildcardCardId(card.id);
                          setWildcardCardName(card.name);
                        }}
                      />
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute left-1/2 top-full -mt-0.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-brass/30 bg-[#181c20]" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Overlays */}
      {activeWildcardCard && (
        <WildcardColorSelector
          cardName={activeWildcardCard.name}
          allowedColors={activeWildcardCard.colors || []}
          onSelect={(color) => handleWildcardColor(wildcardCardId!, color)}
          onCancel={() => setWildcardCardId(null)}
        />
      )}

      {activeRentCard && (
        <RentTargetSelector
          card={activeRentCard}
          ownedSets={currentPlayer?.properties || []}
          opponents={players.filter(p => p.id !== playerId)}
          hand={currentPlayer?.hand || []}
          actionsRemaining={actionsRemaining}
          initialModifierIds={pendingDTRId ? [pendingDTRId] : []}
          onConfirm={(setId, targetPlayerId, modifierCardIds) => {
            handleRentConfirm(setId, targetPlayerId, modifierCardIds);
            setPendingDTRId(null);
          }}
          onCancel={() => {
            setRentCardId(null);
            setPendingDTRId(null);
          }}
        />
      )}

      {dealBreakerCardId && (
        <DealBreakerTargetSelector
          opponents={players.filter(p => p.id !== playerId)}
          onConfirm={handleDealBreakerConfirm}
          onCancel={() => setDealBreakerCardId(null)}
        />
      )}

      {slyDealCardId && (
        <PropertyCardSelector
          title="Sly Deal: Select Property to Steal"
          players={players.filter(p => p.id !== playerId)}
          onConfirm={handleSlyDealConfirm}
          onCancel={() => setSlyDealCardId(null)}
        />
      )}

      {forcedDealStep === 1 && (
        <PropertyCardSelector
          title="Forced Deal: Select YOUR Property to Swap"
          players={players.filter(p => p.id === playerId)}
          onConfirm={handleForcedDealInitiatorConfirm}
          onCancel={() => {
            setForcedDealCardId(null);
            setForcedDealStep(null);
          }}
        />
      )}

      {forcedDealStep === 2 && (
        <PropertyCardSelector
          title="Forced Deal: Select OPPONENT Property to Take"
          players={players.filter(p => p.id !== playerId)}
          onConfirm={handleForcedDealTargetConfirm}
          onCancel={() => {
            setForcedDealStep(1);
            setForcedDealInitiatorCard(null);
          }}
        />
      )}

      {buildingCardId && buildingType && (
        <BuildingTargetSelector
          type={buildingType}
          propertySets={currentPlayer?.properties || []}
          onConfirm={handleBuildingConfirm}
          onCancel={() => {
            setBuildingCardId(null);
            setBuildingType(null);
          }}
        />
      )}

      {targetActionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-brass/30 bg-[#181c20] p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-brass uppercase tracking-wider">Select Target</h3>
            <div className="space-y-2">
              {players.filter(p => p.id !== playerId).map(p => (
                <button
                  key={p.id}
                  onClick={() => confirmTarget(targetActionId, p.id)}
                  className="w-full rounded-lg bg-white/5 px-4 py-3 text-left font-bold text-white transition hover:bg-brass hover:text-ink"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTargetActionId(null)}
              className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2 font-bold text-white/60 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {doubleRentCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-brass/30 bg-[#181c20] p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-brass uppercase tracking-wider">Select Rent Card to Double</h3>
            
            {cards.filter(c => c.type === CardType.Action && (c as any).actionId === 'rent').length === 0 ? (
              <div className="mb-6">
                <p className="text-sm text-red-400 mb-4">You have no Rent cards in your hand to use with Double The Rent.</p>
                <button
                  onClick={() => {
                    setDoubleRentCardId(null);
                    setPendingDTRId(null);
                  }}
                  className="w-full rounded-lg bg-white/5 py-2 text-white font-bold hover:bg-white/10"
                >
                  Back
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {cards.filter(c => c.type === CardType.Action && (c as any).actionId === 'rent').map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setRentCardId(c.id);
                        setDoubleRentCardId(null);
                      }}
                      className="w-full rounded-lg bg-white/5 px-4 py-3 text-left font-bold text-white transition hover:bg-brass hover:text-ink flex justify-between items-center"
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] opacity-60">VALUE {c.value}M</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setDoubleRentCardId(null);
                    setPendingDTRId(null);
                  }}
                  className="w-full rounded-lg border border-white/10 px-4 py-2 font-bold text-white/60 hover:bg-white/5"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
