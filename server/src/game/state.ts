import type { Card, PropertyColor } from './types.js';

export enum TurnPhase {
  Draw = 'draw',
  Action = 'action',
  End = 'end',
}

export type PropertySet = {
  color: PropertyColor | 'wild';
  cards: Card[];
  isComplete: boolean;
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
  players: GamePlayer[];
  deck: Card[];
  discardPile: Card[];
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  actionsRemaining: number;
  winner: string | null;
  gameStarted: boolean;
};
