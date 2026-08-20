import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import type { VisibilityAnalysis } from '@geov4/domain';

export const brands = mysqlTable('brands', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  website: varchar('website', { length: 500 }),
  description: text('description'),
  locale: varchar('locale', { length: 20 }).notNull().default('zh-CN'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [uniqueIndex('brands_name_unique').on(table.name)]);

export const brandAliases = mysqlTable('brand_aliases', {
  brandId: varchar('brand_id', { length: 36 }).notNull().references(() => brands.id, { onDelete: 'cascade' }),
  alias: varchar('alias', { length: 160 }).notNull(),
}, (table) => [primaryKey({ columns: [table.brandId, table.alias] })]);

export const competitors = mysqlTable('competitors', {
  id: varchar('id', { length: 36 }).primaryKey(),
  brandId: varchar('brand_id', { length: 36 }).notNull().references(() => brands.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  website: varchar('website', { length: 500 }),
  aliases: json('aliases').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [uniqueIndex('competitor_brand_name_unique').on(table.brandId, table.name)]);

export const promptGroups = mysqlTable('prompt_groups', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const prompts = mysqlTable('prompts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  groupId: varchar('group_id', { length: 36 }).references(() => promptGroups.id, { onDelete: 'set null' }),
  question: text('question').notNull(),
  locale: varchar('locale', { length: 20 }).notNull().default('zh-CN'),
  intent: mysqlEnum('intent', ['informational', 'commercial', 'transactional', 'navigational']).notNull(),
  priority: int('priority').notNull().default(50),
  tags: json('tags').$type<string[]>().notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [index('prompts_group_active_idx').on(table.groupId, table.active)]);

export const detectionRuns = mysqlTable('detection_runs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  promptId: varchar('prompt_id', { length: 36 }).notNull().references(() => prompts.id),
  provider: varchar('provider', { length: 80 }).notNull(),
  model: varchar('model', { length: 160 }).notNull(),
  status: mysqlEnum('status', ['queued', 'running', 'succeeded', 'failed', 'cancelled']).notNull(),
  isMock: boolean('is_mock').notNull().default(false),
  rawResponse: text('raw_response'),
  analysis: json('analysis').$type<VisibilityAnalysis>(),
  errorCode: varchar('error_code', { length: 120 }),
  errorMessage: text('error_message'),
  latencyMs: int('latency_ms'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => [index('detection_prompt_time_idx').on(table.promptId, table.requestedAt)]);

export const monitoringTasks = mysqlTable('monitoring_tasks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  promptId: varchar('prompt_id', { length: 36 }).notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 80 }).notNull(),
  model: varchar('model', { length: 160 }),
  schedule: varchar('schedule', { length: 80 }).notNull(),
  active: boolean('active').notNull().default(true),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [index('monitoring_tasks_active_next_idx').on(table.active, table.nextRunAt)]);

export const contentItems = mysqlTable('content_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  brandId: varchar('brand_id', { length: 36 }).notNull().references(() => brands.id),
  promptId: varchar('prompt_id', { length: 36 }).references(() => prompts.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 300 }).notNull(),
  status: mysqlEnum('status', ['draft', 'review', 'approved', 'archived']).notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [index('content_items_brand_status_idx').on(table.brandId, table.status)]);

export const contentVersions = mysqlTable('content_versions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  contentId: varchar('content_id', { length: 36 }).notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
  version: int('version').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  evidenceUrls: json('evidence_urls').$type<string[]>().notNull(),
  changeNote: varchar('change_note', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [uniqueIndex('content_versions_content_version_unique').on(table.contentId, table.version)]);

export const publicationRecords = mysqlTable('publication_records', {
  id: varchar('id', { length: 36 }).primaryKey(),
  contentId: varchar('content_id', { length: 36 }).notNull().references(() => contentItems.id),
  versionId: varchar('version_id', { length: 36 }).notNull().references(() => contentVersions.id),
  platform: mysqlEnum('platform', ['zhihu', 'baijiahao', 'toutiao', 'sohu']).notNull(),
  account: varchar('account', { length: 160 }).notNull(),
  status: mysqlEnum('status', ['prepared', 'drafted', 'published', 'failed']).notNull().default('prepared'),
  idempotencyKey: varchar('idempotency_key', { length: 200 }).notNull(),
  canonicalUrl: varchar('canonical_url', { length: 1000 }),
  notes: text('notes'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [uniqueIndex('publication_idempotency_unique').on(table.idempotencyKey)]);

export const effectSnapshots = mysqlTable('effect_snapshots', {
  id: varchar('id', { length: 36 }).primaryKey(),
  publicationId: varchar('publication_id', { length: 36 }).notNull().references(() => publicationRecords.id, { onDelete: 'cascade' }),
  baselineRunId: varchar('baseline_run_id', { length: 36 }).notNull().references(() => detectionRuns.id),
  followupRunId: varchar('followup_run_id', { length: 36 }).notNull().references(() => detectionRuns.id),
  mentionDelta: int('mention_delta').notNull(),
  rankDelta: int('rank_delta'),
  citationDelta: int('citation_delta').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [uniqueIndex('effect_publication_runs_unique').on(table.publicationId, table.baselineRunId, table.followupRunId)]);
