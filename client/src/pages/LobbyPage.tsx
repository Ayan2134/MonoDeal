import { Check, Copy, LogOut, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { env } from '../config/env';
import { getPlayerId } from '../session/playerSession';
import { useLobbyStore } from '../store/lobbyStore';
import { PageHeader } from '../shared/PageHeader';
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
  const inviteOrigin = env.publicAppUrl || window.location.origin;
  const inviteUrl = room ? `${inviteOrigin}${room.invitePath}` : '';

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Waiting lobby"
        title={`Room ${room?.roomCode ?? '------'}`}
        description="Players can gather here before game rules and table state are introduced."
      />
      {error ? <p className="rounded-md border border-red-400/20 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p> : null}
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
            Share this code with friends. Game setup, deck state, and player actions can be layered in next.
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
                disabled={isLoading || room?.status === 'started'}
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
    </section>
  );
}
