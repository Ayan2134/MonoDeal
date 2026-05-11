import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { env } from '../config/env.js';

export function createApp() {
  const app = express();
  const preferredClientOrigin = env.publicAppUrl;

  app.set('trust proxy', true);

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startTime = Date.now();
    response.on('finish', () => {
      const durationMs = Date.now() - startTime;
      console.info('[http]', {
        method: request.method,
        path: request.originalUrl,
        status: response.statusCode,
        durationMs,
      });
    });
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (env.allowAnyOrigin || !origin || env.clientUrls.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS.`));
      },
    }),
  );
  app.use(express.json());

  app.get('/', (_request: Request, response: Response) => {
    response.type('html').send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Monodeal Server</title>
          <style>
            :root {
              color-scheme: dark;
              font-family: ui-sans-serif, system-ui, sans-serif;
            }
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background:
                radial-gradient(circle at top, rgba(216, 166, 87, 0.18), transparent 30%),
                linear-gradient(180deg, #182028 0%, #101418 100%);
              color: #f7faf9;
            }
            main {
              width: min(720px, calc(100vw - 32px));
              border: 1px solid rgba(255, 255, 255, 0.12);
              background: rgba(24, 28, 32, 0.92);
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
            }
            h1 {
              margin: 0 0 12px;
              font-size: clamp(2rem, 5vw, 3rem);
            }
            p {
              margin: 0 0 16px;
              color: rgba(247, 250, 249, 0.74);
              line-height: 1.6;
            }
            a {
              color: #d8a657;
            }
            code {
              font-family: ui-monospace, SFMono-Regular, monospace;
              color: #f7faf9;
            }
            ul {
              padding-left: 18px;
              color: rgba(247, 250, 249, 0.88);
            }
          </style>
        </head>
        <body>
          <main>
            <h1>Monodeal server is running</h1>
            <p>This is the multiplayer backend for Monodeal. The playable UI lives on the frontend dev server.</p>
            <p>Open <a href="${preferredClientOrigin}">${preferredClientOrigin}</a> for the app, or check <a href="/api/health"><code>/api/health</code></a> for a health response.</p>
            <ul>
              <li>Socket.IO is attached to this server.</li>
              <li>Room and player sessions are managed in memory.</li>
              <li>Persistent browser identity uses a custom <code>playerId</code>, not <code>socket.id</code>.</li>
            </ul>
          </main>
        </body>
      </html>
    `);
  });

  app.get('/api/health', (_request: Request, response: Response) => {
    response.json({ ok: true, service: 'monodeal-server' });
  });

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/status', (_request: Request, response: Response) => {
    response.json({
      ok: true,
      service: 'monodeal-server',
      frontend: preferredClientOrigin,
      socketIo: true,
    });
  });

  app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
    console.error('[http] unhandled error', { message: error.message });
    response.status(500).json({ ok: false, error: 'Unexpected server error.' });
  });

  return app;
}
