import { AlertCircle, Loader2, Users } from 'lucide-react';
import type { RoomSummary } from '../../socket/socket';

interface PausedRecoveryOverlayProps {
  room: RoomSummary;
}

export function PausedRecoveryOverlay({ room }: PausedRecoveryOverlayProps) {
  const connectedPlayers = room.players.filter(p => p.status === 'connected');
  const disconnectedPlayers = room.players.filter(p => p.status === 'disconnected');
  const progress = (connectedPlayers.length / room.players.length) * 100;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/95 backdrop-blur-md">
      <div className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-brass/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brass/10 text-brass border-2 border-brass/30 shadow-[0_0_30px_rgba(197,163,101,0.2)]">
              <AlertCircle size={40} />
            </div>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white uppercase italic">
          Game Paused
        </h1>
        <p className="mb-8 text-white/60">
          The server recently restarted. We are waiting for all players to reconnect to resume the authoritative state.
        </p>

        {/* Reconnect Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-white/40">
              <Users size={16} />
              Reconnection Progress
            </span>
            <span className="font-bold text-brass">
              {connectedPlayers.length} / {room.players.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div 
              className="h-full bg-brass transition-all duration-700 ease-out shadow-[0_0_15px_rgba(197,163,101,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Player List */}
        <div className="grid gap-3 text-left">
          {room.players.map(player => (
            <div 
              key={player.playerId}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                player.status === 'connected' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${
                  player.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'
                }`} />
                <span className="font-medium">{player.name}</span>
              </div>
              <span className="text-xs uppercase tracking-widest font-bold">
                {player.status === 'connected' ? 'Reconnected' : 'Waiting...'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-white/30 text-sm italic">
          <Loader2 className="animate-spin" size={16} />
          Authoritative snapshot synchronization in progress
        </div>
      </div>
    </div>
  );
}
