import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../shared/PageHeader';
import { getPlayerName } from '../session/playerSession';
import { useLobbyStore } from '../store/lobbyStore';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { roomCode: inviteRoomCode } = useParams();
  const [searchParams] = useSearchParams();
  const joinRoom = useLobbyStore((state) => state.joinRoom);
  const isLoading = useLobbyStore((state) => state.isLoading);
  const storeError = useLobbyStore((state) => state.error);
  const initialRoomCode = searchParams.get('roomCode') ?? '';
  const initialPlayerName = getPlayerName();
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [roomCode, setRoomCode] = useState(inviteRoomCode ?? initialRoomCode);
  const [error, setError] = useState('');
  const hasAutoAttemptedRef = useRef(false);

  useEffect(() => {
    if (!inviteRoomCode || hasAutoAttemptedRef.current) {
      return;
    }

    hasAutoAttemptedRef.current = true;
    const autoJoinName = playerName.trim() || 'Player';

    void joinRoom({
      // Re-using a stored name lets an invite link behave like a seamless
      // reconnect for returning players. On the server, the same playerId will
      // reclaim the existing seat instead of creating a duplicate player.
      playerName: autoJoinName,
      roomCode: inviteRoomCode,
    }).then((result) => {
      if (result.ok) {
        navigate(`/lobby/${result.room.roomId}`, { state: result.room });
      }
    });
  }, [inviteRoomCode, joinRoom, navigate, playerName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!playerName.trim() || !roomCode.trim()) {
      setError('Enter your name and room code.');
      return;
    }

    const result = await joinRoom({
      playerName: playerName.trim(),
      roomCode: roomCode.trim().toUpperCase(),
    });

    if (result.ok) {
      navigate(`/lobby/${result.room.roomId}`, { state: result.room });
    }
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={inviteRoomCode ? 'Invite link' : 'Take a seat'}
        title={inviteRoomCode ? `Join room ${inviteRoomCode}` : 'Join a room'}
        description={
          inviteRoomCode
            ? 'This invite link will try to place you back into the same room session automatically.'
            : 'Enter a room code from the host to join the waiting lobby.'
        }
      />
      <form onSubmit={handleSubmit} className="grid max-w-md gap-5 rounded-lg border border-white/10 bg-[#181c20] p-6 shadow-2xl shadow-black/20">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/80">Player name</span>
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#181c20] px-4 py-3 text-white outline-none ring-brass/40 transition focus:ring-4"
            placeholder="Jordan"
          />
        </label>
        {inviteRoomCode ? (
          <div className="rounded-md border border-white/10 bg-[#181c20] px-4 py-3 text-sm text-white/70">
            Invite link detected. We&apos;ll auto-join with your saved session when possible.
          </div>
        ) : (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/80">Room code</span>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              className="w-full rounded-md border border-white/10 bg-[#181c20] px-4 py-3 font-mono uppercase tracking-widest text-white outline-none ring-brass/40 transition focus:ring-4"
              placeholder="AB12CD"
              maxLength={6}
            />
          </label>
        )}
        {error || storeError ? <p className="text-sm text-red-300">{error || storeError}</p> : null}
        <button
          className="w-full rounded-md bg-brass px-5 py-3 font-semibold text-ink transition hover:bg-[#e6bc72] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Joining...' : inviteRoomCode ? 'Join From Invite' : 'Join Room'}
        </button>
      </form>
    </section>
  );
}
