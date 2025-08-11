export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  region: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

export interface UserPreferences {
  likedCategories: { [key: string]: number };
  likedRegions: { [key: string]: number };
  dislikedCategories: { [key: string]: number };
  dislikedRegions: { [key: string]: number };
  personalizedRatio: number; // 0-1, where 1 is 100% personalized
}

export interface SwipeAction {
  articleId: string;
  direction: 'left' | 'right';
  article: NewsArticle;
}

export interface MindMapNode {
  id: string;
  title: string;
  category: string;
  region: string;
  sentiment: 'liked' | 'disliked';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface MindMapLink {
  source: string | MindMapNode;
  target: string | MindMapNode;
  strength: number; // 0-1, how related the articles are
  type: 'category' | 'region' | 'semantic';
}