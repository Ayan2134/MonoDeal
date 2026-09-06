/**
 * ACTION TYPES AND DEFINITIONS
 *
 * Defines all possible game actions and their payloads.
 * Used for type-safe action processing and validation.
 *
 * ACTION FLOW:
 * 1. Client sends action with a stable actionId (retries reuse the same id)
 * 2. Server builds an Action object, keeping the client actionId when valid
 * 3. Processor dedupes, validates version, and applies atomically
 * 4. Version incremented
 * 5. Acknowledgement sent to client with new version
 */

import type { Card, PropertyColor } from './types.js';
import type { PendingAction, StackEntry } from './stack.js';
import type { CardDestination } from './playCard.js';
import type { EffectTargetSelection } from './effects/types.js';
import type { InteractionResolutionPayload } from './interactions/types.js';

/**
 * Unique action identifier for deduplication.
 * Clients generate this so network retries of the same click reuse one id.
 */
export type ActionId = string & { readonly __brand: 'ActionId' };

const ACTION_ID_PATTERN = /^[a-zA-Z0-9:_-]{8,80}$/;

export function createActionId(): ActionId {
  return (`${Date.now()}-${Math.random().toString(36).slice(2, 11)}` as unknown) as ActionId;
}

export function parseClientActionId(value: string | undefined): ActionId | null {
  if (!value || !ACTION_ID_PATTERN.test(value)) {
    return null;
  }
  return value as ActionId;
}

/**
 * Action version tracking
 * Tracks which state version an action was based on
 * Server rejects actions from outdated versions
 */
export type ActionVersion = {
  // State version when client submitted the action
  clientVersion: number;
  // State version when server processes the action
  serverVersion: number;
};

/**
 * Result of action processing
 * Returned to client with acknowledgement
 */
export type ActionResult = {
  success: boolean;
  error?: string;
  // New state version after action applied (only if success)
  newVersion?: number;
  // Actions are processed in order, track sequence for diagnostics
  sequence?: number;
};

/**
 * All possible action types in the game
 */
export enum ActionType {
  // Turn actions
  StartTurn = 'start-turn',
  EndTurn = 'end-turn',

  // Card actions
  PlayCard = 'play-card',
  RespondToAction = 'respond-to-action',
  ResolveInteraction = 'resolve-interaction',
  RearrangeProperties = 'rearrange-properties',

  // Game lifecycle
  StartGame = 'start-game',
}

/**
 * Base action structure
 * All actions inherit from this
 */
export type BaseAction = {
  // Unique action ID (client-generated when present, otherwise server fallback)
  id: ActionId;
  // Action type
  type: ActionType;
  // Player who performed action
  playerId: string;
  // Room the action is in
  roomId: string;
  // State version client was working from
  clientVersion: number;
  // Timestamp when action created
  timestamp: number;
};

/**
 * StartTurn action
 */
export type StartTurnAction = BaseAction & {
  type: ActionType.StartTurn;
};

/**
 * EndTurn action
 */
export type EndTurnAction = BaseAction & {
  type: ActionType.EndTurn;
  discardCardIds?: string[];
};

/**
 * PlayCard action
 */
export type PlayCardAction = BaseAction & {
  type: ActionType.PlayCard;
  cardId: string;
  destination: CardDestination;
  propertySetColor?: PropertyColor | 'wild';
  targetSetId?: string;
  targets?: EffectTargetSelection;
};

/**
 * RearrangeProperties action
 */
export type RearrangePropertiesAction = BaseAction & {
  type: ActionType.RearrangeProperties;
  cardId: string;
  targetColor: PropertyColor | 'wild';
  targetSetId: string | 'new';
};

/**
 * RespondToAction action
 */
export type RespondToActionAction = BaseAction & {
  type: ActionType.RespondToAction;
  cardId: string;
  targetStackEntryId?: string;
};

/**
 * StartGame action
 */
export type StartGameAction = BaseAction & {
  type: ActionType.StartGame;
};

/**
 * ResolveInteraction action
 */
export type ResolveInteractionAction = BaseAction & {
  type: ActionType.ResolveInteraction;
  interactionId: string;
  resolution: InteractionResolutionPayload;
};

/**
 * Union of all possible actions
 */
export type GameAction =
  | StartTurnAction
  | EndTurnAction
  | PlayCardAction
  | RespondToActionAction
  | ResolveInteractionAction
  | RearrangePropertiesAction
  | StartGameAction;

/**
 * Create action from client request.
 * Uses the client's actionId when it is well-formed so retries dedupe.
 */
export function createAction<T extends GameAction>(
  type: T['type'],
  playerId: string,
  roomId: string,
  clientVersion: number,
  payload: Omit<T, keyof BaseAction>,
  clientActionId?: string,
): T {
  return {
    id: parseClientActionId(clientActionId) ?? createActionId(),
    type,
    playerId,
    roomId,
    clientVersion,
    timestamp: Date.now(),
    ...payload,
  } as T;
}

/**
 * Validate action version
 * Rejects actions from outdated client state
 *
 * VALIDATION RULES:
 * - clientVersion must match or be close to serverVersion
 * - If versions differ, could indicate network lag or out-of-order actions
 * - Reject if client is too far behind (e.g., > 5 versions)
 * - Allow small differences due to network jitter
 */
export function isActionVersionValid(clientVersion: number, serverVersion: number, toleranceVersions: number = 2): boolean {
  // Client can be same version or slightly behind due to network lag
  // but shouldn't be ahead (indicates action from future)
  const versionDiff = serverVersion - clientVersion;
  return versionDiff >= 0 && versionDiff <= toleranceVersions;
}
