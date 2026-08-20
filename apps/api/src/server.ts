import { createApp } from './app.js';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { connectDatabase } from './db/client.js';
import { createMySqlRepositories } from './repositories.js';
import { DetectionService } from './detection-service.js';
import { AnthropicProvider, GeminiProvider, MockProvider, OpenAiCompatibleProvider, ProviderRegistry, type AiProvider } from './providers.js';

const port = Number(process.env.API_PORT ?? 3100);
const connection = connectDatabase();
if (process.env.RUN_MIGRATIONS === 'true') await migrate(connection.db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? './drizzle' });
const repositories = createMySqlRepositories(connection);
const configuredProviders: AiProvider[] = [new MockProvider()];
if (process.env.OPENAI_API_KEY) configuredProviders.push(new OpenAiCompatibleProvider({ id: 'openai-compatible', baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1', apiKey: process.env.OPENAI_API_KEY, defaultModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini' }));
if (process.env.DEEPSEEK_API_KEY) configuredProviders.push(new OpenAiCompatibleProvider({ id: 'deepseek', baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1', apiKey: process.env.DEEPSEEK_API_KEY, defaultModel: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat' }));
if (process.env.PERPLEXITY_API_KEY) configuredProviders.push(new OpenAiCompatibleProvider({ id: 'perplexity', baseUrl: process.env.PERPLEXITY_BASE_URL ?? 'https://api.perplexity.ai', apiKey: process.env.PERPLEXITY_API_KEY, defaultModel: process.env.PERPLEXITY_MODEL ?? 'sonar' }));
if (process.env.ANTHROPIC_API_KEY) configuredProviders.push(new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY, defaultModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5' }));
if (process.env.GEMINI_API_KEY) configuredProviders.push(new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY, defaultModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash' }));
const registry = new ProviderRegistry(configuredProviders);
const app = createApp(repositories, new DetectionService(repositories, registry));

app.addHook('onClose', async () => connection.pool.end());

await app.listen({ host: process.env.API_HOST ?? '127.0.0.1', port });
