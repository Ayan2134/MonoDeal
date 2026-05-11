import type { Card, PropertyCard } from './cards';

export type PlayerConnectionStatus = 'connected' | 'disconnected';

export type Player = {
  id: string;
  name: string;
  hand: Card[];
  bank: Card[];
  properties: PropertyCard[];
  status: PlayerConnectionStatus;
};
