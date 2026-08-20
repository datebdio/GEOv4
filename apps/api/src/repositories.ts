import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import type { DatabaseConnection } from './db/client.js';
import { brandAliases, brands, promptGroups, prompts } from './db/schema.js';

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
  };
}

export function createMemoryRepositories(): Repositories {
  const brandRows = new Map<string, BrandRecord>();
  const promptRows = new Map<string, PromptRecord>();
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
  };
}
