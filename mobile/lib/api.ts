import { Platform } from 'react-native';
import { NewsArticle } from '../types';
import { getRandomNews, searchNews as searchNewsFallback } from './mockNews';

const ENV_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

function getDefaultBase() {
  if (Platform.OS === 'ios') return 'http://localhost:3001';
  return 'http://10.0.2.2:3001'; // Android emulator default
}

const API_BASE = ENV_BASE || getDefaultBase();

export async function fetchNews(limit = 5, seenIds: string[] = []): Promise<NewsArticle[]> {
  try {
    const seen = encodeURIComponent(seenIds.join(','));
    const res = await fetch(`${API_BASE}/api/news?limit=${limit}&seen=${seen}`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    // Fallback to local mock when API not available
    const available = getRandomNews(seenIds);
    return available.sort(() => Math.random() - 0.5).slice(0, limit);
  }
}

export async function summarize(title: string, text: string, maxWords = 80): Promise<{ summary?: string; bullets?: string[] } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/summarize`, {
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

export async function searchNewsApi(query: string, limit = 20): Promise<NewsArticle[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`${API_BASE}/api/news/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return searchNewsFallback(q, limit);
  }
}
