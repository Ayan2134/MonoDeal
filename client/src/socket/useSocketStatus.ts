import { useContext } from 'react';
import { SocketContext } from './SocketContext';

export function useSocketStatus() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocketStatus must be used within SocketProvider');
  }

  return context;
}
