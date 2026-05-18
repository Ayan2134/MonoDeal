import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLobbyStore } from '../store/lobbyStore';
import { socket } from './socket';
import { SocketContext } from './SocketContext';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const store = useLobbyStore.getState();

    // ORCHESTRATION:
    // When the app wakes up or reconnects, we wait for the socket to be stable
    // before triggering a session recovery.
    let stabilizationTimeout: ReturnType<typeof setTimeout> | null = null;

    function triggerRecovery() {
      const currentState = useLobbyStore.getState();
      const hasRoom = !!localStorage.getItem('monodeal_roomId');
      
      if (!hasRoom) return;

      if (currentState.recoveryState === 'idle' || currentState.recoveryState === 'failed' || currentState.recoveryState === 'retrying') {
        console.info('[socket] orchestration: triggering recovery', { 
          state: currentState.recoveryState,
          connected: socket.connected,
          id: socket.id 
        });
        void currentState.recoverPlayerSession();
      } else {
        console.info('[socket] orchestration: recovery skipped (already active)', { state: currentState.recoveryState });
      }
    }

    function handleConnect() {
      console.info('[socket] connected event', { id: socket.id });
      setIsConnected(true);
      store.clearError();
      
      // STABILIZATION DELAY:
      // Especially on mobile Safari, we wait for the transport to be "hot"
      if (stabilizationTimeout) clearTimeout(stabilizationTimeout);
      stabilizationTimeout = setTimeout(triggerRecovery, 800);
    }

    function handleDisconnect(reason?: string) {
      console.info('[socket] disconnected event', { reason });
      setIsConnected(false);
      if (stabilizationTimeout) clearTimeout(stabilizationTimeout);
    }

    function handleReconnectAttempt(attempt: number) {
      console.info('[socket] transport reconnect attempt', { attempt });
    }

    function handleReconnectSuccess(attempt: number) {
      console.info('[socket] transport reconnect success', { attempt, id: socket.id });
    }

    function handleConnectError(error: Error) {
      console.error('[socket] connection error', error);
      // Don't show permanent error yet, lobbyStore handles retries
    }

    // MOBILE / BROWSER WAKE EVENTS
    function handleAppWake() {
      const reason = document.visibilityState === 'visible' ? 'visibilitychange' : 'focus/online';
      console.info(`[socket] app wake detected via ${reason}`, { 
        connected: socket.connected,
        state: useLobbyStore.getState().recoveryState
      });

      if (!socket.connected) {
        socket.connect();
      } else {
        triggerRecovery();
      }
    }

    socket.connect();
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnectSuccess);

    window.addEventListener('visibilitychange', handleAppWake);
    window.addEventListener('focus', handleAppWake);
    window.addEventListener('pageshow', handleAppWake);
    window.addEventListener('online', handleAppWake);

    return () => {
      if (stabilizationTimeout) clearTimeout(stabilizationTimeout);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnectSuccess);

      window.removeEventListener('visibilitychange', handleAppWake);
      window.removeEventListener('focus', handleAppWake);
      window.removeEventListener('pageshow', handleAppWake);
      window.removeEventListener('online', handleAppWake);
    };
  }, []);

  const value = useMemo(() => ({ isConnected }), [isConnected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
