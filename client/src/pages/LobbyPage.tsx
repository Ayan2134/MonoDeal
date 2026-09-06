import { Check, Copy, LogOut, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { env } from '../config/env';
import { getPlayerId } from '../session/playerSession';
import { useLobbyStore } from '../store/lobbyStore';
import { PageHeader } from '../shared/PageHeader';
import { GameTable } from '../game/GameTable';
import type { RoomSummary } from '../socket/socket';

export function LobbyPage() {
  const { roomId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const playerId = getPlayerId();
  const room = useLobbyStore((state) => state.room);
  const error = useLobbyStore((state) => state.error);
  const isLoading = useLobbyStore((state) => state.isLoading);
  const setInitialRoom = useLobbyStore((state) => state.setInitialRoom);
  const listenForRoomUpdates = useLobbyStore((state) => state.listenForRoomUpdates);
  const reconnectPlayer = useLobbyStore((state) => state.reconnectPlayer);
  const leaveRoom = useLobbyStore((state) => state.leaveRoom);
  const startGame = useLobbyStore((state) => state.startGame);
  const [didCopy, setDidCopy] = useState(false);

  useEffect(() => {
    const routeRoom = location.state as RoomSummary | null;

    if (routeRoom?.roomId === roomId) {
      setInitialRoom(routeRoom);
    }

    listenForRoomUpdates();
    void reconnectPlayer(roomId);
  }, [listenForRoomUpdates, location.state, reconnectPlayer, roomId, setInitialRoom]);

  async function handleLeaveRoom() {
    await leaveRoom(roomId);
    navigate('/');
  }

  async function handleStartGame() {
    await startGame(roomId);
  }

  async function handleCopyInvite() {
    if (!inviteUrl) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setDidCopy(true);
      window.setTimeout(() => setDidCopy(false), 1500);
    } catch (error) {
      console.error('Failed to copy invite link', error);
    }
  }

  const isHost = room?.hostId === playerId;
  const inviteOrigin = env.appUrl;
  const inviteUrl = room ? `${inviteOrigin}${room.invitePath}` : '';
  const recoveryState = useLobbyStore((state) => state.recoveryState);
  const reconnectAttempts = useLobbyStore((state) => state.reconnectAttempts);
  const lastRecoveryError = useLobbyStore((state) => state.lastRecoveryError);

  if (room?.status === 'in_progress') {
    return <GameTable roomId={room.roomId} />;
  }

  // Specialized view for lost/failed connection
  if (!room && !isLoading && recoveryState === 'failed') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full bg-red-500/10 p-6 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"/><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Connection Failed</h2>
        <p className="mt-2 max-w-sm text-white/60">
          {lastRecoveryError || "We couldn't connect to the room. It may have expired or the server is unavailable."}
        </p>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => reconnectPlayer(roomId, true)}
            className="rounded-md bg-brass px-6 py-3 font-bold text-ink transition hover:bg-[#e6bc72]"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="rounded-md border border-white/10 px-6 py-3 font-medium transition hover:bg-white/5"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isReconnecting = recoveryState === 'reconnecting' || recoveryState === 'retrying';

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={isReconnecting ? `Recovery Attempt ${reconnectAttempts + 1}` : "Waiting lobby"}
        title={isReconnecting ? "Restoring Session" : `Room ${room?.roomCode ?? '------'}`}
        description={isReconnecting 
          ? "We're automatically reconnecting you to your game. Please wait..." 
          : "Share the room code, then the host starts the game. First to 3 complete property sets wins."
        }
      />
      {error ? <p className="rounded-md border border-red-400/20 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      
      {isReconnecting && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brass border-t-transparent mb-4" />
          <p className="text-brass font-medium animate-pulse">
            Connecting to server...
          </p>
        </div>
      )}

      {!isReconnecting && room && (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-lg border border-white/10 bg-[#181c20] p-6 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Players</h2>
              <span className="text-sm text-white/60">
                {room?.players.length ?? 0}/{room?.maxPlayers ?? '-'} seated
              </span>
            </div>
            <div className="space-y-3">
              {room?.players.length ? (
                room.players.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                  >
                    <span>
                      <span className="font-medium">{player.name}</span>
                      {player.playerId === playerId ? <span className="ml-2 text-xs text-white/40">You</span> : null}
                    </span>
                    <span className="flex flex-wrap items-center justify-end gap-2 text-sm">
                      {player.isHost ? (
                        <span className="rounded-full border border-brass/30 bg-brass/10 px-2 py-1 text-xs font-semibold text-brass">
                          Host
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          player.status === 'connected' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {player.status}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-white/60">No live lobby data yet. Create or join a room to populate this list.</p>
              )}
            </div>
          </div>
          <aside className="rounded-lg border border-white/10 bg-[#181c20] p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-semibold">Room code</h2>
            <p className="mt-4 font-mono text-4xl font-bold tracking-widest text-brass">{room?.roomCode ?? '------'}</p>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Share this code or the invite link. Need at least two players to start.
            </p>
            {inviteUrl ? (
              <div className="mt-4 rounded-md bg-white/5 p-3">
                <p className="break-all text-sm text-white/70">{inviteUrl}</p>
                <button
                  onClick={handleCopyInvite}
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                  type="button"
                >
                  {didCopy ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {didCopy ? 'Copied' : 'Copy Invite Link'}
                </button>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {!room ? null : isHost ? (
                <button
                  onClick={handleStartGame}
                  className="inline-flex items-center gap-2 rounded-md bg-brass px-4 py-2 font-semibold text-ink transition hover:bg-[#e6bc72] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                  type="button"
                >
                  <Play className="h-4 w-4" />
                  Start Game
                </button>
              ) : (
                <span className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/50">Waiting for host</span>
              )}
              <button
                onClick={handleLeaveRoom}
                className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 font-medium transition hover:bg-white/10"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Leave Room
              </button>
            </div>
            <Link to="/" className="mt-4 inline-flex rounded-md border border-white/15 px-4 py-2 font-medium hover:bg-white/10">
              Back Home
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
