import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider, GeminiProvider, OpenAiCompatibleProvider } from './providers.js';

afterEach(() => vi.unstubAllGlobals());
function response(payload: unknown) { return { ok: true, json: async () => payload } as Response; }

describe('provider adapters', () => {
  it('extracts Perplexity-style top-level citations from OpenAI-compatible responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ model: 'sonar', choices: [{ message: { content: 'GEOv4 被引用。' } }], citations: ['https://example.com/source'], usage: { prompt_tokens: 10, completion_tokens: 5 } })));
    const answer = await new OpenAiCompatibleProvider({ id: 'perplexity', baseUrl: 'https://api.test', apiKey: 'secret', defaultModel: 'sonar' }).execute({ prompt: '测试' });
    expect(answer).toMatchObject({ provider: 'perplexity', citations: ['https://example.com/source'], inputTokens: 10, isMock: false });
  });

  it('parses Anthropic text and citation source blocks', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ model: 'claude-test', content: [{ type: 'text', text: 'Claude 回答' }, { type: 'citation', source: { url: 'https://example.com/claude' } }], usage: { input_tokens: 4, output_tokens: 3 } })));
    const answer = await new AnthropicProvider({ apiKey: 'secret', defaultModel: 'claude-test' }).execute({ prompt: '测试' });
    expect(answer).toMatchObject({ rawText: 'Claude 回答', citations: ['https://example.com/claude'], outputTokens: 3 });
  });

  it('parses Gemini grounding metadata', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ candidates: [{ content: { parts: [{ text: 'Gemini 回答' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://example.com/gemini' } }] } }], usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 } })));
    const answer = await new GeminiProvider({ apiKey: 'secret', defaultModel: 'gemini-test' }).execute({ prompt: '测试' });
    expect(answer).toMatchObject({ rawText: 'Gemini 回答', citations: ['https://example.com/gemini'], inputTokens: 7 });
  });
});
