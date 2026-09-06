import type { GameState, GamePlayer, PropertySet } from '../state.js';
import { createNewSet, recomputePropertySets } from '../property.js';
import type { PaymentResolution } from './types.js';
import type { Card, PropertyColor } from '../types.js';

export function calculateCardValue(card: Card): number {
  if (card.type === 'money') return card.value;
  if (card.type === 'action') return card.value ?? 0;
  if (card.type === 'property') return card.value;
  if (card.type === 'wildcard') return card.value;
  return 0;
}

function clonePlayer(player: GamePlayer): GamePlayer {
  return {
    ...player,
    bank: [...player.bank],
    hand: [...player.hand],
    properties: player.properties.map((set) => ({
      ...set,
      cards: [...set.cards],
    })),
  };
}

function setBuildingCards(set: PropertySet): Card[] {
  return [set.houseCard, set.hotelCard].filter((card): card is Card => Boolean(card));
}

function collectPayableAssets(player: GamePlayer): Map<string, { card: Card; location: 'bank' | 'property' | 'building' }> {
  const assets = new Map<string, { card: Card; location: 'bank' | 'property' | 'building' }>();

  for (const card of player.bank) {
    assets.set(card.id, { card, location: 'bank' });
  }

  for (const set of player.properties) {
    for (const card of set.cards) {
      assets.set(card.id, { card, location: 'property' });
    }
    for (const building of setBuildingCards(set)) {
      assets.set(building.id, { card: building, location: 'building' });
    }
  }

  return assets;
}

/** If you pay a property off a built set, the house/hotel must go with it. Paying a house also takes the hotel. */
function expandPaymentWithRequiredBuildings(player: GamePlayer, cardIds: string[]): string[] {
  const selected = new Set(cardIds);

  for (const set of player.properties) {
    const payingProperty = set.cards.some((card) => selected.has(card.id));
    const payingHouse = Boolean(set.houseCard && selected.has(set.houseCard.id));

    if (payingProperty || payingHouse) {
      if (set.houseCard) selected.add(set.houseCard.id);
      if (set.hotelCard) selected.add(set.hotelCard.id);
    }
  }

  return [...selected];
}

export function getTotalPlayerAssetValue(player: GamePlayer): number {
  let total = 0;
  for (const asset of collectPayableAssets(player).values()) {
    total += calculateCardValue(asset.card);
  }
  return total;
}

export function validatePayment(state: GameState, playerId: string, amountDue: number, resolution: PaymentResolution): { ok: true; valuePaid: number; cards: Card[] } | { ok: false; error: string } {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { ok: false, error: 'Player not found' };

  const totalAssets = getTotalPlayerAssetValue(player);
  const requiredAmount = Math.min(amountDue, totalAssets);

  // If the player has 0 assets, the required amount is 0, they can just pay nothing.
  if (requiredAmount === 0 && resolution.cardIds.length === 0) {
    return { ok: true, valuePaid: 0, cards: [] };
  }

  const expandedCardIds = expandPaymentWithRequiredBuildings(player, resolution.cardIds);
  const allPlayerAssets = collectPayableAssets(player);
  const cardsToPay: Card[] = [];
  let valuePaid = 0;

  for (const cardId of expandedCardIds) {
    const asset = allPlayerAssets.get(cardId);
    if (!asset) {
      return { ok: false, error: `Card ${cardId} is not owned by the player or is not an asset on the board` };
    }
    valuePaid += calculateCardValue(asset.card);
    cardsToPay.push(asset.card);
  }

  if (valuePaid < requiredAmount) {
    return { ok: false, error: `Insufficient payment: required ${requiredAmount}M, provided ${valuePaid}M` };
  }

  return { ok: true, valuePaid, cards: cardsToPay };
}

export function applyPayment(state: GameState, payerId: string, payeeId: string, cards: Card[]): GameState {
  const nextState: GameState = {
    ...state,
    discardPile: [...state.discardPile],
    players: state.players.map((player) => clonePlayer(player)),
  };

  const payer = nextState.players.find((player) => player.id === payerId);
  const payee = nextState.players.find((player) => player.id === payeeId);
  if (!payer || !payee) {
    return nextState;
  }

  const paidIds = new Set(cards.map((card) => card.id));

  payer.bank = payer.bank.filter((card) => !paidIds.has(card.id));
  payer.properties = payer.properties.map((set) => ({
    ...set,
    cards: set.cards.filter((card) => !paidIds.has(card.id)),
    houseCard: set.houseCard && paidIds.has(set.houseCard.id) ? undefined : set.houseCard,
    hotelCard: set.hotelCard && paidIds.has(set.hotelCard.id) ? undefined : set.hotelCard,
  }));

  for (const card of cards) {
    if (card.type === 'property' || card.type === 'wildcard') {
      const assignedColor = card.type === 'wildcard' ? card.assignedColor : undefined;
      const propColor = card.type === 'property' ? card.color : assignedColor ?? card.colors[0];
      if (!propColor) continue;

      let targetSet = payee.properties.find((set) => set.color === propColor && !set.isComplete);
      if (!targetSet) {
        targetSet = createNewSet(propColor as PropertyColor);
        payee.properties.push(targetSet);
      }
      targetSet.cards.push(card);
      continue;
    }

    payee.bank.push(card);
  }

  const recomputedPayer = recomputePropertySets(payer, nextState.discardPile);
  const recomputedPayee = recomputePropertySets(payee, nextState.discardPile);

  nextState.players = nextState.players.map((player) => {
    if (player.id === payerId) return recomputedPayer;
    if (player.id === payeeId) return recomputedPayee;
    return player;
  });

  return nextState;
}
