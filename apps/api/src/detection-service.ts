import { analyzeVisibility, type BrandDictionary } from '@geov4/domain';
import type { ProviderRegistry } from './providers.js';
import type { Repositories } from './repositories.js';

export class DetectionService {
  constructor(private readonly repositories: Repositories, private readonly providers: ProviderRegistry) {}

  async execute(input: { promptId: string; provider: string; model?: string; brands: BrandDictionary[] }) {
    const prompt = await this.repositories.prompts.get(input.promptId);
    if (!prompt) throw new Error('prompt_not_found');
    const provider = this.providers.get(input.provider);
    const run = await this.repositories.detections.create({ promptId: prompt.id, provider: provider.id, model: input.model ?? 'default', isMock: provider.id === 'mock' });
    try {
      const answer = await provider.execute({ prompt: prompt.question, model: input.model });
      const analysis = analyzeVisibility(answer, input.brands);
      return await this.repositories.detections.succeed(run.id, answer, analysis);
    } catch (error) {
      await this.repositories.detections.fail(run.id, error instanceof Error ? error.message : 'unknown_error');
      throw error;
    }
  }
}
