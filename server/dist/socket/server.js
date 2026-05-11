import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { createApp } from '../http/app.js';
import { DISCONNECT_GRACE_MS } from '../rooms/constants.js';
import { registerSocketHandlers } from './events.js';
export function createHttpServer() {
    const app = createApp();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: env.clientOrigins,
            methods: ['GET', 'POST'],
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: DISCONNECT_GRACE_MS,
            skipMiddlewares: true,
        },
    });
    io.on('connection', (socket) => {
        registerSocketHandlers(io, socket);
    });
    return { httpServer, io };
}
