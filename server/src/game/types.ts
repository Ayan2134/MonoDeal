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

export type CardBase = {
  id: CardId;
  type: CardType;
  name: string;
};

export type PropertyCard = CardBase & {
  type: CardType.Property;
  color: PropertyColor;
};

export type MoneyCard = CardBase & {
  type: CardType.Money;
  value: number;
};

export type ActionCard = CardBase & {
  type: CardType.Action;
  actionId: string;
  value?: number;
};

export type WildcardCard = CardBase & {
  type: CardType.Wildcard;
  colors: PropertyColor[];
};

export type Card = PropertyCard | MoneyCard | ActionCard | WildcardCard;

export type DeckState = {
  deck: Card[];
  discardPile: Card[];
};
