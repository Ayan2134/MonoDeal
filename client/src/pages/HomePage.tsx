import { PrimaryLink } from '../shared/PrimaryLink';

export function HomePage() {
  return (
    <section className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-brass">Multiplayer card table</p>
        <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl">Monodeal</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
          A clean real-time foundation for creating rooms, joining friends, and preparing a card-game lobby.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryLink to="/create">Create Room</PrimaryLink>
          <PrimaryLink to="/join" variant="ghost">
            Join Room
          </PrimaryLink>
        </div>
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
