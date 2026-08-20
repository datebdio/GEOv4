import type { PublicationPlatform, PublicationRecord, Repositories } from './repositories.js';
import { renderChannelContent } from './publishing.js';

export interface PublishDispatchResult { status: 'drafted' | 'published'; canonicalUrl?: string; remoteId?: string; evidence?: string }
export interface PublisherConnector { dispatch(input: { platform: PublicationPlatform; account: string; idempotencyKey: string; title: string; markdown: string; html: string }): Promise<PublishDispatchResult> }

export class HttpPublisherConnector implements PublisherConnector {
  constructor(private readonly config: { endpoint: string; token: string; timeoutMs?: number }) {}
  async dispatch(input: Parameters<PublisherConnector['dispatch']>[0]): Promise<PublishDispatchResult> {
    const response = await fetch(`${this.config.endpoint.replace(/\/$/, '')}/v1/publish`, { method: 'POST', headers: { authorization: `Bearer ${this.config.token}`, 'content-type': 'application/json', 'idempotency-key': input.idempotencyKey }, body: JSON.stringify(input), signal: AbortSignal.timeout(this.config.timeoutMs ?? 120_000) });
    if (!response.ok) throw new Error(`publisher_http_${response.status}`); const payload = await response.json() as PublishDispatchResult;
    if (!['drafted', 'published'].includes(payload.status)) throw new Error('publisher_invalid_response'); return payload;
  }
}

export class PublicationService {
  constructor(private readonly repositories: Repositories, private readonly connector: PublisherConnector) {}
  async dispatch(id: string): Promise<PublicationRecord> {
    const publication = await this.repositories.publications.get(id); if (!publication) throw new Error('publication_not_found');
    const content = await this.repositories.contents.get(publication.contentId); if (!content || content.status !== 'approved') throw new Error('content_not_approved');
    const version = content.versions.find((item) => item.id === publication.versionId); if (!version) throw new Error('version_not_found');
    const rendered = renderChannelContent({ platform: publication.platform, title: content.title, bodyMarkdown: version.bodyMarkdown });
    try { const result = await this.connector.dispatch({ platform: publication.platform, account: publication.account, idempotencyKey: publication.idempotencyKey, title: rendered.title, markdown: rendered.markdown, html: rendered.html }); return (await this.repositories.publications.setResult(id, { status: result.status, canonicalUrl: result.canonicalUrl ?? null, notes: result.evidence ?? null }))!; }
    catch (error) { await this.repositories.publications.setResult(id, { status: 'failed', notes: error instanceof Error ? error.message : 'publisher_failed' }); throw error; }
  }
}
