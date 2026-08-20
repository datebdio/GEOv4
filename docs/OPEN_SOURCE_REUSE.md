# Open-source reuse register

Pinned references were reviewed on 2026-08-20. No third-party source is copied
until its license notice and integration boundary are recorded here.

| Project | Pin | License | Approved use |
| --- | --- | --- | --- |
| vbenjs/vue-vben-admin | `e3369bd` | MIT | Enterprise web shell and UI patterns |
| ai-search-guru/getcito... | `8dc92cf` | MIT | Provider, scheduling, mention and citation design reference |
| yaojingang/GEORank | reviewed main | Apache-2.0 | Site diagnostics and structured GEO tools |
| nibzard/llm-answer-watcher | reviewed main | MIT | Extraction evaluation fixtures and cost metrics |
| artipub/artipub | reviewed main | MIT | Publisher plugin contract and Markdown processing |
| wechatsync/Wechatsync | reference only | GPL-3.0 | Behaviour research only; no source copied into core |
| gitroomhq/postiz-app | reference only | AGPL-3.0 | Architecture research only; no source copied into core |

## Reuse policy

- Prefer adapters around stable public APIs over source forks.
- Preserve copyright and license notices for copied MIT/Apache files.
- GPL/AGPL code stays outside the commercial core unless the product licensing
  decision explicitly changes.
- Browser automation connectors are optional plugins. Failure cannot corrupt
  content or publishing records.
- Every imported algorithm receives deterministic fixtures before acceptance.
