import { createDeck, shuffleDeck } from './deck.js';
import type { GamePlayer, GameState } from './state.js';
import { TurnPhase } from './state.js';
import { dealStartingHands } from './deal.js';
import type { Room } from '../rooms/types.js';

const STARTING_HAND_SIZE = 5;
const STARTING_ACTIONS = 3;

function createGamePlayers(room: Room): GamePlayer[] {
  return room.players.map((player) => ({
    id: player.playerId,
    name: player.name,
    hand: [],
    bank: [],
    properties: [],
    status: player.status,
  }));
}

function chooseRandomFirstPlayer(players: GamePlayer[], rng: () => number) {
  if (players.length === 0) {
    return null;
  }
  const index = Math.floor(rng() * players.length);
  return players[index]?.id ?? null;
}

// Initialization is centralized here so the room manager can stay focused on
// lifecycle and validation, while game setup remains deterministic and testable.
export function initializeGameState(room: Room, rng: () => number = Math.random): GameState {
  const deck = shuffleDeck(createDeck(), rng);
  const gamePlayers = createGamePlayers(room);
  const dealt = dealStartingHands(gamePlayers, deck, STARTING_HAND_SIZE);

  return {
    roomId: room.roomId,
    version: 0,
    players: dealt.players,
    deck: dealt.deck,
    discardPile: [],
    actionStack: [],
    pendingActions: [],
    activeInteractions: [],
    responseWindow: {
      isOpen: false,
      deadlineAt: null,
    },
    currentTurnPlayerId: chooseRandomFirstPlayer(dealt.players, rng),
    turnPhase: TurnPhase.Draw,
    actionsRemaining: STARTING_ACTIONS,
    winner: null,
    gameStarted: true,
    gameEnded: false,
  };
}
