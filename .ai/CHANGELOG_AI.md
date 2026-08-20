# AI Development Changelog

## 2026-08-20 — Phase 1 foundation

- Added the TypeScript/pnpm monorepo foundation.
- Added the enterprise console baseline following the Vue Vben Admin direction.
- Added the API health endpoint and traceable deterministic mock detection.
- Added provider-neutral mention, rank and citation analysis with fixtures.
- Added architecture, data model, module PRDs and open-source license register.
- Generated and supply-chain checked the dependency lockfile through Offline Bridge.
- Verified 5 tests, TypeScript/Vue type checks, production builds and HTTP smoke tests.

Next: implement MySQL persistence and Brand/Prompt CRUD before a real provider adapter.

## 2026-08-20 — MySQL and CRUD foundation

- Added Drizzle ORM and MySQL2 with an Offline Bridge verified lockfile.
- Added six-table MySQL schema, indexes, foreign keys and generated SQL migration.
- Added production MySQL repository implementations for brands and prompts.
- Added validated Brand and Prompt REST CRUD with archive semantics.
- Enforced production `DATABASE_URL`; memory repositories exist only as test dependencies.
- Expanded the suite to 7 passing domain/API tests.

Next: provider credentials, real provider adapter and persisted detection execution.

## 2026-08-20 — Provider and persisted detection foundation

- Added a provider-neutral execution contract and registry.
- Added deterministic Mock Provider and OpenAI-compatible real provider.
- Added timeout, HTTP error and empty-response failure handling.
- Added detection orchestration with running/succeeded/failed persistence.
- Persisted raw answer, model, latency and versioned visibility analysis.
- Added end-to-end provider/detection API test; total suite now 8 tests.

## 2026-08-21 — Monitoring, opportunity and deployment baseline

- Added monitoring task persistence, migration and REST APIs.
- Added detection history and aggregate visibility analytics that exclude mock runs.
- Added brand opportunity-gap analysis derived from real prompt samples.
- Replaced placeholder console modules with operational Brand, Prompt, Detection and Opportunity pages.
- Added production Dockerfiles, Nginx API proxying, automatic database migrations and a Compose stack.
- Verified API/domain tests, TypeScript checks and the Web production build.
- Container acceptance is pending because the current sandbox does not expose a Docker runtime.

## 2026-08-21 — Multi-provider, Content Studio and publishing workflow

- Added dedicated Anthropic and Gemini adapters with citation/grounding extraction.
- Added OpenAI-compatible routing for OpenAI, DeepSeek and Perplexity.
- Added content items, immutable versions, evidence binding and approval status.
- Added Zhihu, Baijiahao, Toutiao and Sohu channel rendering.
- Added idempotent publication preparation, canonical URL confirmation and effect snapshots.
- Added operational Content Studio and Publishing Center pages.
- Expanded the verified suite to 13 API/domain tests.
