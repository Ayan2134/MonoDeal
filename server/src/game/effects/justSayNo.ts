import type { EffectHandler } from './types.js';

export const justSayNoEffect: EffectHandler = (context) => {
  return { ok: true, state: context.state };
};
