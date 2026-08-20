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
