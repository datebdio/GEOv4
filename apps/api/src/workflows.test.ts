import { describe, expect, it } from 'vitest';
import { ContentGenerationService } from './content-generation-service.js';
import { PublicationService, type PublisherConnector } from './publication-service.js';
import { MockProvider, ProviderRegistry } from './providers.js';
import { createMemoryRepositories } from './repositories.js';

describe('content generation and publishing workflow', () => {
  it('generates evidence-aware versioned content through a provider', async () => {
    const repositories = createMemoryRepositories(); const brand = await repositories.brands.create({ name: 'GEOv4' });
    const prompt = await repositories.prompts.create({ groupId: null, question: '如何做 GEO 检测？', locale: 'zh-CN', intent: 'informational', priority: 80, tags: [] });
    const service = new ContentGenerationService(repositories, new ProviderRegistry([new MockProvider()]));
    const content = await service.generate({ brandId: brand.id, promptId: prompt.id, provider: 'mock', evidenceUrls: ['https://example.com/evidence'] });
    expect(content).toMatchObject({ brandId: brand.id, promptId: prompt.id, status: 'draft' }); expect(content.versions[0].bodyMarkdown).toContain('模拟回答');
  });

  it('dispatches approved content once through an isolated connector and stores result', async () => {
    const repositories = createMemoryRepositories(); const brand = await repositories.brands.create({ name: 'GEOv4' });
    const content = await repositories.contents.create({ brandId: brand.id, title: '测试发布', bodyMarkdown: '这是一段足够长的测试发布正文，用于验证隔离连接器。', evidenceUrls: [] });
    await repositories.contents.setStatus(content.id, 'approved'); const version = content.versions[0];
    const publication = await repositories.publications.create({ contentId: content.id, versionId: version.id, platform: 'toutiao', account: '企业账号', idempotencyKey: 'same-key' });
    const connector: PublisherConnector = { async dispatch(input) { expect(input.idempotencyKey).toBe('same-key'); return { status: 'published', canonicalUrl: 'https://www.toutiao.com/article/123', evidence: 'remote-id:123' }; } };
    const result = await new PublicationService(repositories, connector).dispatch(publication.id);
    expect(result).toMatchObject({ status: 'published', canonicalUrl: 'https://www.toutiao.com/article/123', notes: 'remote-id:123' });
  });
});
