import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq } from 'drizzle-orm';
import type { DatabaseConnection } from './db/client.js';
import { brandAliases, brands, contentItems, contentVersions, detectionRuns, effectSnapshots, monitoringTasks, publicationRecords, promptGroups, prompts } from './db/schema.js';
import type { ProviderAnswer, VisibilityAnalysis } from '@geov4/domain';

export interface BrandRecord {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  locale: string;
  aliases: string[];
  archived: boolean;
}

export interface BrandInput {
  name: string;
  website?: string | null;
  description?: string | null;
  locale?: string;
  aliases?: string[];
}

export interface PromptRecord {
  id: string;
  groupId: string | null;
  question: string;
  locale: string;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority: number;
  tags: string[];
  active: boolean;
}

export interface PromptInput extends Omit<PromptRecord, 'id' | 'active'> {
  active?: boolean;
}

export interface DetectionRecord {
  id: string;
  promptId: string;
  provider: string;
  model: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  isMock: boolean;
  rawResponse?: string | null;
  analysis?: VisibilityAnalysis | null;
  latencyMs?: number | null;
  errorMessage?: string | null;
}

export interface MonitoringTaskRecord {
  id: string;
  name: string;
  promptId: string;
  provider: string;
  model: string | null;
  schedule: string;
  active: boolean;
}

export type ContentStatus = 'draft' | 'review' | 'approved' | 'archived';
export type PublicationPlatform = 'zhihu' | 'baijiahao' | 'toutiao' | 'sohu';
export interface ContentVersionRecord { id: string; contentId: string; version: number; bodyMarkdown: string; evidenceUrls: string[]; changeNote: string | null }
export interface ContentRecord { id: string; brandId: string; promptId: string | null; title: string; status: ContentStatus; versions: ContentVersionRecord[] }
export interface PublicationRecord { id: string; contentId: string; versionId: string; platform: PublicationPlatform; account: string; status: 'prepared' | 'drafted' | 'published' | 'failed'; idempotencyKey: string; canonicalUrl: string | null; notes: string | null; publishedAt: Date | null }
export interface EffectRecord { id: string; publicationId: string; baselineRunId: string; followupRunId: string; mentionDelta: number; rankDelta: number | null; citationDelta: number }

export interface Repositories {
  brands: {
    list(): Promise<BrandRecord[]>;
    get(id: string): Promise<BrandRecord | null>;
    create(input: BrandInput): Promise<BrandRecord>;
    update(id: string, input: BrandInput): Promise<BrandRecord | null>;
    archive(id: string): Promise<boolean>;
  };
  prompts: {
    list(): Promise<PromptRecord[]>;
    get(id: string): Promise<PromptRecord | null>;
    create(input: PromptInput): Promise<PromptRecord>;
    update(id: string, input: PromptInput): Promise<PromptRecord | null>;
    archive(id: string): Promise<boolean>;
  };
  detections: {
    create(input: { promptId: string; provider: string; model: string; isMock: boolean }): Promise<{ id: string }>;
    succeed(id: string, answer: ProviderAnswer, analysis: VisibilityAnalysis): Promise<unknown>;
    fail(id: string, message: string): Promise<void>;
    get(id: string): Promise<DetectionRecord | null>;
    list(): Promise<DetectionRecord[]>;
  };
  tasks: {
    list(): Promise<MonitoringTaskRecord[]>;
    create(input: Omit<MonitoringTaskRecord, 'id' | 'active'> & { active?: boolean }): Promise<MonitoringTaskRecord>;
    setActive(id: string, active: boolean): Promise<MonitoringTaskRecord | null>;
  };
  contents: {
    list(): Promise<ContentRecord[]>;
    get(id: string): Promise<ContentRecord | null>;
    create(input: { brandId: string; promptId?: string | null; title: string; bodyMarkdown: string; evidenceUrls: string[] }): Promise<ContentRecord>;
    addVersion(id: string, input: { bodyMarkdown: string; evidenceUrls: string[]; changeNote?: string | null }): Promise<ContentRecord | null>;
    setStatus(id: string, status: ContentStatus): Promise<ContentRecord | null>;
  };
  publications: {
    list(): Promise<PublicationRecord[]>;
    create(input: Omit<PublicationRecord, 'id' | 'status' | 'canonicalUrl' | 'notes' | 'publishedAt'>): Promise<PublicationRecord>;
    publish(id: string, canonicalUrl: string, notes?: string | null): Promise<PublicationRecord | null>;
  };
  effects: {
    list(): Promise<EffectRecord[]>;
    create(input: Omit<EffectRecord, 'id' | 'mentionDelta' | 'rankDelta' | 'citationDelta'> & { mentionDelta: number; rankDelta: number | null; citationDelta: number }): Promise<EffectRecord>;
  };
}

