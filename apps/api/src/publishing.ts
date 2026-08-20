import type { PublicationPlatform } from './repositories.js';

const platformLabels: Record<PublicationPlatform, string> = { zhihu: '知乎', baijiahao: '百家号', toutiao: '今日头条', sohu: '搜狐号' };

function escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }

export function renderChannelContent(input: { platform: PublicationPlatform; title: string; bodyMarkdown: string }) {
  const titleLimit = input.platform === 'toutiao' ? 30 : input.platform === 'baijiahao' ? 40 : 80;
  const title = input.title.slice(0, titleLimit);
  const footer = `\n\n---\n发布渠道：${platformLabels[input.platform]}`;
  const markdown = `# ${title}\n\n${input.bodyMarkdown.trim()}${footer}\n`;
  const htmlBody = input.bodyMarkdown.trim().split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`).join('\n');
  return { platform: input.platform, title, markdown, html: `<article><h1>${escapeHtml(title)}</h1>${htmlBody}</article>`, filenameBase: `${input.platform}-${title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60)}` };
}
