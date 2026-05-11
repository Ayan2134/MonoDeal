import 'dotenv/config';

const rawClientOrigins = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost:5174,http://localhost:5175';
const clientOrigins = rawClientOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientOrigins,
  allowAnyOrigin: clientOrigins.includes('*'),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? clientOrigins.find((origin) => origin !== '*') ?? 'http://localhost:5173',
};