export function createMySqlRepositories(connection: DatabaseConnection): Repositories {
  const { db } = connection;
  async function hydrateBrand(id: string): Promise<BrandRecord | null> {
    const rows = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    const row = rows[0];
    if (!row) return null;
    const aliases = await db.select().from(brandAliases).where(eq(brandAliases.brandId, id));
    return { ...row, aliases: aliases.map((item) => item.alias) };
  }
  async function hydrateContent(id: string): Promise<ContentRecord | null> {
    const row = (await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1))[0];
    if (!row) return null;
    const versions = await db.select().from(contentVersions).where(eq(contentVersions.contentId, id)).orderBy(asc(contentVersions.version));
    return { ...row, versions };
  }

  return {
    brands: {
      async list() {
        const rows = await db.select().from(brands).orderBy(asc(brands.createdAt));
        return Promise.all(rows.map((row) => hydrateBrand(row.id))) as Promise<BrandRecord[]>;
      },
      get: hydrateBrand,
      async create(input) {
        const id = randomUUID();
        await db.transaction(async (tx) => {
          await tx.insert(brands).values({ id, name: input.name, website: input.website, description: input.description, locale: input.locale ?? 'zh-CN' });
          if (input.aliases?.length) await tx.insert(brandAliases).values(input.aliases.map((alias) => ({ brandId: id, alias })));
        });
        return (await hydrateBrand(id))!;
      },
      async update(id, input) {
        if (!(await hydrateBrand(id))) return null;
        await db.transaction(async (tx) => {
          await tx.update(brands).set({ name: input.name, website: input.website, description: input.description, locale: input.locale ?? 'zh-CN' }).where(eq(brands.id, id));
          await tx.delete(brandAliases).where(eq(brandAliases.brandId, id));
          if (input.aliases?.length) await tx.insert(brandAliases).values(input.aliases.map((alias) => ({ brandId: id, alias })));
        });
        return hydrateBrand(id);
      },
      async archive(id) {
        const result = await db.update(brands).set({ archived: true }).where(eq(brands.id, id));
        return result[0].affectedRows > 0;
      },
    },
    prompts: {
      list: () => db.select().from(prompts).orderBy(asc(prompts.createdAt)),
      async get(id) { return (await db.select().from(prompts).where(eq(prompts.id, id)).limit(1))[0] ?? null; },
      async create(input) {
        const id = randomUUID();
        await db.insert(prompts).values({ id, ...input, active: input.active ?? true });
        return (await this.get(id))!;
      },
      async update(id, input) {
        const result = await db.update(prompts).set(input).where(eq(prompts.id, id));
        return result[0].affectedRows ? this.get(id) : null;
      },
      async archive(id) {
        const result = await db.update(prompts).set({ active: false }).where(eq(prompts.id, id));
        return result[0].affectedRows > 0;
      },
    },
    detections: {
      async create(input) { const id = randomUUID(); await db.insert(detectionRuns).values({ id, ...input, status: 'running' }); return { id }; },
      async succeed(id, answer, analysis) {
        await db.update(detectionRuns).set({ status: 'succeeded', model: answer.model, rawResponse: answer.rawText, analysis, latencyMs: answer.latencyMs, completedAt: new Date() }).where(eq(detectionRuns.id, id));
        return (await db.select().from(detectionRuns).where(eq(detectionRuns.id, id)).limit(1))[0];
      },
      async fail(id, message) { await db.update(detectionRuns).set({ status: 'failed', errorMessage: message, completedAt: new Date() }).where(eq(detectionRuns.id, id)); },
      async get(id) { return (await db.select().from(detectionRuns).where(eq(detectionRuns.id, id)).limit(1))[0] ?? null; },
      list: () => db.select().from(detectionRuns).orderBy(asc(detectionRuns.requestedAt)) as Promise<DetectionRecord[]>,
    },
    tasks: {
      list: () => db.select().from(monitoringTasks).orderBy(asc(monitoringTasks.createdAt)),
      async create(input) { const id = randomUUID(); await db.insert(monitoringTasks).values({ id, ...input, active: input.active ?? true }); return (await this.list()).find((item) => item.id === id)!; },
      async setActive(id, active) { const result = await db.update(monitoringTasks).set({ active }).where(eq(monitoringTasks.id, id)); return result[0].affectedRows ? (await this.list()).find((item) => item.id === id) ?? null : null; },
    },
    contents: {
      async list() { const rows = await db.select({ id: contentItems.id }).from(contentItems).orderBy(asc(contentItems.createdAt)); return Promise.all(rows.map((row) => hydrateContent(row.id))) as Promise<ContentRecord[]>; },
      get: hydrateContent,
      async create(input) { const id = randomUUID(); await db.transaction(async (tx) => { await tx.insert(contentItems).values({ id, brandId: input.brandId, promptId: input.promptId, title: input.title }); await tx.insert(contentVersions).values({ id: randomUUID(), contentId: id, version: 1, bodyMarkdown: input.bodyMarkdown, evidenceUrls: input.evidenceUrls }); }); return (await hydrateContent(id))!; },
      async addVersion(id, input) { if (!(await hydrateContent(id))) return null; const latest = (await db.select().from(contentVersions).where(eq(contentVersions.contentId, id)).orderBy(desc(contentVersions.version)).limit(1))[0]; await db.insert(contentVersions).values({ id: randomUUID(), contentId: id, version: (latest?.version ?? 0) + 1, ...input }); return hydrateContent(id); },
      async setStatus(id, status) { const result = await db.update(contentItems).set({ status }).where(eq(contentItems.id, id)); return result[0].affectedRows ? hydrateContent(id) : null; },
    },
    publications: {
      list: () => db.select().from(publicationRecords).orderBy(asc(publicationRecords.createdAt)),
      async create(input) { const id = randomUUID(); await db.insert(publicationRecords).values({ id, ...input }); return (await this.list()).find((item) => item.id === id)!; },
      async publish(id, canonicalUrl, notes) { const result = await db.update(publicationRecords).set({ status: 'published', canonicalUrl, notes, publishedAt: new Date() }).where(eq(publicationRecords.id, id)); return result[0].affectedRows ? (await this.list()).find((item) => item.id === id) ?? null : null; },
    },
    effects: {
      list: () => db.select().from(effectSnapshots).orderBy(asc(effectSnapshots.createdAt)),
      async create(input) { const id = randomUUID(); await db.insert(effectSnapshots).values({ id, ...input }); return (await this.list()).find((item) => item.id === id)!; },
    },
  };
}

