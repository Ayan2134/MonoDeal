import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../shared/PageHeader';
import { getCurrentRoom, getPlayerName } from '../session/playerSession';
import { useLobbyStore } from '../store/lobbyStore';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { roomCode: inviteRoomCode } = useParams();
  const [searchParams] = useSearchParams();
  const joinRoom = useLobbyStore((state) => state.joinRoom);
  const recoverPlayerSession = useLobbyStore((state) => state.recoverPlayerSession);
  const isLoading = useLobbyStore((state) => state.isLoading);
  const storeError = useLobbyStore((state) => state.error);
  const initialRoomCode = searchParams.get('roomCode') ?? '';
  const [playerName, setPlayerName] = useState(getPlayerName());
  const [roomCode, setRoomCode] = useState(inviteRoomCode ?? initialRoomCode);
  const [error, setError] = useState('');
  const [isResuming, setIsResuming] = useState(false);
  const hasTriedResumeRef = useRef(false);

  // Returning players who already sat in this room can resume without retyping a name.
  // New invite visitors always choose a name first — no silent "Player" join.
  useEffect(() => {
    if (!inviteRoomCode || hasTriedResumeRef.current) {
      return;
    }

    const session = getCurrentRoom();
    if (!session || session.roomCode.toUpperCase() !== inviteRoomCode.toUpperCase()) {
      return;
    }

    hasTriedResumeRef.current = true;
    setIsResuming(true);

    void recoverPlayerSession().then((result) => {
      setIsResuming(false);
      if (result?.ok) {
        navigate(`/lobby/${result.room.roomId}`, { state: result.room });
      }
    });
  }, [inviteRoomCode, navigate, recoverPlayerSession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmedName = playerName.trim();
    const trimmedCode = (inviteRoomCode ?? roomCode).trim().toUpperCase();

    if (!trimmedName) {
      setError('Enter your name to join.');
      return;
    }

    if (!trimmedCode) {
      setError('Enter a room code.');
      return;
    }

    const result = await joinRoom({
      playerName: trimmedName,
      roomCode: trimmedCode,
    });

    if (result.ok) {
      navigate(`/lobby/${result.room.roomId}`, { state: result.room });
    }
  }

  if (isResuming) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brass border-t-transparent" />
        <p className="text-white/70">Resuming your seat in room {inviteRoomCode}…</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={inviteRoomCode ? 'Invite link' : 'Take a seat'}
        title={inviteRoomCode ? `Join room ${inviteRoomCode}` : 'Join a room'}
        description={
          inviteRoomCode
            ? 'Choose a display name, then join the lobby.'
            : 'Enter your name and a room code from the host.'
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
            autoFocus
            maxLength={24}
          />
        </label>
        {inviteRoomCode ? (
          <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">Room code</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-brass">{inviteRoomCode}</p>
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
          {isLoading ? 'Joining...' : 'Join Room'}
        </button>
      </form>
    </section>
  );
}
