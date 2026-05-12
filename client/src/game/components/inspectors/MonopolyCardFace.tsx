import React from 'react';
import type { Card } from '../../types';
import { PropertyCardFace } from './PropertyCardFace';
import { ActionCardFace } from './ActionCardFace';
import { WildcardFace } from './WildcardFace';
import { RentCardFace } from './RentCardFace';
import { MoneyCardFace } from './MoneyCardFace';

export function MonopolyCardFace({ card }: { card: Card }) {
  switch (card.type) {
    case 'property':
      return <PropertyCardFace card={card as any} />;
    case 'wildcard':
      return <WildcardFace card={card as any} />;
    case 'money':
      return <MoneyCardFace card={card as any} />;
    case 'action': {
      const actionCard = card as any;
      if (actionCard.actionId === 'rent') {
        return <RentCardFace card={actionCard} />;
      }
      return <ActionCardFace card={actionCard} />;
    }
    default:
      return <div className="w-full h-full bg-white text-black p-4">Unknown Card Type</div>;
  }
}
