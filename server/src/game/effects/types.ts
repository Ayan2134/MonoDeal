import type { ActionCard } from '../types.js';
import type { GameState } from '../state.js';

export type EffectId =
  | 'rent'
  | 'rent-multiplier'
  | 'steal-property'
  | 'forced-swap'
  | 'deal-breaker'
  | 'debt-collection'
  | 'house'
  | 'hotel'
  | 'just-say-no'
  | 'birthday-collection'
  | 'pass-go';

export type EffectTargetSelection = {
  playerIds?: string[];
  propertyCardIds?: string[];
  propertySetColors?: Array<string>;
  propertySetIds?: string[];
  modifierCardIds?: string[];
};

export type EffectContext = {
  roomId: string;
  actorId: string;
  card: ActionCard;
  state: GameState;
  targets: EffectTargetSelection;
};

export type EffectResult =
  | {
      ok: true;
      state: GameState;
    }
  | {
      ok: false;
      error: string;
    };

export type EffectHandler = (context: EffectContext) => EffectResult;
