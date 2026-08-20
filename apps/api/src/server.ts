import { createApp } from './app.js';

const port = Number(process.env.API_PORT ?? 3100);
const app = createApp();

await app.listen({ host: '127.0.0.1', port });
