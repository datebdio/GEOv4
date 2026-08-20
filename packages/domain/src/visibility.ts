export interface BrandDictionary {
  id: string;
  name: string;
  aliases: string[];
  kind: 'brand' | 'competitor';
}

export interface ProviderAnswer {
  provider: string;
  model: string;
  rawText: string;
  citations?: readonly string[];
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  isMock: boolean;
}

export interface Mention {
  brandId: string;
  matchedText: string;
  position: number;
  rank: number;
  confidence: number;
}

export interface Citation {
  originalUrl: string;
  normalizedUrl: string;
  domain: string;
  position: number;
}

export interface VisibilityAnalysis {
  analyzerVersion: '0.1.0';
  mentions: Mention[];
  citations: Citation[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizedAliases(brand: BrandDictionary): string[] {
  return [brand.name, ...brand.aliases]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

export function extractMentions(
  rawText: string,
  brands: BrandDictionary[],
): Mention[] {
  const found = brands.flatMap((brand) => {
    const candidates = normalizedAliases(brand).flatMap((alias) => {
      const match = new RegExp(escapeRegExp(alias), 'iu').exec(rawText);
      return match
        ? [{ brandId: brand.id, matchedText: match[0], position: match.index }]
        : [];
    });
    const first = candidates.sort((a, b) => a.position - b.position)[0];
    return first ? [first] : [];
  });

  return found
    .sort((a, b) => a.position - b.position)
    .map((mention, index) => ({ ...mention, rank: index + 1, confidence: 1 }));
}

export function normalizeCitation(urlValue: string, position: number): Citation | null {
  try {
    const url = new URL(urlValue);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
    }
    const normalizedUrl = url.toString();
    return {
      originalUrl: urlValue,
      normalizedUrl,
      domain: url.hostname.toLowerCase().replace(/^www\./, ''),
      position,
    };
  } catch {
    return null;
  }
}

export function analyzeVisibility(
  answer: ProviderAnswer,
  brands: BrandDictionary[],
): VisibilityAnalysis {
  const citations = (answer.citations ?? [])
    .map(normalizeCitation)
    .filter((citation): citation is Citation => citation !== null);
  return {
    analyzerVersion: '0.1.0',
    mentions: extractMentions(answer.rawText, brands),
    citations,
  };
}
