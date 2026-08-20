import { describe, expect, it } from 'vitest';
import { analyzeVisibility, extractMentions, normalizeCitation } from './visibility.js';

const brands = [
  { id: 'own', name: 'GEOv4', aliases: ['GEO V4'], kind: 'brand' as const },
  { id: 'rival', name: 'Rival', aliases: [], kind: 'competitor' as const },
];

describe('visibility analysis', () => {
  it('detects each brand once and preserves answer order', () => {
    expect(extractMentions('Rival is useful, while GEO V4 is stronger.', brands)).toEqual([
      { brandId: 'rival', matchedText: 'Rival', position: 0, rank: 1, confidence: 1 },
      { brandId: 'own', matchedText: 'GEO V4', position: 23, rank: 2, confidence: 1 },
    ]);
  });

  it('normalizes citation domains and tracking parameters', () => {
    expect(normalizeCitation('https://www.example.com/a?utm_source=x&id=1#top', 0)).toMatchObject({
      normalizedUrl: 'https://www.example.com/a?id=1',
      domain: 'example.com',
    });
  });

  it('keeps mock provenance with the response, not calculated metrics', () => {
    const result = analyzeVisibility(
      { provider: 'mock', model: 'fixture', rawText: 'GEOv4', latencyMs: 1, isMock: true },
      brands,
    );
    expect(result.analyzerVersion).toBe('0.1.0');
    expect(result.mentions).toHaveLength(1);
  });
});
