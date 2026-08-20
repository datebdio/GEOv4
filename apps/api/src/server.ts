import { createApp } from './app.js';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { connectDatabase } from './db/client.js';
import { createMySqlRepositories } from './repositories.js';
import { DetectionService } from './detection-service.js';
import { MockProvider, OpenAiCompatibleProvider, ProviderRegistry, type AiProvider } from './providers.js';

const port = Number(process.env.API_PORT ?? 3100);
const connection = connectDatabase();
if (process.env.RUN_MIGRATIONS === 'true') await migrate(connection.db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? './drizzle' });
const repositories = createMySqlRepositories(connection);
const configuredProviders: AiProvider[] = [new MockProvider()];
if (process.env.OPENAI_API_KEY) configuredProviders.push(new OpenAiCompatibleProvider({ id: 'openai-compatible', baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1', apiKey: process.env.OPENAI_API_KEY, defaultModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini' }));
const registry = new ProviderRegistry(configuredProviders);
const app = createApp(repositories, new DetectionService(repositories, registry));

app.addHook('onClose', async () => connection.pool.end());

await app.listen({ host: process.env.API_HOST ?? '127.0.0.1', port });
