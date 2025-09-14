import { NewsArticle } from '../types';

export const extendedMockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Breakthrough in Renewable Energy Storage Technology',
    summary: 'New battery tech could revolutionize renewable energy storage.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Tech News Daily',
    publishedAt: '2025-01-21T10:30:00Z'
  },
  {
    id: '2',
    title: 'Ancient City Discovered in the Amazon Rainforest',
    summary: 'Archaeologists uncover a previously unknown civilization.',
    category: 'Science',
    region: 'South America',
    imageUrl: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Archaeological Review',
    publishedAt: '2025-01-21T09:15:00Z'
  },
  {
    id: '3',
    title: 'Global Climate Summit Reaches Historic Agreement',
    summary: 'Leaders commit to ambitious new carbon reduction targets.',
    category: 'Politics',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/3646171/pexels-photo-3646171.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'World Report',
    publishedAt: '2025-01-21T08:45:00Z'
  },
  {
    id: '4',
    title: "AI Breakthrough: Model Shows Advanced Reasoning",
    summary: 'New AI demonstrates human-like reasoning on complex tasks.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'AI Research Today',
    publishedAt: '2025-01-21T03:45:00Z'
  },
  {
    id: '5',
    title: 'Quantum Computing Milestone Achieved',
    summary: 'Researchers demonstrate quantum advantage on real problems.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Quantum Times',
    publishedAt: '2025-01-21T01:00:00Z'
  }
];

export const getRandomNews = (excludeIds: string[] = []) =>
  extendedMockNews.filter(a => !excludeIds.includes(a.id));

export const searchNews = (query: string, limit = 20) => {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  return extendedMockNews
    .map(a => ({
      a,
      score: terms.reduce((s, t) => s + ((`${a.title} ${a.summary ?? ''} ${a.category ?? ''} ${a.region ?? ''}`.toLowerCase().includes(t)) ? 1 : 0), 0)
    }))
    .filter(x => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(x => x.a);
};

