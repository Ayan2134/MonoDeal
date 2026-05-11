import { env } from './config/env.js';
import { createHttpServer } from './socket/server.js';

const { httpServer } = createHttpServer();

process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandled rejection', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[server] uncaught exception', error);
});

httpServer.listen(env.port, '0.0.0.0', () => {
  console.log(`[server] Monodeal listening on 0.0.0.0:${env.port} (${env.nodeEnv})`);
});
