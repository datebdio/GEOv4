# Publishing PRD

## Goal

Prepare channel-specific content and maintain an auditable publication record.

## Phase 1

- Channel templates for Zhihu, Baijiahao, Toutiao and Sohu.
- Export Markdown, HTML, DOCX and an asset package.
- Manual publication record with account, time, URL and notes.

## Phase 2

- Optional connectors through `publisher-sdk`.
- Official APIs first; browser automation isolated as replaceable plugins.
- Idempotency keys, draft/publish distinction and failure evidence.

## Acceptance

An approved version can be exported for a channel, recorded as published and
linked to a valid URL without creating duplicate records.
