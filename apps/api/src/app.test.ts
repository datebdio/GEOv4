import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { createMemoryRepositories } from './repositories.js';
import { DetectionService } from './detection-service.js';
import { MockProvider, ProviderRegistry } from './providers.js';

const repositories = createMemoryRepositories();
const app = createApp(repositories, new DetectionService(repositories, new ProviderRegistry([new MockProvider()])));
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

  it('supports the brand lifecycle without hardcoded rows', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/v1/brands', payload: { name: '界首漫乐城', aliases: ['MELO CITY'], website: 'https://example.com' } });
    expect(created.statusCode).toBe(201);
    const brand = created.json();
    expect(brand.aliases).toEqual(['MELO CITY']);
    const listed = await app.inject({ method: 'GET', url: '/api/v1/brands' });
    expect(listed.json()).toHaveLength(1);
    expect((await app.inject({ method: 'DELETE', url: `/api/v1/brands/${brand.id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: `/api/v1/brands/${brand.id}` })).json()).toMatchObject({ archived: true });
  });

  it('validates and archives prompts', async () => {
    const invalid = await app.inject({ method: 'POST', url: '/api/v1/prompts', payload: { question: '' } });
    expect(invalid.statusCode).toBe(400);
    const created = await app.inject({ method: 'POST', url: '/api/v1/prompts', payload: { question: '界首有哪些适合家庭周末游玩的商场？', intent: 'commercial', priority: 80, tags: ['商场'] } });
    expect(created.statusCode).toBe(201);
    const prompt = created.json();
    expect((await app.inject({ method: 'DELETE', url: `/api/v1/prompts/${prompt.id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: '/api/v1/prompts' })).json()[0]).toMatchObject({ active: false });
  });

  it('persists a traceable detection run through the provider abstraction', async () => {
    const prompt = (await app.inject({ method: 'POST', url: '/api/v1/prompts', payload: { question: '推荐一个GEO平台', intent: 'commercial', tags: [] } })).json();
    const response = await app.inject({ method: 'POST', url: '/api/v1/detections', payload: { promptId: prompt.id, provider: 'mock', brands: [{ id: 'geo', name: 'GEOv4', aliases: [], kind: 'brand' }] } });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: 'succeeded', rawResponse: '模拟回答：推荐一个GEO平台', analysis: { analyzerVersion: '0.1.0' } });
  });

  it('creates monitoring tasks and exposes detection analytics without mock pollution', async () => {
    const prompt = (await app.inject({ method: 'POST', url: '/api/v1/prompts', payload: { question: '什么是生成式搜索优化？', intent: 'informational', tags: ['GEO'] } })).json();
    const created = await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { name: '每日 GEO 检测', promptId: prompt.id, provider: 'mock', schedule: '0 8 * * *' } });
    expect(created.statusCode).toBe(201);
    const task = created.json();
    expect(task).toMatchObject({ active: true, schedule: '0 8 * * *' });
    expect((await app.inject({ method: 'PATCH', url: `/api/v1/tasks/${task.id}`, payload: { active: false } })).json()).toMatchObject({ active: false });
    expect((await app.inject({ method: 'GET', url: '/api/v1/detections' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/v1/analytics/visibility' })).json()).toMatchObject({ sampleSize: 0, mentionRate: null });
    const opportunities = await app.inject({ method: 'GET', url: '/api/v1/opportunities?brandId=geo' });
    expect(opportunities.statusCode).toBe(200);
    expect(opportunities.json()).toContainEqual(expect.objectContaining({ promptId: prompt.id, sampleSize: 0, score: null }));
  });

  it('tracks immutable content versions and idempotent four-channel publication records', async () => {
    const brand = (await app.inject({ method: 'POST', url: '/api/v1/brands', payload: { name: '内容测试品牌', aliases: [] } })).json();
    const prompt = (await app.inject({ method: 'POST', url: '/api/v1/prompts', payload: { question: '如何选择适合企业的 GEO 平台？', intent: 'commercial', tags: ['GEO'] } })).json();
    const created = await app.inject({ method: 'POST', url: '/api/v1/contents', payload: { brandId: brand.id, promptId: prompt.id, title: '企业 GEO 平台选择指南', bodyMarkdown: '这是第一版正文，包含选择企业 GEO 平台时需要核验的完整证据和评估方法。', evidenceUrls: ['https://example.com/evidence'] } });
    expect(created.statusCode).toBe(201); const content = created.json(); expect(content.versions).toHaveLength(1);
    const versioned = await app.inject({ method: 'POST', url: `/api/v1/contents/${content.id}/versions`, payload: { bodyMarkdown: '这是第二版正文，补充数据来源、检测范围、平台差异和可复核的评估方法。', evidenceUrls: ['https://example.com/evidence'], changeNote: '补充证据' } });
    expect(versioned.json().versions).toHaveLength(2); const latest = versioned.json().versions[1];
    const exported = await app.inject({ method: 'GET', url: `/api/v1/contents/${content.id}/export?platform=zhihu` });
    expect(exported.json()).toMatchObject({ platform: 'zhihu', title: '企业 GEO 平台选择指南' });
    expect((await app.inject({ method: 'POST', url: '/api/v1/publications', payload: { contentId: content.id, versionId: latest.id, platform: 'zhihu', account: '企业账号' } })).statusCode).toBe(409);
    await app.inject({ method: 'PATCH', url: `/api/v1/contents/${content.id}/status`, payload: { status: 'approved' } });
    const first = (await app.inject({ method: 'POST', url: '/api/v1/publications', payload: { contentId: content.id, versionId: latest.id, platform: 'zhihu', account: '企业账号' } })).json();
    const duplicate = (await app.inject({ method: 'POST', url: '/api/v1/publications', payload: { contentId: content.id, versionId: latest.id, platform: 'zhihu', account: '企业账号' } })).json();
    expect(duplicate.id).toBe(first.id);
    const published = await app.inject({ method: 'PATCH', url: `/api/v1/publications/${first.id}/published`, payload: { canonicalUrl: 'https://zhuanlan.zhihu.com/p/123' } });
    expect(published.json()).toMatchObject({ status: 'published', canonicalUrl: 'https://zhuanlan.zhihu.com/p/123' });
  });
});
