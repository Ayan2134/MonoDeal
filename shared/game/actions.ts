import type { CardId } from './cards';

export enum ActionType {
  DrawCard = 'draw-card',
  PlayCard = 'play-card',
  BankCard = 'bank-card',
  PlayProperty = 'play-property',
  EndTurn = 'end-turn',
}

export type DrawCardAction = {
  type: ActionType.DrawCard;
};

export type PlayCardAction = {
  type: ActionType.PlayCard;
  cardId: CardId;
};

export type BankCardAction = {
  type: ActionType.BankCard;
  cardId: CardId;
};

export type PlayPropertyAction = {
  type: ActionType.PlayProperty;
  cardId: CardId;
  targetSetColor?: string;
};

export type EndTurnAction = {
  type: ActionType.EndTurn;
};

export type GameAction =
  | DrawCardAction
  | PlayCardAction
  | BankCardAction
  | PlayPropertyAction
  | EndTurnAction;
