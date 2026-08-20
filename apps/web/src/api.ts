export interface Brand { id: string; name: string; website: string | null; aliases: string[]; locale: string; archived: boolean }
export interface Prompt { id: string; question: string; intent: string; priority: number; tags: string[]; active: boolean }
export interface Detection { id: string; promptId: string; provider: string; model: string; status: string; isMock: boolean; }
export interface VisibilitySummary { sampleSize: number; mentionRate: number | null; averageRank: number | null; citationCount: number; citationDomains: string[] }

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
};
