import { useState, useEffect } from 'react';
import { useLobbyStore } from '../store/lobbyStore';
import { socket } from '../socket/socket';
import { getPlayerId } from '../session/playerSession';
import { Terminal, Activity, Wifi, WifiOff, X, Bug } from 'lucide-react';

export function DebugOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const room = useLobbyStore((state) => state.room);
  const recoveryState = useLobbyStore((state) => state.recoveryState);
  const attempts = useLobbyStore((state) => state.reconnectAttempts);
  const lastError = useLobbyStore((state) => state.lastRecoveryError);
  const [socketId, setSocketId] = useState(socket.id);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const handleUpdate = () => {
      setSocketId(socket.id);
      setConnected(socket.connected);
    };

    socket.on('connect', handleUpdate);
    socket.on('disconnect', handleUpdate);

    const interval = setInterval(handleUpdate, 1000);

    return () => {
      socket.off('connect', handleUpdate);
      socket.off('disconnect', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-brass/20 text-brass backdrop-blur-md transition hover:bg-brass/40"
      >
        <Bug size={20} />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-lg border border-white/10 bg-black/80 p-2 text-xs font-mono backdrop-blur-md">
        <div className="flex items-center gap-2">
          {connected ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-red-400" />}
          <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
            {connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="text-white/60">
          STATE: <span className="text-brass">{recoveryState.toUpperCase()}</span>
        </div>
        <button onClick={() => setIsMinimized(false)} className="ml-2 rounded p-1 hover:bg-white/10">
          <Activity size={14} />
        </button>
        <button onClick={() => setIsOpen(false)} className="rounded p-1 hover:bg-white/10 text-red-400">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 rounded-xl border border-white/10 bg-[#121418] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-brass uppercase tracking-widest">
          <Terminal size={14} />
          Recovery Diagnostics
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsMinimized(true)} className="rounded p-1 text-white/40 hover:bg-white/10">
            <Activity size={14} />
          </button>
          <button onClick={() => setIsOpen(false)} className="rounded p-1 text-red-400/60 hover:bg-white/10">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-white/5 p-2">
            <div className="text-white/40 uppercase text-[9px] mb-1">Socket Status</div>
            <div className={`font-bold ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
          <div className="rounded bg-white/5 p-2">
            <div className="text-white/40 uppercase text-[9px] mb-1">Recovery State</div>
            <div className="font-bold text-brass">{recoveryState.toUpperCase()}</div>
          </div>
        </div>

        <div className="rounded bg-white/5 p-2">
          <div className="text-white/40 uppercase text-[9px] mb-1">Socket ID</div>
          <div className="truncate text-white/80">{socketId || 'null'}</div>
        </div>

        <div className="rounded bg-white/5 p-2">
          <div className="text-white/40 uppercase text-[9px] mb-1">Session Data</div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-white/30">Player:</span>
              <span className="text-white/70 truncate ml-2">{getPlayerId().slice(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Room ID:</span>
              <span className="text-white/70 truncate ml-2">{room?.roomId.slice(0, 12) || 'NONE'}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Attempts:</span>
              <span className={attempts > 0 ? 'text-amber-400' : 'text-white/70'}>{attempts}</span>
            </div>
          </div>
        </div>

        {lastError && (
          <div className="rounded border border-red-500/20 bg-red-500/5 p-2">
            <div className="text-red-400/60 uppercase text-[9px] mb-1">Last Error</div>
            <div className="text-red-300 leading-relaxed">{lastError}</div>
          </div>
        )}

        <div className="pt-2">
          <button 
            onClick={() => window.location.reload()}
            className="w-full rounded bg-white/5 py-2 text-white/60 transition hover:bg-white/10 active:scale-95"
          >
            Force Page Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
