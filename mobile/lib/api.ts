import { Platform } from 'react-native';
import { NewsArticle } from '../types';
import { getRandomNews, searchNews as searchNewsFallback } from './mockNews';
import { AWS_CONFIG } from './awsConfig';

// Access Expo public envs in RN-safe way
const ENV = (globalThis as any)?.process?.env || {};
const API_BASE: string = ENV.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'ios' ? 'http://localhost:3001' : 'http://10.0.2.2:3001');

// Optional DynamoDB HTTP proxy (e.g., API Gateway/Lambda exposing DynamoDB queries directly)
// Set EXPO_PUBLIC_DDB_BASE_URL to enable DDB-first strategy.
const DDB_BASE: string | undefined = ENV.EXPO_PUBLIC_DDB_BASE_URL as string | undefined;

async function fetchWithTimeout(url: string, init?: RequestInit, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...(init || {}), signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function tryDdbNews(limit: number, seenIds: string[]): Promise<NewsArticle[] | null> {
  if (!DDB_BASE) return null;
  // Optionally require AWS_CONFIG to be non-null before trying DDB
  if (!AWS_CONFIG) return null;
  try {
    const seen = encodeURIComponent(seenIds.join(','));
    const res = await fetchWithTimeout(`${DDB_BASE}/news?limit=${limit}&seen=${seen}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data as NewsArticle[];
  } catch {
    return null;
  }
}

async function tryApiNews(limit: number, seenIds: string[]): Promise<NewsArticle[] | null> {
  try {
    const seen = encodeURIComponent(seenIds.join(','));
    const res = await fetchWithTimeout(`${API_BASE}/api/news?limit=${limit}&seen=${seen}`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchNews(limit = 5, seenIds: string[] = []): Promise<NewsArticle[]> {
  // Priority: DDB → API → mock
  const fromDdb = await tryDdbNews(limit, seenIds);
  if (fromDdb && fromDdb.length) return fromDdb;

  const fromApi = await tryApiNews(limit, seenIds);
  if (fromApi && fromApi.length) return fromApi;

  const available = getRandomNews(seenIds);
  return available.sort(() => Math.random() - 0.5).slice(0, limit);
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

async function tryDdbSearch(query: string, limit: number): Promise<NewsArticle[] | null> {
  if (!DDB_BASE) return null;
  if (!AWS_CONFIG) return null;
  try {
    const res = await fetchWithTimeout(`${DDB_BASE}/news/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data as NewsArticle[];
  } catch {
    return null;
  }
}

async function tryApiSearch(query: string, limit: number): Promise<NewsArticle[] | null> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/news/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchNewsApi(query: string, limit = 20): Promise<NewsArticle[]> {
  const q = query.trim();
  if (!q) return [];

  // Priority: DDB → API → mock
  const fromDdb = await tryDdbSearch(q, limit);
  if (fromDdb && fromDdb.length) return fromDdb;

  const fromApi = await tryApiSearch(q, limit);
  if (fromApi && fromApi.length) return fromApi;

  return searchNewsFallback(q, limit);
}
