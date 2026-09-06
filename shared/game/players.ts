import type { Card } from './cards';
import type { PropertySet } from './state';

export type PlayerConnectionStatus = 'connected' | 'disconnected';

export type Player = {
  id: string;
  name: string;
  hand: Card[];
  bank: Card[];
  properties: PropertySet[];
  status: PlayerConnectionStatus;
};
