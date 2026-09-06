# Monodeal

Multiplayer Monopoly Deal in the browser. First player to complete **3 property sets** wins.

React + Vite client, Express + Socket.IO server. The server owns the rules.

## Structure

```text
monodeal/
  client/   React + Vite + Tailwind table
  server/   Express + Socket.IO + game engine
  shared/   Canonical TypeScript shapes (keep aligned with client and server)
```

## Requirements

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
npm run dev
```

The client runs at `http://localhost:5173` and proxies API requests to the server at `http://localhost:4000`.

## Scripts

```bash
npm run dev        # Run client and server together
npm run build      # Build both apps
npm run start      # Start the compiled server
npm run typecheck  # Type-check client and server
npm run lint       # Lint the client
```

## How a game works

- Host creates a room and shares the 6-character code or invite link.
- 2 or more players join. Host starts the game.
- Official 106-card deck. Each player is dealt 5 cards.
- On your turn: draw 2, then take up to 3 actions (bank money, lay property, play an action).
- Hand limit is 7 at end of turn. Discard the extras.
- Rent, birthday, debt, Sly Deal, Forced Deal, and Deal Breaker can be paid or cancelled with Just Say No.
- Houses and hotels go on complete color sets only — not railroads or utilities.

## Environment

Client variables must use the `VITE_` prefix.

```bash
# client/.env
VITE_SOCKET_URL=http://localhost:4000
VITE_APP_URL=http://192.168.1.4:5173
```

Set `VITE_APP_URL` to the laptop's LAN URL when you want copied invite links to work on other devices on the same Wi-Fi.

```bash
# server/.env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

For fallback local ports, `CLIENT_ORIGIN` can be a comma-separated list.

Optional Supabase keys on the server persist in-progress rooms across restarts.

## Disconnect grace period

If a player drops (refresh, network blip, closed tab):

- They keep their seat, hand, and properties for **10 minutes**.
- If it is their turn and they stay disconnected for **30 seconds**, the server ends that turn so the table does not stall.
- Reconnect with the same browser `playerId` (stored in `localStorage`) to resume.

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel + Render configuration.

## Socket Events

Client to server:

- `create-room`, `join-room`, `reconnect-player`, `leave-room`, `start-game`
- `start-turn`, `end-turn`, `play-card`, `rearrange-properties`
- `resolve-interaction`, `respond-to-action`

Server to client:

- `room-updated`, `room-error`
- `game-updated`, `turn-updated`, `game-state-sync`
- `player-reconnected`, `player-disconnected`
- `game-ended`, `winner-announced`
