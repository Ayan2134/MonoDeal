import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrimaryLink } from '../shared/PrimaryLink';
import { useLobbyStore } from '../store/lobbyStore';
import { getCurrentRoom } from '../session/playerSession';

export function HomePage() {
  const navigate = useNavigate();
  const room = useLobbyStore((state) => state.room);
  const recoveryState = useLobbyStore((state) => state.recoveryState);
  const recoverPlayerSession = useLobbyStore((state) => state.recoverPlayerSession);
  const [hasStoredSession, setHasStoredSession] = useState(false);

  useEffect(() => {
    const session = getCurrentRoom();
    setHasStoredSession(!!session);
  }, []);

  const handleResume = async () => {
    const result = await recoverPlayerSession();
    if (result?.ok) {
      navigate(`/lobby/${result.room.roomId}`);
    }
  };

  return (
    <section className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-brass">Monopoly Deal</p>
        <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">Monodeal</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
          Play Monopoly Deal with friends in real time. Bank cash, steal sets, charge rent — first to 3 complete property sets wins.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {hasStoredSession && !room && (
            <button
              onClick={handleResume}
              disabled={recoveryState === 'reconnecting'}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {recoveryState === 'reconnecting' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Resuming...
                </>
              ) : (
                'Resume Active Game'
              )}
            </button>
          )}
          <PrimaryLink to="/create">Create Room</PrimaryLink>
          <PrimaryLink to="/join" variant="ghost">
            Join Room
          </PrimaryLink>
        </div>
        {recoveryState === 'failed' && hasStoredSession && (
          <p className="mt-4 text-sm text-red-400">
            Failed to resume session. The room might have expired or you were removed.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-white/10 bg-[#181c20] p-6 shadow-2xl shadow-black/30">
        <div className="grid grid-cols-3 gap-3">
          {['M', 'O', 'N', 'O', 'D', 'E', 'A', 'L', '+'].map((card, index) => (
            <div
              key={`${card}-${index}`}
              className="flex aspect-[3/4] items-center justify-center rounded-md border border-white/10 bg-felt text-2xl font-bold text-white shadow-lg"
            >
              {card}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
