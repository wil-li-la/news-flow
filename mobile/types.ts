export interface NewsArticle {
  id: string;
  title: string;
  url?: string;
  source: string;
  imageUrl?: string | null;
  description?: string;
  publishedAt?: string | null;
  summary?: string;
  bullets?: string[];
  category?: string;
  region?: string;
}

export type SwipeDirection = 'left' | 'right';

export interface SwipeAction {
  articleId: string;
  direction: SwipeDirection;
  article: NewsArticle;
}

export interface TimelineEvent {
  id: string;
  date: string | null | undefined;
  title: string;
  summary?: string;
  articleId: string;
  importance: number; // 0-1
}

export interface KeywordCluster {
  id: string;
  keyword: string;
  articles: NewsArticle[];
  sentiment: 'positive' | 'negative' | 'mixed';
  frequency: number;
  lastUpdated: string;
  relatedKeywords: string[];
}

export interface KnowledgeSeries {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  articles: NewsArticle[];
  timeline: TimelineEvent[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export type MindMapViewMode = 'semantic' | 'category' | 'region';

export interface MindMapNode {
  id: string;
  title: string;
  category: string;
  region: string;
  sentiment: 'liked' | 'disliked';
  nodeType?: 'keyword' | 'category' | 'region' | 'article';
  articleCount?: number;
}

export interface MindMapLink {
  source: string; // node id
  target: string; // node id
  strength: number; // 0-1
  type: 'category' | 'region' | 'semantic';
}
