import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
function resolveSocketUrl(fileEnv) {
    return (process.env.SOCKET_URL ||
        fileEnv.SOCKET_URL ||
        fileEnv.VITE_SOCKET_URL ||
        'http://localhost:4000');
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var fileEnv = loadEnv(mode, process.cwd(), '');
    var socketUrl = resolveSocketUrl(fileEnv);
    return {
        plugins: [react()],
        define: {
            __MONODEAL_SOCKET_URL__: JSON.stringify(socketUrl),
        },
        server: {
            port: 5173,
            proxy: {
                '/api': socketUrl,
            },
        },
    };
});
