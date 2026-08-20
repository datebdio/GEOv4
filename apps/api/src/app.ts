import Fastify from 'fastify';
import cors from '@fastify/cors';
import { analyzeVisibility, type BrandDictionary } from '@geov4/domain';
import { z } from 'zod';
import type { Repositories } from './repositories.js';
import type { DetectionService } from './detection-service.js';

const requestSchema = z.object({
  prompt: z.string().min(1),
  brands: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    aliases: z.array(z.string()).default([]),
    kind: z.enum(['brand', 'competitor']),
  })).min(1),
});

const brandSchema = z.object({ name: z.string().trim().min(1).max(160), website: z.string().url().nullable().optional(), description: z.string().max(5000).nullable().optional(), locale: z.string().min(2).max(20).default('zh-CN'), aliases: z.array(z.string().trim().min(1).max(160)).default([]) });
const promptSchema = z.object({ groupId: z.string().uuid().nullable().default(null), question: z.string().trim().min(2).max(5000), locale: z.string().min(2).max(20).default('zh-CN'), intent: z.enum(['informational', 'commercial', 'transactional', 'navigational']), priority: z.number().int().min(0).max(100).default(50), tags: z.array(z.string().trim().min(1).max(80)).default([]), active: z.boolean().optional() });

export function createApp(repositories: Repositories, detections?: DetectionService) {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok', version: '0.1.0' }));

  app.get('/api/v1/brands', () => repositories.brands.list());
  app.get('/api/v1/brands/:id', async (request, reply) => {
    const item = await repositories.brands.get((request.params as { id: string }).id);
    return item ?? reply.code(404).send({ error: 'brand_not_found' });
  });
  app.post('/api/v1/brands', async (request, reply) => {
    const input = brandSchema.safeParse(request.body);
    return input.success ? reply.code(201).send(await repositories.brands.create(input.data)) : reply.code(400).send({ error: input.error.flatten() });
  });
  app.put('/api/v1/brands/:id', async (request, reply) => {
    const input = brandSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: input.error.flatten() });
    return (await repositories.brands.update((request.params as { id: string }).id, input.data)) ?? reply.code(404).send({ error: 'brand_not_found' });
  });
  app.delete('/api/v1/brands/:id', async (request, reply) => (await repositories.brands.archive((request.params as { id: string }).id)) ? reply.code(204).send() : reply.code(404).send({ error: 'brand_not_found' }));

  app.get('/api/v1/prompts', () => repositories.prompts.list());
  app.post('/api/v1/prompts', async (request, reply) => {
    const input = promptSchema.safeParse(request.body);
    return input.success ? reply.code(201).send(await repositories.prompts.create(input.data)) : reply.code(400).send({ error: input.error.flatten() });
  });
  app.put('/api/v1/prompts/:id', async (request, reply) => {
    const input = promptSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: input.error.flatten() });
    return (await repositories.prompts.update((request.params as { id: string }).id, input.data)) ?? reply.code(404).send({ error: 'prompt_not_found' });
  });
  app.delete('/api/v1/prompts/:id', async (request, reply) => (await repositories.prompts.archive((request.params as { id: string }).id)) ? reply.code(204).send() : reply.code(404).send({ error: 'prompt_not_found' }));

  app.post('/api/v1/detections', async (request, reply) => {
    if (!detections) return reply.code(503).send({ error: 'detection_service_unavailable' });
    const input = z.object({ promptId: z.string().uuid(), provider: z.string().min(1), model: z.string().min(1).optional(), brands: z.array(z.object({ id: z.string(), name: z.string(), aliases: z.array(z.string()), kind: z.enum(['brand', 'competitor']) })).min(1) }).safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: input.error.flatten() });
    try { return reply.code(201).send(await detections.execute(input.data)); }
    catch (error) { const message = error instanceof Error ? error.message : 'detection_failed'; return reply.code(message === 'prompt_not_found' ? 404 : 502).send({ error: message }); }
  });

  app.post('/api/v1/detections/mock', async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const brands = parsed.data.brands as BrandDictionary[];
    const rawText = `针对“${parsed.data.prompt}”，推荐关注 ${brands.map((b) => b.name).join('、')}。`;
    const response = {
      provider: 'mock',
      model: 'deterministic-fixture-v1',
      rawText,
      citations: ['https://example.com/geo?utm_source=mock'],
      latencyMs: 0,
      isMock: true,
    } as const;

    return {
      mode: 'mock',
      warning: '模拟结果不计入真实可见度指标',
      prompt: parsed.data.prompt,
      response,
      analysis: analyzeVisibility(response, brands),
    };
  });

  return app;
}
