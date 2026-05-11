import type { Card } from './cards';
import type { Player } from './players';

export type PropertySet = {
  color: string;
  cards: Card[];
  isComplete: boolean;
};

export enum TurnPhase {
  Draw = 'draw',
  Action = 'action',
  End = 'end',
}

export type GameState = {
  roomId: string;
  players: Player[];
  deck: Card[];
  discardPile: Card[];
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  actionsRemaining: number;
  winner: string | null;
  gameStarted: boolean;
};
