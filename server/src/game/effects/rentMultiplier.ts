import type { EffectHandler } from './types.js';

export const rentMultiplierEffect: EffectHandler = (context) => {
  return { ok: true, state: context.state };
};
