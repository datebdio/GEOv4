import { createApp } from './app.js';
import { connectDatabase } from './db/client.js';
import { createMySqlRepositories } from './repositories.js';

const port = Number(process.env.API_PORT ?? 3100);
const connection = connectDatabase();
const app = createApp(createMySqlRepositories(connection));

app.addHook('onClose', async () => connection.pool.end());

await app.listen({ host: '127.0.0.1', port });
