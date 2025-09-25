import { Platform } from 'react-native';
import { NewsArticle } from '../types';
import { AWS_CONFIG } from './awsConfig';

// Access Expo public envs in RN-safe way
const ENV = (globalThis as any)?.process?.env || {};
const API_BASE: string = ENV.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'ios' ? 'http://localhost:3001' : 'http://10.0.2.2:3001');

// Optional DynamoDB HTTP proxy (e.g., API Gateway/Lambda exposing DynamoDB queries directly)
// Set EXPO_PUBLIC_DDB_BASE_URL to enable DDB-first strategy.
const DDB_BASE: string | undefined = ENV.EXPO_PUBLIC_DDB_BASE_URL as string | undefined;

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

async function fetchWithTimeout(url: string, init?: RequestInit, ms = 8000) {
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

async function tryDdbNews(limit: number, seenIds: string[]): Promise<NewsArticle[] | null> {
  if (!DDB_BASE) return null; // DDB not configured: skip
  const seen = encodeURIComponent(seenIds.join(','));
  const url = `${DDB_BASE}/items?limit=${limit}&seen=${seen}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    let snippet = '';
    try { snippet = (await res.text()).slice(0, 200); } catch {}
    throw new HttpError(res.status, url, snippet);
  }
  let data: unknown;
  try { data = await res.json(); } catch (e) { throw new Error(`DDB JSON parse error for ${url}: ${toMessage(e)}`); }
  if (!Array.isArray(data)) {
    throw new Error(`DDB unexpected response (expected array) for ${url}`);
  }
  return data as NewsArticle[];
}

async function tryApiNews(limit: number, seenIds: string[]): Promise<NewsArticle[] | null> {
  const seen = encodeURIComponent(seenIds.join(','));
  const url = `${API_BASE}/api/news?limit=${limit}&seen=${seen}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    let snippet = '';
    try { snippet = (await res.text()).slice(0, 200); } catch {}
    throw new HttpError(res.status, url, snippet);
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`API JSON parse error for ${url}: ${toMessage(e)}`);
  }
}

export async function fetchNews(limit = 5, seenIds: string[] = []): Promise<NewsArticle[]> {
  // Priority: DDB → API. On failure, throw with detailed reasons.
  let ddbItems: NewsArticle[] | null = null;
  let ddbErr: string | null = null;
  if (DDB_BASE) {
    try {
      ddbItems = await tryDdbNews(limit, seenIds);
    } catch (e) {
      ddbErr = `DDB failed: ${toMessage(e)}`;
    }
    if (ddbItems && ddbItems.length) {
      const normalized = normalizeArticles(ddbItems);
      const hasImages = normalized.some(a => (a.imageUrl || '').toString().trim().length > 0);
      if (hasImages) return normalized;
      ddbErr = ddbErr || 'DDB items missing images';
    }
  }

  let apiItems: NewsArticle[] | null = null;
  let apiErr: string | null = null;
  try {
    apiItems = await tryApiNews(limit, seenIds);
  } catch (e) {
    apiErr = `API failed: ${toMessage(e)}`;
  }
  if (apiItems && apiItems.length) return normalizeArticles(apiItems);

  const reasons: string[] = [];
  if (ddbErr) reasons.push(ddbErr);
  else if (DDB_BASE) reasons.push('DDB returned 0 items');
  else reasons.push('DDB skipped (not configured)');
  if (apiErr) reasons.push(apiErr);
  else reasons.push('API returned 0 items');

  throw new Error(`fetchNews failed — ${reasons.join(' | ')}`);
}

export async function summarize(title: string, text: string, maxWords = 80): Promise<{ summary?: string; bullets?: string[] } | null> {
  // Summarization remains API-based; return null on failure
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text, maxWords })
    });
    if (!res.ok) return null;
    const j = await res.json();
    return { summary: j.summary, bullets: j.bullets };
  } catch {
    return null;
  }
}

// DDB does not support search in your setup (only GET /items and GET /items/{id}).

async function tryApiSearch(query: string, limit: number): Promise<NewsArticle[] | null> {
  const url = `${API_BASE}/api/news/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    let snippet = '';
    try { snippet = (await res.text()).slice(0, 200); } catch {}
    throw new HttpError(res.status, url, snippet);
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`API JSON parse error for ${url}: ${toMessage(e)}`);
  }
}

export async function searchNewsApi(query: string, limit = 20): Promise<NewsArticle[]> {
  const q = query.trim();
  if (!q) return [];

  // Only API search is supported
  let fromApi: NewsArticle[] | null = null;
  try {
    fromApi = await tryApiSearch(q, limit);
  } catch (e) {
    throw new Error(`searchNewsApi failed — API: ${toMessage(e)}`);
  }
  if (fromApi) return normalizeArticles(fromApi);
  // An empty array is a valid, non-error result
  return [];
}
