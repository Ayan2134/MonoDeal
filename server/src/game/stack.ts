import { randomUUID } from 'node:crypto';
import { resolveActionEffect } from './effects/engine.js';
import type { EffectTargetSelection } from './effects/types.js';
import type { ActionCard, Card } from './types.js';
import type { GamePlayer, GameState } from './state.js';

const RESPONSE_WINDOW_MS = 10_000;

export type StackEntry = {
  id: string;
  kind: 'action' | 'counter';
  actorId: string;
  actionId: string;
  cardId: string;
  targetEntryId?: string;
  targets?: EffectTargetSelection;
  createdAt: number;
};

export type PendingAction = {
  id: string;
  actorId: string;
  actionCard: ActionCard;
  targets?: EffectTargetSelection;
  stackEntryId: string;
  enqueuedAt: number;
};

export type StackSnapshot = {
  roomId: string;
  actionStack: StackEntry[];
  pendingCount: number;
  responseOpen: boolean;
  responseDeadlineAt: number | null;
};

function findPlayer(state: GameState, playerId: string) {
  return state.players.find((player) => player.id === playerId) ?? null;
}

function removeCardFromHand(player: GamePlayer, cardId: string): { card: Card | null; player: GamePlayer } {
  const cardIndex = player.hand.findIndex((card) => card.id === cardId);

  if (cardIndex < 0) {
    return { card: null, player };
  }

  const nextHand = [...player.hand];
  const [card] = nextHand.splice(cardIndex, 1);

  return {
    card: card ?? null,
    player: {
      ...player,
      hand: nextHand,
    },
  };
}

export function isResponseEligibleAction(_actionId: string) {
  // Targeted actions (rent, debt, birthday, steal, swap, deal-breaker) open
  // interaction UIs immediately. House and hotel are self-plays on your own
  // set, so they also apply immediately — Just Say No is for actions played
  // against you. The generic stack window is unused.
  return false;
}

export function toStackSnapshot(state: GameState): StackSnapshot {
  return {
    roomId: state.roomId,
    actionStack: state.actionStack,
    pendingCount: state.pendingActions.length,
    responseOpen: state.responseWindow.isOpen,
    responseDeadlineAt: state.responseWindow.deadlineAt,
  };
}

export function enqueuePendingAction(
  state: GameState,
  actorId: string,
  card: ActionCard,
  targets?: EffectTargetSelection,
  now = Date.now(),
): GameState {
  const actionEntry: StackEntry = {
    id: randomUUID(),
    kind: 'action',
    actorId,
    actionId: card.actionId,
    cardId: card.id,
    targets,
    createdAt: now,
  };

  const pending: PendingAction = {
    id: randomUUID(),
    actorId,
    actionCard: card,
    targets,
    stackEntryId: actionEntry.id,
    enqueuedAt: now,
  };

  return {
    ...state,
    pendingActions: [...state.pendingActions, pending],
    actionStack: [...state.actionStack, actionEntry],
    responseWindow: {
      isOpen: true,
      deadlineAt: now + RESPONSE_WINDOW_MS,
    },
  };
}

export function respondWithJustSayNo(
  state: GameState,
  playerId: string,
  justSayNoCardId: string,
  targetEntryId?: string,
  now = Date.now(),
): { ok: true; state: GameState } | { ok: false; error: string } {
  if (!state.responseWindow.isOpen || state.actionStack.length === 0) {
    return { ok: false, error: 'No action is currently awaiting responses.' };
  }

  const player = findPlayer(state, playerId);

  if (!player) {
    return { ok: false, error: 'Player not found.' };
  }

  const removed = removeCardFromHand(player, justSayNoCardId);

  if (!removed.card) {
    return { ok: false, error: 'Counter card not found in hand.' };
  }

  if (removed.card.type !== 'action' || removed.card.actionId !== 'just-say-no') {
    return { ok: false, error: 'Only Just Say No can be used as a counter.' };
  }

  const resolvedTarget = targetEntryId ?? state.actionStack[state.actionStack.length - 1]?.id;

  if (!resolvedTarget) {
    return { ok: false, error: 'No target found for counter.' };
  }

  const targetExists = state.actionStack.some((entry) => entry.id === resolvedTarget);

  if (!targetExists) {
    return { ok: false, error: 'Counter target does not exist in stack.' };
  }

  const counterEntry: StackEntry = {
    id: randomUUID(),
    kind: 'counter',
    actorId: playerId,
    actionId: 'just-say-no',
    cardId: removed.card.id,
    targetEntryId: resolvedTarget,
    createdAt: now,
  };

  const updatedPlayers = state.players.map((currentPlayer) => {
    if (currentPlayer.id !== playerId) {
      return currentPlayer;
    }

    return removed.player;
  });

  return {
    ok: true,
    state: {
      ...state,
      players: updatedPlayers,
      discardPile: [...state.discardPile, removed.card],
      actionStack: [...state.actionStack, counterEntry],
      responseWindow: {
        isOpen: true,
        deadlineAt: now + RESPONSE_WINDOW_MS,
      },
    },
  };
}

function isEntryCountered(entryId: string, stack: StackEntry[], memo = new Map<string, boolean>()): boolean {
  if (memo.has(entryId)) {
    return memo.get(entryId) ?? false;
  }

  const directCounters = stack.filter((entry) => entry.kind === 'counter' && entry.targetEntryId === entryId);

  if (directCounters.length === 0) {
    memo.set(entryId, false);
    return false;
  }

  const effectiveCounters = directCounters.filter((counter) => !isEntryCountered(counter.id, stack, memo));
  const isCountered = effectiveCounters.length % 2 === 1;
  memo.set(entryId, isCountered);
  return isCountered;
}

export function resolvePendingStack(state: GameState): { ok: true; state: GameState } | { ok: false; error: string } {
  if (state.pendingActions.length === 0) {
    return {
      ok: true,
      state: {
        ...state,
        actionStack: [],
        responseWindow: {
          isOpen: false,
          deadlineAt: null,
        },
      },
    };
  }

  const pending = state.pendingActions[0];

  if (!pending) {
    return { ok: true, state };
  }

  const cancelled = isEntryCountered(pending.stackEntryId, state.actionStack);

  let nextState: GameState = {
    ...state,
    pendingActions: state.pendingActions.slice(1),
    actionStack: [],
    responseWindow: {
      isOpen: false,
      deadlineAt: null,
    },
  };

  if (!cancelled) {
    const effectResult = resolveActionEffect(nextState, pending.actorId, pending.actionCard, pending.targets);

    if (!effectResult.ok) {
      return effectResult;
    }

    nextState = effectResult.state;
  }

  return {
    ok: true,
    state: nextState,
  };
}
