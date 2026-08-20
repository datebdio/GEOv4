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
  analysis: json('analysis'),
  errorCode: varchar('error_code', { length: 120 }),
  errorMessage: text('error_message'),
  latencyMs: int('latency_ms'),
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => [index('detection_prompt_time_idx').on(table.promptId, table.requestedAt)]);
