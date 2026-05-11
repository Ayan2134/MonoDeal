# Monodeal

Monodeal is a full-stack multiplayer web app foundation for a card game. It uses React, Vite, TypeScript, Tailwind, Express, and Socket.IO in a simple monorepo.

## Structure

```text
monodeal/
  client/   React + Vite + Tailwind app
  server/   Express + Socket.IO API
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

## Production

See the deployment guide in [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel + Render configuration, environment variables, and validation steps.

## Current App

- Home page
- Create Room page
- Join Room page
- Lobby page
- Socket.IO connection boilerplate
- Room lifecycle placeholders without game logic
- Persistent browser `playerId` stored in `localStorage`
- Authoritative Socket.IO room management
- Join by room code or invite link
- Reconnect after refresh without creating duplicate players

## Socket Events

Client to server:

- `create-room`
- `join-room`
- `reconnect-player`
- `leave-room`
- `start-game`

Server to client:

- `room-updated`
- `room-error`

This project intentionally does not implement card-game rules yet. The server currently provides connection handling and room/lobby scaffolding so future multiplayer features can build on a clean boundary.
