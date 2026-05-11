import { createContext } from 'react';

export type SocketContextValue = {
  isConnected: boolean;
};

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);
