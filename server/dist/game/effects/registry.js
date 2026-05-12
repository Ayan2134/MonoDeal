import { rentEffect } from './rent.js';
import { rentMultiplierEffect } from './rentMultiplier.js';
import { stealPropertyEffect } from './stealProperty.js';
import { forcedSwapEffect } from './forcedSwap.js';
import { dealBreakerEffect } from './dealBreaker.js';
import { debtCollectionEffect } from './debtCollection.js';
import { houseEffect } from './house.js';
import { hotelEffect } from './hotel.js';
import { justSayNoEffect } from './justSayNo.js';
import { birthdayCollectionEffect } from './birthday.js';
import { passGoEffect } from './passGo.js';
const registry = new Map([
    ['rent', rentEffect],
    ['rent-multiplier', rentMultiplierEffect],
    ['steal-property', stealPropertyEffect],
    ['forced-swap', forcedSwapEffect],
    ['deal-breaker', dealBreakerEffect],
    ['debt-collection', debtCollectionEffect],
    ['house', houseEffect],
    ['hotel', hotelEffect],
    ['just-say-no', justSayNoEffect],
    ['birthday-collection', birthdayCollectionEffect],
    ['pass-go', passGoEffect],
]);
export function getEffectHandler(effectId) {
    return registry.get(effectId) ?? null;
}
