import type { ProviderAnswer } from '@geov4/domain';

export interface ProviderRequest {
  prompt: string;
  model?: string;
}

export interface AiProvider {
  id: string;
  execute(request: ProviderRequest): Promise<ProviderAnswer>;
}

export class MockProvider implements AiProvider {
  readonly id = 'mock';
  async execute(request: ProviderRequest): Promise<ProviderAnswer> {
    return {
      provider: this.id,
      model: request.model ?? 'deterministic-fixture-v1',
      rawText: `模拟回答：${request.prompt}`,
      citations: [],
      latencyMs: 0,
      isMock: true,
    };
  }
}

export interface OpenAiCompatibleConfig {
  id: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  timeoutMs?: number;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly id: string;
  constructor(private readonly config: OpenAiCompatibleConfig) { this.id = config.id; }

  async execute(request: ProviderRequest): Promise<ProviderAnswer> {
    const startedAt = Date.now();
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.config.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: request.model ?? this.config.defaultModel, messages: [{ role: 'user', content: request.prompt }], temperature: 0 }),
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 60_000),
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const payload = await response.json() as { model?: string; citations?: Array<string | { url?: string }>; choices?: Array<{ message?: { content?: string }; citations?: Array<string | { url?: string }> }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const choice = payload.choices?.[0];
    const rawText = choice?.message?.content?.trim();
    if (!rawText) throw new Error('provider_empty_response');
    return {
      provider: this.id,
      model: payload.model ?? request.model ?? this.config.defaultModel,
      rawText,
      citations: [...(payload.citations ?? []), ...(choice?.citations ?? [])].flatMap((item) => typeof item === 'string' ? [item] : item.url ? [item.url] : []),
      latencyMs: Date.now() - startedAt,
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
      isMock: false,
    };
  }
}

export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic';
  constructor(private readonly config: { apiKey: string; defaultModel: string; baseUrl?: string; timeoutMs?: number }) {}
  async execute(request: ProviderRequest): Promise<ProviderAnswer> {
    const startedAt = Date.now();
    const response = await fetch(`${this.config.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, { method: 'POST', headers: { 'x-api-key': this.config.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: request.model ?? this.config.defaultModel, max_tokens: 4096, temperature: 0, messages: [{ role: 'user', content: request.prompt }] }), signal: AbortSignal.timeout(this.config.timeoutMs ?? 60_000) });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const payload = await response.json() as { model?: string; content?: Array<{ type?: string; text?: string; source?: { url?: string } }>; usage?: { input_tokens?: number; output_tokens?: number } };
    const rawText = payload.content?.filter((item) => item.type === 'text').map((item) => item.text ?? '').join('\n').trim(); if (!rawText) throw new Error('provider_empty_response');
    return { provider: this.id, model: payload.model ?? request.model ?? this.config.defaultModel, rawText, citations: payload.content?.flatMap((item) => item.source?.url ? [item.source.url] : []) ?? [], latencyMs: Date.now() - startedAt, inputTokens: payload.usage?.input_tokens, outputTokens: payload.usage?.output_tokens, isMock: false };
  }
}

export class GeminiProvider implements AiProvider {
  readonly id = 'gemini';
  constructor(private readonly config: { apiKey: string; defaultModel: string; baseUrl?: string; timeoutMs?: number }) {}
  async execute(request: ProviderRequest): Promise<ProviderAnswer> {
    const startedAt = Date.now(); const model = request.model ?? this.config.defaultModel;
    const response = await fetch(`${this.config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: request.prompt }] }], generationConfig: { temperature: 0 } }), signal: AbortSignal.timeout(this.config.timeoutMs ?? 60_000) });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string } }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
    const candidate = payload.candidates?.[0]; const rawText = candidate?.content?.parts?.map((part) => part.text ?? '').join('\n').trim(); if (!rawText) throw new Error('provider_empty_response');
    return { provider: this.id, model, rawText, citations: candidate?.groundingMetadata?.groundingChunks?.flatMap((chunk) => chunk.web?.uri ? [chunk.web.uri] : []) ?? [], latencyMs: Date.now() - startedAt, inputTokens: payload.usageMetadata?.promptTokenCount, outputTokens: payload.usageMetadata?.candidatesTokenCount, isMock: false };
  }
}

export class ProviderRegistry {
  private readonly providers = new Map<string, AiProvider>();
  constructor(providers: AiProvider[]) { for (const provider of providers) this.providers.set(provider.id, provider); }
  get(id: string): AiProvider {
    const provider = this.providers.get(id);
    if (!provider) throw new Error('provider_not_configured');
    return provider;
  }
}
