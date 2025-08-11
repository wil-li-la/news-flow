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