import { NewsArticle } from '../types';

export const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Breakthrough in Renewable Energy Storage Technology',
    summary: 'Scientists develop new battery technology that could revolutionize how we store renewable energy, making solar and wind power more reliable than ever before.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Tech News Daily',
    publishedAt: '2025-01-21T10:30:00Z'
  },
  {
    id: '2',
    title: 'Ancient City Discovered in the Amazon Rainforest',
    summary: 'Archaeologists uncover a previously unknown civilization deep in the Amazon, revealing sophisticated urban planning and advanced agricultural techniques.',
    category: 'Science',
    region: 'South America',
    imageUrl: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Archaeological Review',
    publishedAt: '2025-01-21T09:15:00Z'
  },
  {
    id: '3',
    title: 'Global Climate Summit Reaches Historic Agreement',
    summary: 'World leaders commit to ambitious new carbon reduction targets and establish a $100 billion fund for developing nations to transition to clean energy.',
    category: 'Politics',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/3646171/pexels-photo-3646171.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'World Report',
    publishedAt: '2025-01-21T08:45:00Z'
  },
  {
    id: '4',
    title: 'Revolutionary Gene Therapy Shows Promise for Alzheimer\'s',
    summary: 'Clinical trials demonstrate significant improvement in memory and cognitive function using a new gene therapy approach for treating Alzheimer\'s disease.',
    category: 'Health',
    region: 'North America',
    imageUrl: 'https://images.pexels.com/photos/3951628/pexels-photo-3951628.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Medical Journal',
    publishedAt: '2025-01-21T07:20:00Z'
  },
  {
    id: '5',
    title: 'Cryptocurrency Market Reaches New All-Time High',
    summary: 'Digital currencies surge as institutional adoption grows, with Bitcoin and Ethereum leading a market-wide rally amid regulatory clarity.',
    category: 'Finance',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Crypto Weekly',
    publishedAt: '2025-01-21T06:00:00Z'
  },
  {
    id: '6',
    title: 'Space Mission to Europa Discovers Signs of Life',
    summary: 'NASA\'s Europa Clipper mission detects organic compounds and water vapor plumes, suggesting the moon could harbor microbial life beneath its icy surface.',
    category: 'Science',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Space Explorer',
    publishedAt: '2025-01-21T05:30:00Z'
  },
  {
    id: '7',
    title: 'Major Earthquake Rocks Pacific Ring of Fire',
    summary: 'A 7.2 magnitude earthquake strikes the Pacific region, triggering tsunami warnings and prompting evacuation of coastal areas across multiple countries.',
    category: 'World',
    region: 'Asia Pacific',
    imageUrl: 'https://images.pexels.com/photos/71104/utah-mountain-biking-bike-biking-71104.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Global News Network',
    publishedAt: '2025-01-21T04:15:00Z'
  },
  {
    id: '8',
    title: 'AI Breakthrough: Computer Passes Advanced Reasoning Test',
    summary: 'A new artificial intelligence system demonstrates human-like reasoning abilities, solving complex problems and showing unprecedented understanding of context.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'AI Research Today',
    publishedAt: '2025-01-21T03:45:00Z'
  },
  {
    id: '9',
    title: 'Olympic Games Set New Sustainability Records',
    summary: 'The upcoming Olympics achieve carbon neutrality through innovative renewable energy solutions and sustainable construction practices.',
    category: 'Sports',
    region: 'Europe',
    imageUrl: 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Sports International',
    publishedAt: '2025-01-21T02:20:00Z'
  },
  {
    id: '10',
    title: 'Quantum Computing Milestone Achieved',
    summary: 'Researchers successfully demonstrate quantum supremacy in solving real-world optimization problems, opening new possibilities for drug discovery and logistics.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Quantum Times',
    publishedAt: '2025-01-21T01:00:00Z'
  }
];

export const getRandomNews = (excludeIds: string[] = []): NewsArticle[] => {
  return mockNews.filter(article => !excludeIds.includes(article.id));
};

export const getPersonalizedNews = (
  preferences: UserPreferences,
  excludeIds: string[] = []
): NewsArticle[] => {
  const availableNews = mockNews.filter(article => !excludeIds.includes(article.id));
  
  return availableNews
    .map(article => ({
      ...article,
      score: calculatePersonalizationScore(article, preferences)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const calculatePersonalizationScore = (article: NewsArticle, preferences: UserPreferences): number => {
  let score = 0;
  
  // Category preferences
  const categoryLikes = preferences.likedCategories[article.category] || 0;
  const categoryDislikes = preferences.dislikedCategories[article.category] || 0;
  score += categoryLikes * 2 - categoryDislikes * 3;
  
  // Region preferences
  const regionLikes = preferences.likedRegions[article.region] || 0;
  const regionDislikes = preferences.dislikedRegions[article.region] || 0;
  score += regionLikes * 1.5 - regionDislikes * 2;
  
  return score;
};