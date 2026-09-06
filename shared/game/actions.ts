import type { CardDestination, CardId, PropertyColor } from './cards';

export enum ActionType {
  StartTurn = 'start-turn',
  EndTurn = 'end-turn',
  PlayCard = 'play-card',
  RespondToAction = 'respond-to-action',
  ResolveInteraction = 'resolve-interaction',
  RearrangeProperties = 'rearrange-properties',
  StartGame = 'start-game',
}

export type StartTurnAction = {
  type: ActionType.StartTurn;
};

export type EndTurnAction = {
  type: ActionType.EndTurn;
  discardCardIds?: CardId[];
};

export type PlayCardAction = {
  type: ActionType.PlayCard;
  cardId: CardId;
  destination: CardDestination;
  propertySetColor?: PropertyColor | 'wild';
  targetSetId?: string;
};

export type RearrangePropertiesAction = {
  type: ActionType.RearrangeProperties;
  cardId: CardId;
  targetColor: PropertyColor | 'wild';
  targetSetId: string | 'new';
};

export type EndTurnOnlyAction = EndTurnAction;

export type GameAction =
  | StartTurnAction
  | EndTurnAction
  | PlayCardAction
  | RearrangePropertiesAction;
