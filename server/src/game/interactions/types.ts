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
  // If true, the interaction can be countered with just-say-no
  canBeCountered?: boolean;
  // Track counter chain deterministically
  counterStack?: CounterStack;
  targetPropertyColor?: string;
  targetPropertySetId?: string;
  targetPropertyCardId?: string;
  initiatorPropertyCardId?: string;
  // MODIFIERS
  baseAmount?: number;
  activeModifiers?: Array<{
    cardId: string;
    actionId: string;
    multiplier: number;
  }>;
};
