# GEOv4 Data Model

## Core aggregates

### Brand

- `brands`: canonical name, website, description, locale.
- `brand_aliases`: aliases used by mention analysis.
- `competitors`: competitor brand and aliases.
- `brand_assets`: products, services, facts, claims and source URLs.

### Monitoring

- `prompt_groups`: business topic and ownership.
- `prompts`: question, locale, tags and active state.
- `monitoring_tasks`: schedule, provider set and execution policy.
- `detection_runs`: immutable execution envelope and status.
- `provider_responses`: model, latency, token/cost data and raw answer.
- `mentions`: brand/competitor, position, confidence and matched text.
- `citations`: URL, domain, title, source position and relation.
- `visibility_snapshots`: versioned aggregate metrics by time window.

### Growth workflow

- `opportunities`: evidence-backed gap with priority and status.
- `content_briefs`: target prompts, outline and required evidence.
- `content_items`: channel-neutral content identity.
- `content_versions`: immutable body versions and generation metadata.
- `content_evidence`: source, excerpt/hash and verification state.
- `publication_records`: target platform, account, status and canonical URL.
- `effect_snapshots`: before/after visibility comparison.

### Operations

- `provider_configs`: encrypted credentials and routing policy.
- `job_attempts`: queue attempt, error class and retry information.
- `audit_logs`: actor, action, object and before/after hashes.

## Integrity

- Raw provider responses and content versions are append-only.
- Derived analysis rows reference an `analyzer_version`.
- Deleting a prompt archives it; historical detections remain queryable.
- Publication URLs are unique per platform/account/content combination.
