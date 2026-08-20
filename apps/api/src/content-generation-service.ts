import type { ProviderRegistry } from './providers.js';
import type { Repositories } from './repositories.js';

export class ContentGenerationService {
  constructor(private readonly repositories: Repositories, private readonly providers: ProviderRegistry) {}
  async generate(input: { brandId: string; promptId: string; provider: string; model?: string; evidenceUrls: string[]; instructions?: string }) {
    const [brand, prompt] = await Promise.all([this.repositories.brands.get(input.brandId), this.repositories.prompts.get(input.promptId)]);
    if (!brand) throw new Error('brand_not_found'); if (!prompt) throw new Error('prompt_not_found');
    const evidence = input.evidenceUrls.length ? input.evidenceUrls.map((url) => `- ${url}`).join('\n') : '- 暂无外部证据；不得编造具体数据';
    const generationPrompt = `你是企业GEO内容编辑。请围绕用户问题撰写可核验的Markdown文章。\n品牌：${brand.name}\n用户问题：${prompt.question}\n事实依据：\n${evidence}\n要求：${input.instructions ?? '直接回答问题，结构清晰；没有证据的数据不要编造；结尾列出参考来源。'}\n只输出正文Markdown。`;
    const answer = await this.providers.get(input.provider).execute({ prompt: generationPrompt, model: input.model });
    return this.repositories.contents.create({ brandId: brand.id, promptId: prompt.id, title: prompt.question, bodyMarkdown: answer.rawText, evidenceUrls: input.evidenceUrls });
  }
}
