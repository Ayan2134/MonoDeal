/** Table-side card types. Keep aligned with shared/game/cards.ts and server/src/game/types.ts. */
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

export type CardMetadata = {
  description?: string;
  gameplayDescription?: string;
  rulesText?: string;
  officialRulesText?: string;
  instructions?: string;
  rentProgression?: number[];
  setSize?: number;
  houseBonusEligible?: boolean;
  propertyInfo?: string;
  wildcardInfo?: string;
  attachmentInfo?: string;
};

export type CardBase = {
  id: CardId;
  type: CardType;
  name: string;
  value: number;
  metadata?: CardMetadata;
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
  assignedColor?: PropertyColor;
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

export type GameLogType =
  | 'turn_start'
  | 'turn_end'
  | 'card_played'
  | 'payment'
  | 'rent'
  | 'property_stolen'
  | 'just_say_no'
  | 'draw'
  | 'discard'
  | 'set_completed'
  | 'winner';

export type GameLogEntry = {
  id: string;
  timestamp: number;
  type: GameLogType;
  actorPlayerId?: string;
  targetPlayerId?: string;
  message: string;
  metadata?: Record<string, any>;
};

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
  // STATE VERSIONING
  // Incremented after each successful action
  // Used to detect stale client requests
  version: number;
  gameLogs: GameLogEntry[];
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
  actionId?: string;
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
  actionId?: string;
};

export type RearrangePropertiesPayload = {
  playerId: string;
  roomId: string;
  cardId: string;
  targetColor: string;
  targetSetId: string;
  clientVersion: number;
  actionId?: string;
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
