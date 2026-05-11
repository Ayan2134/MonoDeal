import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var serverUrl = (_b = env.VITE_SOCKET_URL) !== null && _b !== void 0 ? _b : 'http://localhost:4000';
    return {
        plugins: [react()],
        server: {
            port: 5173,
            proxy: {
                '/api': serverUrl,
            },
        },
    };
});
