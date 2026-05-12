import type { Card, PropertyColor } from './types.js';
import type { PendingAction, StackEntry } from './stack.js';
import type { PendingInteraction } from './interactions/types.js';

export enum TurnPhase {
  Draw = 'draw',
  Action = 'action',
  End = 'end',
}

export type PropertySet = {
  setId: string;
  color: PropertyColor | 'wild';
  cards: Card[];
  isComplete: boolean;
  houseCard?: Card;
  hotelCard?: Card;
};

export type GamePlayer = {
  id: string;
  name: string;
  hand: Card[];
  bank: Card[];
  properties: PropertySet[];
  status: 'connected' | 'disconnected';
};

export type GameState = {
  roomId: string;
  // VERSIONING:
  // Incremented after every successful action.
  // Used by clients to detect stale requests and by server to reject outdated actions.
  // Clients receive this version in action acknowledgements and use it to detect
  // which state they're working from. Server rejects actions with mismatched versions.
  version: number;
  // GAME STATE:
  players: GamePlayer[];
  deck: Card[];
  discardPile: Card[];
  actionStack: StackEntry[];
  pendingActions: PendingAction[];
  activeInteractions: PendingInteraction[];
  responseWindow: {
    isOpen: boolean;
    deadlineAt: number | null;
  };
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  actionsRemaining: number;
  winner: string | null;
  gameStarted: boolean;
  gameEnded: boolean;
};
