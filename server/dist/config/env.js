import 'dotenv/config';
export const env = {
    port: Number(process.env.PORT ?? 4000),
    clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
};
