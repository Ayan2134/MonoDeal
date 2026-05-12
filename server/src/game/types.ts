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

export type DeckState = {
  deck: Card[];
  discardPile: Card[];
};