export function createMemoryRepositories(): Repositories {
  const brandRows = new Map<string, BrandRecord>();
  const promptRows = new Map<string, PromptRecord>();
  const detectionRows = new Map<string, DetectionRecord>();
  const taskRows = new Map<string, MonitoringTaskRecord>();
  const contentRows = new Map<string, ContentRecord>(); const publicationRows = new Map<string, PublicationRecord>(); const effectRows = new Map<string, EffectRecord>();
  return {
    brands: {
      async list() { return [...brandRows.values()]; },
      async get(id) { return brandRows.get(id) ?? null; },
      async create(input) { const row = { id: randomUUID(), website: null, description: null, locale: 'zh-CN', aliases: [], archived: false, ...input }; brandRows.set(row.id, row); return row; },
      async update(id, input) { const old = brandRows.get(id); if (!old) return null; const row = { ...old, ...input }; brandRows.set(id, row); return row; },
      async archive(id) { const row = brandRows.get(id); if (!row) return false; brandRows.set(id, { ...row, archived: true }); return true; },
    },
    prompts: {
      async list() { return [...promptRows.values()]; },
      async get(id) { return promptRows.get(id) ?? null; },
      async create(input) { const row = { id: randomUUID(), active: true, ...input }; promptRows.set(row.id, row); return row; },
      async update(id, input) { const old = promptRows.get(id); if (!old) return null; const row = { ...old, ...input }; promptRows.set(id, row); return row; },
      async archive(id) { const row = promptRows.get(id); if (!row) return false; promptRows.set(id, { ...row, active: false }); return true; },
    },
    detections: {
      async create(input) { const row: DetectionRecord = { id: randomUUID(), ...input, status: 'running' }; detectionRows.set(row.id, row); return { id: row.id }; },
      async succeed(id, answer, analysis) { const row: DetectionRecord = { ...detectionRows.get(id)!, status: 'succeeded', rawResponse: answer.rawText, analysis, model: answer.model, latencyMs: answer.latencyMs }; detectionRows.set(id, row); return row; },
      async fail(id, message) { const row = detectionRows.get(id); if (row) detectionRows.set(id, { ...row, status: 'failed', errorMessage: message }); },
      async get(id) { return detectionRows.get(id) ?? null; },
      async list() { return [...detectionRows.values()]; },
    },
    tasks: {
      async list() { return [...taskRows.values()]; },
      async create(input) { const row = { id: randomUUID(), active: true, ...input }; taskRows.set(row.id, row); return row; },
      async setActive(id, active) { const row = taskRows.get(id); if (!row) return null; const updated = { ...row, active }; taskRows.set(id, updated); return updated; },
    },
    contents: {
      async list() { return [...contentRows.values()]; }, async get(id) { return contentRows.get(id) ?? null; },
      async create(input) { const id = randomUUID(); const row: ContentRecord = { id, brandId: input.brandId, promptId: input.promptId ?? null, title: input.title, status: 'draft', versions: [{ id: randomUUID(), contentId: id, version: 1, bodyMarkdown: input.bodyMarkdown, evidenceUrls: input.evidenceUrls, changeNote: null }] }; contentRows.set(id, row); return row; },
      async addVersion(id, input) { const row = contentRows.get(id); if (!row) return null; const version: ContentVersionRecord = { id: randomUUID(), contentId: id, version: row.versions.length + 1, bodyMarkdown: input.bodyMarkdown, evidenceUrls: input.evidenceUrls, changeNote: input.changeNote ?? null }; const updated = { ...row, versions: [...row.versions, version] }; contentRows.set(id, updated); return updated; },
      async setStatus(id, status) { const row = contentRows.get(id); if (!row) return null; const updated = { ...row, status }; contentRows.set(id, updated); return updated; },
    },
    publications: {
      async list() { return [...publicationRows.values()]; }, async create(input) { const duplicate = [...publicationRows.values()].find((row) => row.idempotencyKey === input.idempotencyKey); if (duplicate) return duplicate; const row: PublicationRecord = { id: randomUUID(), ...input, status: 'prepared', canonicalUrl: null, notes: null, publishedAt: null }; publicationRows.set(row.id, row); return row; },
      async publish(id, canonicalUrl, notes) { const row = publicationRows.get(id); if (!row) return null; const updated = { ...row, status: 'published' as const, canonicalUrl, notes: notes ?? null, publishedAt: new Date() }; publicationRows.set(id, updated); return updated; },
    },
    effects: { async list() { return [...effectRows.values()]; }, async create(input) { const row = { id: randomUUID(), ...input }; effectRows.set(row.id, row); return row; } },
  };
}
