import { NewsArticle } from '../types';

export const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Breakthrough in Renewable Energy Storage Technology',
    description: 'Scientists develop new battery technology that could revolutionize how we store renewable energy, making solar and wind power more reliable than ever before.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Tech News Daily',
    publishedAt: '2025-01-21T10:30:00Z',
    url: 'https://example.com/renewable-energy-storage'
  },
  {
    id: '2',
    title: 'Ancient City Discovered in the Amazon Rainforest',
    description: 'Archaeologists uncover a previously unknown civilization deep in the Amazon, revealing sophisticated urban planning and advanced agricultural techniques.',
    category: 'Science',
    region: 'South America',
    imageUrl: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Archaeological Review',
    publishedAt: '2025-01-21T09:15:00Z',
    url: 'https://example.com/amazon-ancient-city'
  },
  {
    id: '3',
    title: 'Global Climate Summit Reaches Historic Agreement',
    description: 'World leaders commit to ambitious new carbon reduction targets and establish a $100 billion fund for developing nations to transition to clean energy.',
    category: 'Politics',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/3646171/pexels-photo-3646171.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'World Report',
    publishedAt: '2025-01-21T08:45:00Z',
    url: 'https://example.com/climate-summit'
  },
  {
    id: '4',
    title: 'Revolutionary Gene Therapy Shows Promise for Alzheimer\'s',
    description: 'Clinical trials demonstrate significant improvement in memory and cognitive function using a new gene therapy approach for treating Alzheimer\'s disease.',
    category: 'Health',
    region: 'North America',
    imageUrl: 'https://images.pexels.com/photos/3951628/pexels-photo-3951628.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Medical Journal',
    publishedAt: '2025-01-21T07:20:00Z',
    url: 'https://example.com/gene-therapy-alzheimers'
  },
  {
    id: '5',
    title: 'Cryptocurrency Market Reaches New All-Time High',
    description: 'Digital currencies surge as institutional adoption grows, with Bitcoin and Ethereum leading a market-wide rally amid regulatory clarity.',
    category: 'Finance',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Crypto Weekly',
    publishedAt: '2025-01-21T06:00:00Z',
    url: 'https://example.com/crypto-all-time-high'
  },
  {
    id: '6',
    title: 'Space Mission to Europa Discovers Signs of Life',
    description: 'NASA\'s Europa Clipper mission detects organic compounds and water vapor plumes, suggesting the moon could harbor microbial life beneath its icy surface.',
    category: 'Science',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/110854/pexels-photo-110854.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Space Explorer',
    publishedAt: '2025-01-21T05:30:00Z',
    url: 'https://example.com/europa-signs-of-life'
  },
  {
    id: '7',
    title: 'Major Earthquake Rocks Pacific Ring of Fire',
    description: 'A 7.2 magnitude earthquake strikes the Pacific region, triggering tsunami warnings and prompting evacuation of coastal areas across multiple countries.',
    category: 'World',
    region: 'Asia Pacific',
    imageUrl: 'https://images.pexels.com/photos/71104/utah-mountain-biking-bike-biking-71104.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Global News Network',
    publishedAt: '2025-01-21T04:15:00Z',
    url: 'https://example.com/pacific-earthquake'
  },
  {
    id: '8',
    title: 'AI Breakthrough: Computer Passes Advanced Reasoning Test',
    description: 'A new artificial intelligence system demonstrates human-like reasoning abilities, solving complex problems and showing unprecedented understanding of context.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'AI Research Today',
    publishedAt: '2025-01-21T03:45:00Z',
    url: 'https://example.com/ai-reasoning-breakthrough'
  },
  {
    id: '9',
    title: 'Olympic Games Set New Sustainability Records',
    description: 'The upcoming Olympics achieve carbon neutrality through innovative renewable energy solutions and sustainable construction practices.',
    category: 'Sports',
    region: 'Europe',
    imageUrl: 'https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Sports International',
    publishedAt: '2025-01-21T02:20:00Z',
    url: 'https://example.com/olympics-sustainability'
  },
  {
    id: '10',
    title: 'Quantum Computing Milestone Achieved',
    description: 'Researchers successfully demonstrate quantum supremacy in solving real-world optimization problems, opening new possibilities for drug discovery and logistics.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Quantum Times',
    publishedAt: '2025-01-21T01:00:00Z',
    url: 'https://example.com/quantum-computing-milestone'
  }
];

