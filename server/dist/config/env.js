import 'dotenv/config';
const defaultClientUrls = 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
const rawClientUrls = process.env.CLIENT_URL ?? process.env.CLIENT_ORIGIN ?? defaultClientUrls;
const clientUrls = rawClientUrls
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
export const env = {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    clientUrls,
    allowAnyOrigin: clientUrls.includes('*'),
    publicAppUrl: process.env.PUBLIC_APP_URL ?? clientUrls.find((origin) => origin !== '*') ?? 'http://localhost:5173',
};
