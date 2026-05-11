import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobbyStore } from '../store/lobbyStore';
import { PageHeader } from '../shared/PageHeader';
import { getPlayerName } from '../session/playerSession';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const createRoom = useLobbyStore((state) => state.createRoom);
  const isLoading = useLobbyStore((state) => state.isLoading);
  const storeError = useLobbyStore((state) => state.error);
  const [playerName, setPlayerName] = useState(getPlayerName());
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Enter a player name to host a room.');
      return;
    }

    const result = await createRoom({ playerName: playerName.trim(), maxPlayers });

    if (result.ok) {
      navigate(`/lobby/${result.room.roomId}`, { state: result.room });
    }
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Host table"
        title="Create a room"
        description="Start a private lobby and share the generated room code with other players."
      />
      <form onSubmit={handleSubmit} className="max-w-md space-y-5 rounded-lg border border-white/10 bg-[#181c20] p-6 shadow-2xl shadow-black/20">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/80">Player name</span>
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#181c20] px-4 py-3 text-white outline-none ring-brass/40 transition focus:ring-4"
            placeholder="Avery"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/80">Max players</span>
          <select
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(Number(event.target.value))}
            className="w-full rounded-md border border-white/10 bg-[#181c20] px-4 py-3 text-white outline-none ring-brass/40 transition focus:ring-4"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((count) => (
              <option key={count} value={count}>
                {count} players
              </option>
            ))}
          </select>
        </label>
        {error || storeError ? <p className="text-sm text-red-300">{error || storeError}</p> : null}
        <button
          className="w-full rounded-md bg-brass px-5 py-3 font-semibold text-ink transition hover:bg-[#e6bc72] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </section>
  );
}
