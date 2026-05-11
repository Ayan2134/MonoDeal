import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLobbyStore } from '../store/lobbyStore';
import { socket } from './socket';
import { SocketContext } from './SocketContext';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const store = useLobbyStore.getState();

    // Debugging flow: log connection lifecycle events and surface failures to the UI.
    function handleConnect() {
      console.info('[socket] connected', { id: socket.id });
      setIsConnected(true);
      store.clearError();
      // Socket.IO reconnects automatically, but a reconnect receives a new
      // socket.id. We immediately recover the room session using the durable
      // localStorage playerId so refreshes and network blips do not duplicate
      // the same player in the lobby.
      void store.recoverPlayerSession();
    }

    function handleDisconnect(reason?: string) {
      console.info('[socket] disconnected', { reason });
      setIsConnected(false);
    }

    function handleReconnectAttempt(attempt: number) {
      console.info('[socket] reconnect attempt', { attempt });
    }

    function handleReconnectSuccess(attempt: number) {
      console.info('[socket] reconnect success', { attempt, id: socket.id });
    }

    function handleConnectError(error: Error) {
      console.error('[socket] connection error', error);
      store.setError('Socket connection failed. Retrying...');
    }

    function handleReconnectError(error: Error) {
      console.error('[socket] reconnect error', error);
      store.setError('Unable to reconnect to the server.');
    }

    function handleReconnectFailed() {
      console.error('[socket] reconnect failed');
      store.setError('Reconnection attempts failed. Please refresh the page.');
    }

    socket.connect();
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnectSuccess);
    socket.io.on('reconnect_error', handleReconnectError);
    socket.io.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnectSuccess);
      socket.io.off('reconnect_error', handleReconnectError);
      socket.io.off('reconnect_failed', handleReconnectFailed);
    };
  }, []);

  const value = useMemo(() => ({ isConnected }), [isConnected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
