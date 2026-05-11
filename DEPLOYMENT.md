# Deployment Guide

This guide covers production deployment for Monodeal.

## Architecture

- Client: Vite + React app deployed to Vercel (or any static host).
- Server: Express + Socket.IO deployed to Render (or any Node host) with WebSocket support.

## Environment Variables

Client (Vercel Project Settings or .env.production):

```
VITE_SOCKET_URL=https://api.your-domain.com
VITE_PUBLIC_APP_URL=https://app.your-domain.com
```

Server (Render Environment):

```
NODE_ENV=production
PORT=4000
CLIENT_ORIGIN=https://app.your-domain.com
PUBLIC_APP_URL=https://app.your-domain.com
```

Notes:
- `CLIENT_ORIGIN` can be a comma-separated list. Use `*` only for temporary debugging.
- `PUBLIC_APP_URL` is used by the server landing page for the frontend link.

## Vercel (Frontend)

1. Import the repository into Vercel.
2. Ensure build command is `npm run build --workspace client`.
3. Output directory: `client/dist`.
4. Set the client environment variables above.
5. Deploy.

## Render (Backend)

1. Create a new Web Service from the repo.
2. Build command: `npm install && npm run build --workspace server`.
3. Start command: `npm run start --workspace server`.
4. Set the server environment variables above.
5. Deploy.

## Production Validation

- Open the app URL and create a room.
- Join from a second device or browser.
- Confirm reconnects after refresh (Socket.IO connection recovery).
- Validate invite links open the Join flow.
- Check server logs for socket connect/disconnect and room updates.
