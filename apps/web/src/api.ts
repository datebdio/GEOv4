export interface Brand { id: string; name: string; website: string | null; aliases: string[]; locale: string; archived: boolean }
export interface Prompt { id: string; question: string; intent: string; priority: number; tags: string[]; active: boolean }
export interface Detection { id: string; promptId: string; provider: string; model: string; status: string; isMock: boolean; }
export interface VisibilitySummary { sampleSize: number; mentionRate: number | null; averageRank: number | null; citationCount: number; citationDomains: string[] }
export interface Opportunity { promptId: string; question: string; intent: string; priority: number; sampleSize: number; mentionCount: number; gapRate: number | null; score: number | null }
export interface ContentVersion { id: string; version: number; bodyMarkdown: string; evidenceUrls: string[]; changeNote: string | null }
export interface ContentItem { id: string; brandId: string; promptId: string | null; title: string; status: 'draft' | 'review' | 'approved' | 'archived'; versions: ContentVersion[] }
export interface Publication { id: string; contentId: string; versionId: string; platform: string; account: string; status: string; canonicalUrl: string | null }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { 'content-type': 'application/json', ...options?.headers } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? `HTTP ${response.status}`);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
export const api = {
  brands: () => request<Brand[]>('/api/v1/brands'),
  createBrand: (input: { name: string; website?: string | null; aliases: string[] }) => request<Brand>('/api/v1/brands', { method: 'POST', body: JSON.stringify(input) }),
  prompts: () => request<Prompt[]>('/api/v1/prompts'),
  createPrompt: (input: { question: string; intent: string; priority: number; tags: string[] }) => request<Prompt>('/api/v1/prompts', { method: 'POST', body: JSON.stringify(input) }),
  detections: () => request<Detection[]>('/api/v1/detections'),
  detect: (input: { promptId: string; provider: string; brands: Array<{ id: string; name: string; aliases: string[]; kind: 'brand' }> }) => request<Detection>('/api/v1/detections', { method: 'POST', body: JSON.stringify(input) }),
  visibility: () => request<VisibilitySummary>('/api/v1/analytics/visibility'),
  opportunities: (brandId: string) => request<Opportunity[]>(`/api/v1/opportunities?brandId=${encodeURIComponent(brandId)}`),
  contents: () => request<ContentItem[]>('/api/v1/contents'),
  createContent: (input: { brandId: string; promptId?: string | null; title: string; bodyMarkdown: string; evidenceUrls: string[] }) => request<ContentItem>('/api/v1/contents', { method: 'POST', body: JSON.stringify(input) }),
  setContentStatus: (id: string, status: ContentItem['status']) => request<ContentItem>(`/api/v1/contents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  exportContent: (id: string, platform: string) => request<{ title: string; markdown: string; html: string }>(`/api/v1/contents/${id}/export?platform=${platform}`),
  publications: () => request<Publication[]>('/api/v1/publications'),
  createPublication: (input: { contentId: string; versionId: string; platform: string; account: string }) => request<Publication>('/api/v1/publications', { method: 'POST', body: JSON.stringify(input) }),
  markPublished: (id: string, canonicalUrl: string) => request<Publication>(`/api/v1/publications/${id}/published`, { method: 'PATCH', body: JSON.stringify({ canonicalUrl }) }),
};
