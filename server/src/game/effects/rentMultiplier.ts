import type { EffectHandler } from './types.js';

export const rentMultiplierEffect: EffectHandler = (context) => {
  return { ok: false, error: 'Double The Rent must be played alongside a Rent card, not as a standalone action.' };
};
