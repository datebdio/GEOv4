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
    const payload = await response.json() as { model?: string; choices?: Array<{ message?: { content?: string }; citations?: string[] }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const choice = payload.choices?.[0];
    const rawText = choice?.message?.content?.trim();
    if (!rawText) throw new Error('provider_empty_response');
    return {
      provider: this.id,
      model: payload.model ?? request.model ?? this.config.defaultModel,
      rawText,
      citations: choice?.citations ?? [],
      latencyMs: Date.now() - startedAt,
      inputTokens: payload.usage?.prompt_tokens,
      outputTokens: payload.usage?.completion_tokens,
      isMock: false,
    };
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
