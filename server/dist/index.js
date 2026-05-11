import { env } from './config/env.js';
import { createHttpServer } from './socket/server.js';
const { httpServer } = createHttpServer();
const PORT = process.env.PORT || 4000;
const portNumber = typeof PORT === 'string' ? Number(PORT) : PORT;
process.on('unhandledRejection', (reason) => {
    console.error('[server] unhandled rejection', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[server] uncaught exception', error);
});
httpServer.listen(portNumber, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`[server] NODE_ENV=${env.nodeEnv}`);
    console.log(`[server] CLIENT_URL=${env.allowAnyOrigin ? '*' : env.clientUrls.join(',')}`);
});
