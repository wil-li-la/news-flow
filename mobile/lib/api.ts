import { NewsArticle } from '../types';

const ENV = (globalThis as any)?.process?.env || {};
const API_BASE: string = ENV.EXPO_PUBLIC_API_BASE_URL || 'https://a08y6nfdj0.execute-api.ap-southeast-2.amazonaws.com/prod';

function hostnameOf(u?: string | null): string | null {
  if (!u) return null;
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; }
}

function brandFromHost(host?: string | null): string | null {
  if (!host) return null;
  const h = host.toLowerCase();
  if (h.includes('bbc.')) return 'BBC News';
  if (h.includes('nytimes.com')) return 'NYT';
  if (h.includes('npr.org')) return 'NPR';
  if (h.includes('theverge.com')) return 'The Verge';
  if (h.includes('cnn.com')) return 'CNN';
  if (h.includes('reuters.com')) return 'Reuters';
  if (h.includes('apnews.com')) return 'AP News';
  if (h.includes('washingtonpost.com')) return 'The Washington Post';
  if (h.includes('wsj.com') || h.includes('wallstreetjournal.com')) return 'WSJ';
  if (h.includes('bloomberg.com')) return 'Bloomberg';
  return host;
}

function normalizeArticles(items: NewsArticle[]): NewsArticle[] {
  return items.map((a) => {
    const linkHost = hostnameOf(a.url);
    const sourceHost = a.source && /^https?:\/\//i.test(a.source) ? hostnameOf(a.source) : null;
    const brand = brandFromHost(linkHost || sourceHost || null);
    return {
      ...a,
      source: brand || a.source,
      imageUrl: a.imageUrl || null,
    };
  });
}

class TimeoutError extends Error {
  constructor(public url: string, public ms: number) {
    super(`Timeout after ${ms}ms for ${url}`);
    this.name = 'TimeoutError';
  }
}

class HttpError extends Error {
  constructor(public status: number, public url: string, public bodySnippet?: string) {
    super(`HTTP ${status} for ${url}${bodySnippet ? ` — ${bodySnippet}` : ''}`);
    this.name = 'HttpError';
  }
}

function toMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.amazonaws.com');
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit, ms = 8000) {
  if (!isValidUrl(url)) {
    throw new Error(`Invalid or disallowed URL: ${url}`);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...(init || {}), signal: ctrl.signal });
    return res;
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new TimeoutError(url, ms);
    throw new Error(`Network error for ${url}: ${toMessage(err)}`);
  } finally {
    clearTimeout(t);
  }
}

async function fetchNewsFromLambda(limit: number, seenIds: string[]): Promise<NewsArticle[]> {
  const seen = encodeURIComponent(seenIds.join(','));
  const url = `${API_BASE}/items?limit=${limit}&seen=${seen}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    let snippet = '';
    try { snippet = (await res.text()).slice(0, 200); } catch {}
    throw new HttpError(res.status, url, snippet);
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`Lambda JSON parse error for ${url}: ${toMessage(e)}`);
  }
}

export async function fetchNews(limit = 5, seenIds: string[] = []): Promise<NewsArticle[]> {
  const articles = await fetchNewsFromLambda(limit, seenIds);
  return normalizeArticles(articles);
}



async function searchLambda(query: string, limit: number): Promise<NewsArticle[]> {
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    let snippet = '';
    try { snippet = (await res.text()).slice(0, 200); } catch {}
    throw new HttpError(res.status, url, snippet);
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`Lambda search JSON parse error for ${url}: ${toMessage(e)}`);
  }
}

export async function searchNewsApi(query: string, limit = 20): Promise<NewsArticle[]> {
  const q = query.trim();
  if (!q) return [];
  
  const articles = await searchLambda(q, limit);
  return normalizeArticles(articles);
}
