import { useMemo, useState } from 'react';
import type { PendingInteraction, Card } from '../types';
import { CardView } from '../CardView';
import { useGameStore } from '../../store/gameStore';

export function InteractionOverlay({
  interaction,
  playerId,
  roomId,
  onInspectCard,
}: {
  interaction: PendingInteraction;
  playerId: string;
  roomId: string;
  onInspectCard: (card: Card) => void;
}) {
  const { gameState, resolveInteraction, isLoading } = useGameStore();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const player = useMemo(() => gameState?.players.find(p => p.id === playerId), [gameState, playerId]);
  const initiator = useMemo(() => gameState?.players.find(p => p.id === interaction.initiatorPlayerId), [gameState, interaction.initiatorPlayerId]);

  if (!player) return null;

  const justSayNoCards = useMemo(() => player.hand.filter(c => (c as any).actionId === 'just-say-no'), [player.hand]);
  
  const isCounterResponder = interaction.counterStack?.stackState === 'active' && 
                             interaction.counterStack.currentResponderPlayerId === playerId;
  const isInitiator = interaction.initiatorPlayerId === playerId;
  const counterDepth = interaction.counterStack?.counterActions.length || 0;

  const allAssets = useMemo(() => {
    const assets: { card: Card; location: 'bank' | 'property' | 'building'; setId?: string }[] = [];
    player.bank.forEach(card => {
      if (card.type === 'wildcard' && (card.value ?? 0) <= 0) return;
      assets.push({ card, location: 'bank' });
    });
    player.properties.forEach(set => {
      set.cards.forEach(card => {
        if (card.type === 'wildcard' && (card.value ?? 0) <= 0) return;
        assets.push({ card, location: 'property', setId: set.setId });
      });
      if (set.houseCard) assets.push({ card: set.houseCard, location: 'building', setId: set.setId });
      if (set.hotelCard) assets.push({ card: set.hotelCard, location: 'building', setId: set.setId });
    });
    return assets;
  }, [player]);

  const totalValue = useMemo(() => {
    return allAssets.reduce((sum, asset) => sum + (asset.card.value ?? 0), 0);
  }, [allAssets]);

  const selectedValue = useMemo(() => {
    return allAssets
      .filter(a => selectedCardIds.includes(a.card.id))
      .reduce((sum, asset) => sum + (asset.card.value ?? 0), 0);
  }, [allAssets, selectedCardIds]);

  const amountDue = interaction.amountDue ?? 0;
  const targetMet = selectedValue >= amountDue || (totalValue < amountDue && selectedValue === totalValue);

  const findSetForCard = (cardId: string) =>
    player.properties.find((propertySet) =>
      propertySet.cards.some((card) => card.id === cardId)
      || propertySet.houseCard?.id === cardId
      || propertySet.hotelCard?.id === cardId,
    );

  const toggleSelection = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const ownerSet = findSetForCard(cardId);
      const selected = new Set(prev);
      const isSelected = selected.has(cardId);

      if (!ownerSet) {
        if (isSelected) selected.delete(cardId);
        else selected.add(cardId);
        return [...selected];
      }

      const propertyIds = ownerSet.cards.map((card) => card.id);
      const houseId = ownerSet.houseCard?.id;
      const hotelId = ownerSet.hotelCard?.id;

      if (isSelected) {
        selected.delete(cardId);
        const stillPayingProperty = propertyIds.some((id) => selected.has(id));
        if (!stillPayingProperty && cardId !== hotelId) {
          if (houseId) selected.delete(houseId);
          if (hotelId) selected.delete(hotelId);
        }
        if (cardId === houseId && hotelId) {
          selected.delete(hotelId);
        }
      } else {
        selected.add(cardId);
        if (propertyIds.includes(cardId) || cardId === houseId) {
          if (houseId) selected.add(houseId);
          if (hotelId) selected.add(hotelId);
        }
      }

      return [...selected];
    });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await resolveInteraction({
      roomId,
      interactionId: interaction.interactionId,
      resolution: {
        action: 'payment',
        cardIds: selectedCardIds,
      },
    });
    setIsSubmitting(false);
  };

  const handleJustSayNo = async (cardId: string, targetModifierCardId?: string) => {
    setIsSubmitting(true);
    await resolveInteraction({
      roomId,
      interactionId: interaction.interactionId,
      resolution: {
        action: 'just-say-no',
        cardId,
        targetModifierCardId,
      } as any,
    });
    setIsSubmitting(false);
  };

  const handleAcceptCounter = async () => {
    setIsSubmitting(true);
    await resolveInteraction({
      roomId,
      interactionId: interaction.interactionId,
      resolution: {
        action: 'accept-counter',
      },
    });
    setIsSubmitting(false);
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    await resolveInteraction({
      roomId,
      interactionId: interaction.interactionId,
      resolution: {
        action: 'accept',
      },
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-brass/30 bg-[#181c20] p-6 shadow-2xl">
        {isCounterResponder ? (
          <>
            <h2 className="mb-2 text-2xl font-bold text-red-400">Action Countered!</h2>
            <div className="mb-6">
              <p className="mb-2 text-white/80">
                {isInitiator 
                  ? `The target played Just Say No to cancel ${interaction.counterStack?.targetModifierCardId ? 'Double The Rent' : 'your action'}.`
                  : `The initiator played Just Say No to counter your Just Say No.`}
              </p>
              <p className="text-sm font-medium text-red-300">
                Counter Chain Depth: {counterDepth}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleAcceptCounter}
                disabled={isSubmitting || isLoading}
                className="rounded-lg border border-white/20 px-6 py-2 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {isInitiator ? 'Accept Cancellation' : 'Accept'}
              </button>
              {justSayNoCards.length > 0 && justSayNoCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleJustSayNo(card.id)}
                  disabled={isSubmitting || isLoading}
                  className="rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  Counter with Just Say No
                </button>
              ))}
            </div>
          </>
        ) : (
          interaction.interactionType === 'steal-property' ? (
            <>
              <h2 className="mb-2 text-2xl font-bold text-red-500">Sly Deal!</h2>
              <p className="mb-6 text-white/80">
                <span className="font-bold text-red-400">{initiator?.name ?? 'Someone'}</span> is stealing one of your property cards!
              </p>
              
              <div className="mb-8 flex justify-center">
                {(() => {
                  // Find the target card in the player's properties
                  const targetCard = player.properties
                    .flatMap(s => s.cards)
                    .find(c => c.id === interaction.targetPropertyCardId);
                  return targetCard ? (
                    <CardView 
                      card={targetCard} 
                      onInspect={() => onInspectCard(targetCard)}
                    />
                  ) : <p className="text-white/40 italic">Target card not found</p>;
                })()}
              </div>

              <div className="flex justify-end gap-3">
                {interaction.canBeCountered && justSayNoCards.length > 0 && justSayNoCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleJustSayNo(card.id)}
                    disabled={isSubmitting || isLoading}
                    className="rounded-lg border border-red-400/50 bg-red-500/10 px-6 py-2 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Play Just Say No
                  </button>
                ))}
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting || isLoading}
                  className="rounded-lg border border-white/20 bg-white/5 px-6 py-2 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Yield Property
                </button>
              </div>
            </>
          ) : interaction.interactionType === 'forced-swap' ? (
            <>
              <h2 className="mb-2 text-2xl font-bold text-red-500">Forced Deal!</h2>
              <p className="mb-6 text-white/80">
                <span className="font-bold text-red-400">{initiator?.name ?? 'Someone'}</span> is swapping one of their properties for yours!
              </p>
              
              <div className="mb-8 flex items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">You Give</span>
                  {(() => {
                    const targetCard = player.properties
                      .flatMap(s => s.cards)
                      .find(c => c.id === interaction.targetPropertyCardId);
                    return targetCard ? (
                      <CardView 
                        card={targetCard} 
                        onInspect={() => onInspectCard(targetCard)}
                      />
                    ) : <p className="text-white/40 italic">Card not found</p>;
                  })()}
                </div>
                <div className="text-2xl text-white/20">⇄</div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">You Receive</span>
                  {(() => {
                    const initiatorCard = initiator?.properties
                      .flatMap(s => s.cards)
                      .find(c => c.id === interaction.initiatorPropertyCardId);
                    return initiatorCard ? (
                      <CardView 
                        card={initiatorCard} 
                        onInspect={() => onInspectCard(initiatorCard)}
                      />
                    ) : <p className="text-white/40 italic">Card not found</p>;
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {interaction.canBeCountered && justSayNoCards.length > 0 && justSayNoCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleJustSayNo(card.id)}
                    disabled={isSubmitting || isLoading}
                    className="rounded-lg border border-red-400/50 bg-red-500/10 px-6 py-2 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Play Just Say No
                  </button>
                ))}
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting || isLoading}
                  className="rounded-lg border border-white/20 bg-white/5 px-6 py-2 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Accept Swap
                </button>
              </div>
            </>
          ) : interaction.interactionType === 'deal-breaker' ? (
            <>
              <h2 className="mb-2 text-2xl font-bold text-red-500">
                Deal Breaker!
              </h2>
              <p className="mb-6 text-white/80">
                <span className="font-bold text-red-400">{initiator?.name ?? 'Someone'}</span> has played a Deal Breaker to steal your complete <span className="font-bold capitalize text-white">{interaction.targetPropertyColor?.replace('-', ' ')}</span> set!
              </p>
              
              <div className="mb-8 flex flex-wrap justify-center gap-3">
                {(() => {
                  const targetSet = player.properties.find(s => s.setId === interaction.targetPropertySetId);
                  return targetSet?.cards.map(card => (
                    <CardView 
                      key={card.id} 
                      card={card} 
                      onInspect={() => onInspectCard(card)}
                    />
                  )) || <p className="text-white/40 italic">Set not found</p>;
                })()}
              </div>

              <div className="flex justify-end gap-3">
                {interaction.canBeCountered && justSayNoCards.length > 0 && justSayNoCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleJustSayNo(card.id)}
                    disabled={isSubmitting || isLoading}
                    className="rounded-lg border border-red-400/50 bg-red-500/10 px-6 py-2 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Play Just Say No
                  </button>
                ))}
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting || isLoading}
                  className="rounded-lg border border-white/20 px-6 py-2 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {isSubmitting ? 'Accepting...' : 'Yield Property Set'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-bold text-brass">
                Payment Required
              </h2>
              <p className="mb-6 text-white/80">
                <span className="font-bold text-brass">{initiator?.name ?? 'Someone'}</span> requested payment. You owe <span className="font-bold text-white">{amountDue}M</span>.
                Select cards to pay. Paying a property from a set with a House or Hotel includes those buildings.
              </p>

              <div className="mb-6 rounded-lg bg-black/40 p-4">
                <div className="flex justify-between text-sm">
                  <span>Required: {amountDue}M</span>
                  <span>Selected: {selectedValue}M</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full transition-all ${targetMet ? 'bg-emerald-500' : 'bg-brass'}`}
                    style={{ width: `${Math.min(100, (selectedValue / Math.max(amountDue, 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {allAssets.length === 0 ? (
                  <p className="text-white/50">You have no assets. You can just confirm.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {allAssets.map(({ card }) => {
                      const isSelected = selectedCardIds.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => toggleSelection(card.id)}
                          className={`cursor-pointer transition-transform hover:scale-105 ${
                            isSelected ? 'ring-2 ring-emerald-500 rounded-lg scale-105' : 'opacity-80'
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
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                {interaction.canBeCountered && justSayNoCards.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {/* Option to JSN specific modifiers if they exist */}
                    {interaction.activeModifiers?.map((mod, idx) => (
                      <button
                        key={mod.cardId}
                        onClick={() => handleJustSayNo(justSayNoCards[0]!.id, mod.cardId)}
                        disabled={isSubmitting || isLoading}
                        className="rounded-lg border border-sky-400/50 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
                      >
                        JSN Double Rent {interaction.activeModifiers!.length > 1 ? `#${idx + 1}` : ''}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handleJustSayNo(justSayNoCards[0]!.id)}
                      disabled={isSubmitting || isLoading}
                      className="rounded-lg border border-red-400/50 bg-red-500/10 px-6 py-2 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Play Just Say No
                    </button>
                  </div>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={!targetMet || isSubmitting || isLoading}
                  className="rounded-lg bg-brass px-6 py-2 font-semibold text-ink transition hover:bg-[#e6bc72] disabled:opacity-50"
                >
                  {isSubmitting ? 'Paying...' : 'Confirm Payment'}
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
