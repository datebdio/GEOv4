import Fastify from 'fastify';
import cors from '@fastify/cors';
import { analyzeVisibility, type BrandDictionary } from '@geov4/domain';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(1),
  brands: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    aliases: z.array(z.string()).default([]),
    kind: z.enum(['brand', 'competitor']),
  })).min(1),
});

export function createApp() {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });

  app.get('/health', async () => ({ status: 'ok', version: '0.1.0' }));

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
