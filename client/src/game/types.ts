export enum CardType {
  Property = 'property',
  Money = 'money',
  Action = 'action',
  Wildcard = 'wildcard',
}

export enum PropertyColor {
  Brown = 'brown',
  LightBlue = 'light-blue',
  Pink = 'pink',
  Orange = 'orange',
  Red = 'red',
  Yellow = 'yellow',
  Green = 'green',
  DarkBlue = 'dark-blue',
  Rail = 'rail',
  Utility = 'utility',
}

export type CardId = string;

export type CardBase = {
  id: CardId;
  type: CardType;
  name: string;
  value: number;
};

export type PropertyCard = CardBase & {
  type: CardType.Property;
  color: PropertyColor;
};

export type MoneyCard = CardBase & {
  type: CardType.Money;
};

export type ActionCard = CardBase & {
  type: CardType.Action;
  actionId: string;
  actionCategory?: 'payment' | 'property' | 'counter' | 'utility' | 'modifier' | 'building';
  supportedColors?: PropertyColor[];
  affectsAllPlayers?: boolean;
  wildcardRent?: boolean;
  attachable?: boolean;
  modifierTarget?: string;
};

export type WildcardCard = CardBase & {
  type: CardType.Wildcard;
  colors: PropertyColor[];
};

export type Card = PropertyCard | MoneyCard | ActionCard | WildcardCard;

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

export enum TurnPhase {
  Draw = 'draw',
  Action = 'action',
  End = 'end',
}

export type TurnUpdate = {
  roomId: string;
  currentTurnPlayerId: string | null;
  actionsRemaining: number;
  turnPhase: TurnPhase;
};

export type EffectTargetSelection = {
  playerIds?: string[];
  propertyCardIds?: string[];
  propertySetColors?: Array<string>;
  propertySetIds?: string[];
  modifierCardIds?: string[];
};

export type InteractionType = 
  | 'payment'
  | 'property-selection'
  | 'property-swap'
  | 'steal-property'
  | 'forced-swap'
  | 'deal-breaker';

export type PaymentResolution = {
  action: 'payment';
  cardIds: string[];
};

export type PropertySelectionResolution = {
  action: 'property-selection';
  propertyCardId: string;
};

export type JustSayNoResolution = {
  action: 'just-say-no';
  cardId: string;
  targetModifierCardId?: string;
};

export type AcceptCounterResolution = {
  action: 'accept-counter';
};

export type DealBreakerResolution = {
  action: 'accept';
};

export type InteractionResolutionPayload = 
  | PaymentResolution
  | PropertySelectionResolution
  | JustSayNoResolution
  | AcceptCounterResolution
  | DealBreakerResolution;

export type CounterAction = {
  actionId: string;
  playerId: string;
  cardId: string;
  timestamp: number;
};

export type CounterStack = {
  stackId: string;
  rootAction: string;
  targetModifierCardId?: string;
  counterActions: CounterAction[];
  currentResponderPlayerId: string;
  responseDeadline: number;
  stackState: 'active' | 'resolved';
};

export type PendingInteraction = {
  interactionId: string;
  interactionType: InteractionType;
  initiatorPlayerId: string;
  targetPlayerIds: string[];
  amountDue?: number;
  requiredResponseType: 'payment' | 'property' | 'swap' | 'none';
  createdAt: number;
  expiresAt: number | null;
  canBeCountered?: boolean;
  counterStack?: CounterStack;
  targetPropertyColor?: string;
  targetPropertySetId?: string;
  targetPropertyCardId?: string;
  initiatorPropertyCardId?: string;
  baseAmount?: number;
  activeModifiers?: Array<{
    cardId: string;
    actionId: string;
    multiplier: number;
  }>;
};

export type GameState = {
  roomId: string;
  players: GamePlayer[];
  deck: Card[];
  discardPile: Card[];
  activeInteractions: PendingInteraction[];
  currentTurnPlayerId: string | null;
  turnPhase: TurnPhase;
  actionsRemaining: number;
  winner: string | null;
  gameStarted: boolean;
  gameEnded: boolean;
  // STATE VERSIONING
  // Incremented after each successful action
  // Used to detect stale client requests
  version: number;
};

export enum CardDestination {
  Bank = 'bank',
  Property = 'property',
  Discard = 'discard',
}

export type BaseGamePayload = {
  playerId: string;
  roomId: string;
  clientVersion: number;
};

export type EndTurnPayload = BaseGamePayload & {
  discardCardIds?: string[];
};

export type PlayCardPayload = {
  playerId: string;
  roomId: string;
  cardId: string;
  destination: CardDestination;
  propertySetColor?: PropertySet['color'];
  targetSetId?: string;
  targets?: EffectTargetSelection;
  clientVersion: number;
};

export type RearrangePropertiesPayload = {
  playerId: string;
  roomId: string;
  cardId: string;
  targetColor: string;
  targetSetId: string;
  clientVersion: number;
};

export type GameStateResult =
  | {
      ok: true;
      gameState: GameState;
      turn: TurnUpdate;
    }
  | {
      ok: false;
      error: string;
    };