// Extended news database for search functionality
export const extendedMockNews: NewsArticle[] = [
  ...mockNews,
  // AI & Technology
  {
    id: '11',
    title: 'OpenAI Releases GPT-5 with Revolutionary Reasoning Capabilities',
    description: 'The latest iteration of ChatGPT demonstrates unprecedented problem-solving abilities and multimodal understanding, setting new benchmarks in artificial intelligence.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'AI Research Today',
    publishedAt: '2025-01-20T15:30:00Z',
    url: 'https://example.com/openai-gpt5'
  },
  {
    id: '12',
    title: 'NVIDIA Unveils Next-Generation AI Chips for Healthcare',
    description: 'New specialized processors designed for medical imaging and drug discovery promise to accelerate healthcare AI applications by 10x.',
    category: 'Technology',
    region: 'North America',
    imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Tech Hardware News',
    publishedAt: '2025-01-20T12:15:00Z',
    url: 'https://example.com/nvidia-ai-chips'
  },
  // Warren Buffett & Finance
  {
    id: '13',
    title: 'Warren Buffett Increases Berkshire Hathaway\'s Apple Holdings',
    description: 'The Oracle of Omaha doubles down on technology investments, citing Apple\'s ecosystem strength and long-term growth potential.',
    category: 'Finance',
    region: 'North America',
    imageUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Financial Times',
    publishedAt: '2025-01-20T09:45:00Z',
    url: 'https://example.com/buffett-apple'
  },
  {
    id: '14',
    title: 'Buffett\'s Annual Letter Warns of Market Speculation',
    description: 'Berkshire Hathaway\'s chairman cautions investors about excessive speculation in emerging technologies while maintaining optimism about American business.',
    category: 'Finance',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Investment Weekly',
    publishedAt: '2025-01-19T14:20:00Z',
    url: 'https://example.com/buffett-letter'
  },
  // Climate & Renewable Energy
  {
    id: '15',
    title: 'Solar Energy Costs Drop to Historic Lows Globally',
    description: 'New photovoltaic technology and manufacturing efficiencies make solar power the cheapest energy source in most regions worldwide.',
    category: 'Science',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Renewable Energy Today',
    publishedAt: '2025-01-19T11:30:00Z',
    url: 'https://example.com/solar-energy-costs'
  },
  {
    id: '16',
    title: 'Tesla Announces Breakthrough in Battery Recycling',
    description: 'New process recovers 95% of lithium from used batteries, addressing sustainability concerns in electric vehicle production.',
    category: 'Technology',
    region: 'North America',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'EV News Network',
    publishedAt: '2025-01-18T16:45:00Z',
    url: 'https://example.com/tesla-battery-recycling'
  },
  // Quantum Computing
  {
    id: '17',
    title: 'Google Achieves Quantum Error Correction Milestone',
    description: 'Breakthrough in quantum error correction brings practical quantum computing applications significantly closer to reality.',
    category: 'Technology',
    region: 'North America',
    imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Quantum Computing Review',
    publishedAt: '2025-01-18T13:20:00Z',
    url: 'https://example.com/google-quantum'
  },
  {
    id: '18',
    title: 'IBM Partners with Universities for Quantum Education',
    description: 'Major initiative to train next generation of quantum programmers and researchers through hands-on access to quantum systems.',
    category: 'Technology',
    region: 'Global',
    imageUrl: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=400',
    source: 'Education Tech Today',
    publishedAt: '2025-01-17T10:15:00Z',
    url: 'https://example.com/ibm-quantum-education'
  }
];

export const getRandomNews = (excludeIds: string[] = []): NewsArticle[] => {
  return extendedMockNews.filter(article => !excludeIds.includes(article.id));
};

export const getPersonalizedNews = (
  preferences: UserPreferences,
  excludeIds: string[] = []
): NewsArticle[] => {
  const availableNews = extendedMockNews.filter(article => !excludeIds.includes(article.id));
  
  return availableNews
    .map(article => ({
      ...article,
      score: calculatePersonalizationScore(article, preferences)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

export const searchNews = (query: string, limit: number = 10): NewsArticle[] => {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
  
  return extendedMockNews
    .map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article, searchTerms)
    }))
    .filter(article => article.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
};

const calculateRelevanceScore = (article: NewsArticle, searchTerms: string[]): number => {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const summary = (article.summary || article.description || '').toLowerCase();
  const category = (article.category || '').toLowerCase();
  const region = (article.region || '').toLowerCase();
  const source = (article.source || '').toLowerCase();
  
  // Search in title (highest weight)
  searchTerms.forEach(term => {
    if (title.includes(term)) {
      score += 3;
    }
  });
  
  // Search in summary/description (medium weight)
  searchTerms.forEach(term => {
    if (summary.includes(term)) {
      score += 2;
    }
  });
  
  // Search in category and region (medium weight)
  searchTerms.forEach(term => {
    if (category.includes(term)) {
      score += 2;
    }
    if (region.includes(term)) {
      score += 2;
    }
  });
  
  // Search in source (lower weight)
  searchTerms.forEach(term => {
    if (source.includes(term)) {
      score += 1;
    }
  });
  
  // Exact phrase matching (bonus points)
  const fullQuery = searchTerms.join(' ');
  if (title.includes(fullQuery)) {
    score += 5;
  }
  if (summary.includes(fullQuery)) {
    score += 3;
  }
  
  return score;
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