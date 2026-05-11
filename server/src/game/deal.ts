import type { Card } from './types.js';
import type { GamePlayer } from './state.js';

// Deal helpers are pure and return new data so game state stays server-authoritative.
export function dealCards(deck: Card[], count: number) {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, deck: remaining };
}

export function dealStartingHands(players: GamePlayer[], deck: Card[], cardsPerPlayer: number) {
  const updatedPlayers = players.map((player) => ({ ...player, hand: [...player.hand] }));
  let remainingDeck = deck;

  for (let round = 0; round < cardsPerPlayer; round += 1) {
    for (const player of updatedPlayers) {
      const dealt = dealCards(remainingDeck, 1);
      remainingDeck = dealt.deck;
      if (dealt.drawn[0]) {
        player.hand.push(dealt.drawn[0]);
      }
    }
  }

  return { players: updatedPlayers, deck: remainingDeck };
}
