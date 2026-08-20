# GEOv4 Architecture

## Decision

GEOv4 is a single-enterprise application with modular boundaries. It uses Vue
Vben Admin for the enterprise shell, a TypeScript API, MySQL for durable
business data, Redis/BullMQ for scheduled detection work, and S3-compatible
object storage for exports and evidence files.

```text
Vue Vben Admin
      |
REST/OpenAPI
      |
GEOv4 API ---- MySQL
      |          |
      |        audit/history
      |
Redis/BullMQ ---- Detection Worker ---- AI/Search providers
      |
Analysis pipeline ---- raw response / mention / rank / citation / score
```

## Applications

- `apps/web`: Vue Vben Admin enterprise console.
- `apps/api`: REST API, authentication, CRUD and orchestration.
- `apps/worker`: scheduled detection, provider execution and analysis.

## Shared packages

- `packages/domain`: provider-neutral entities and scoring rules.
- `packages/contracts`: API request/response schemas.
- `packages/provider-sdk`: provider adapter contract and implementations.
- `packages/publisher-sdk`: export and publishing connector contract.

## Non-negotiable data rules

1. Every detection stores prompt, provider, model, request time and raw answer.
2. Derived metrics keep an analyzer version and can be recomputed.
3. A citation retains both original URL and normalized domain.
4. Generated content links to its opportunity, evidence and version history.
5. Publishing never marks success without a platform URL or manual confirmation.
6. Demo/mock provider results are visibly labelled and never mixed into real metrics.

## Deployment baseline

Production is delivered with Docker Compose: reverse proxy, web, API, worker,
MySQL, Redis and object storage. Databases bind to private networks by default.
