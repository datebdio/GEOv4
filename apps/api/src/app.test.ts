import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();
afterAll(() => app.close());

describe('GEOv4 API', () => {
  it('reports health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('runs a traceable deterministic mock detection', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/detections/mock',
      payload: {
        prompt: '哪一个GEO平台值得使用？',
        brands: [
          { id: '1', name: 'GEOv4', aliases: ['GEO V4'], kind: 'brand' },
          { id: '2', name: '竞品A', aliases: [], kind: 'competitor' },
        ],
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      mode: 'mock',
      response: { isMock: true },
      analysis: { analyzerVersion: '0.1.0' },
    });
  });
});
