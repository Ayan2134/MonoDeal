import type { ActionCard, Card, PropertyColor } from './cards';
import type { Player } from './players';

export type PropertySet = {
  setId: string;
  color: PropertyColor | 'wild';
  cards: Card[];
  isComplete: boolean;
  houseCard?: Card;
  hotelCard?: Card;
};

export enum TurnPhase {
  Draw = 'draw',
  Action = 'action',
  End = 'end',
}

export type StackEntry = {
  id: string;
  kind: 'action' | 'counter';
  actorId: string;
  actionId: string;
  cardId: string;
  targetEntryId?: string;
  createdAt: number;
};

export type PendingAction = {
  id: string;
  actorId: string;
  actionCard: ActionCard;
  stackEntryId: string;
  enqueuedAt: number;
};

export type GameState = {
  roomId: string;
  version: number;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  actionStack: StackEntry[];
  pendingActions: PendingAction[];
  activeInteractions: unknown[];
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
  gameLogs: Array<{
    id: string;
    timestamp: number;
    type: string;
    message: string;
  }>;
};
