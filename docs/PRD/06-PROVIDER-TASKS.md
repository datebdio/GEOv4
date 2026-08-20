# Provider and Task Engine PRD

## Goal

Run reliable, cost-controlled detections across multiple providers.

## Scope

- OpenAI-compatible and dedicated provider adapters.
- Encrypted credentials, connection tests and model discovery.
- Mock mode clearly separated from production results.
- Queue, retry, timeout, rate limit, cancellation and cost tracking.
- Scheduled and manual detection tasks.

## Acceptance

A failed provider call exposes its reason and retry history. A successful call
stores its raw answer, model, latency, token usage and estimated cost.
