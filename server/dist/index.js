import { env } from './config/env.js';
import { createHttpServer } from './socket/server.js';
const { httpServer } = createHttpServer();
httpServer.listen(env.port, () => {
    console.log(`Monodeal server listening on http://localhost:${env.port}`);
});
