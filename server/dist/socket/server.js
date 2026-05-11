import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { createApp } from '../http/app.js';
import { DISCONNECT_GRACE_MS } from '../rooms/constants.js';
import { registerSocketHandlers } from './events.js';
export function createHttpServer() {
    const app = createApp();
    const httpServer = createServer(app);
    const corsOrigin = env.allowAnyOrigin ? true : env.clientUrls;
    const io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
            credentials: !env.allowAnyOrigin,
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: DISCONNECT_GRACE_MS,
            skipMiddlewares: true,
        },
        transports: ['websocket', 'polling'],
    });
    io.on('connection', (socket) => {
        registerSocketHandlers(io, socket);
    });
    io.engine.on('connection_error', (error) => {
        console.error('[socket] connection_error', {
            message: error.message,
            code: error.code,
            context: error.context,
        });
    });
    return { httpServer, io };
}
