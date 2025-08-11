import { NewsArticle, MindMapNode, MindMapLink, SwipeAction } from '../types';

export const calculateSemanticSimilarity = (article1: NewsArticle, article2: NewsArticle): number => {
  // Simple keyword-based similarity calculation
  const getKeywords = (text: string): string[] => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'new', 'years', 'way', 'may', 'say', 'come', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has', 'him', 'his', 'how', 'man', 'old', 'see', 'two', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
  };

  const keywords1 = getKeywords(`${article1.title} ${article1.summary}`);
  const keywords2 = getKeywords(`${article2.title} ${article2.summary}`);

  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const intersection = keywords1.filter(word => keywords2.includes(word));
  const union = [...new Set([...keywords1, ...keywords2])];

  return intersection.length / union.length;
};

export const generateMindMapData = (swipeHistory: SwipeAction[]): { nodes: MindMapNode[], links: MindMapLink[] } => {
  const nodes: MindMapNode[] = swipeHistory.map(swipe => ({
    id: swipe.article.id,
    title: swipe.article.title,
    category: swipe.article.category,
    region: swipe.article.region,
    sentiment: swipe.direction === 'right' ? 'liked' : 'disliked'
  }));

  const links: MindMapLink[] = [];

  // Generate links between articles
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const article1 = swipeHistory[i].article;
      const article2 = swipeHistory[j].article;
      
      let strength = 0;
      let linkType: 'category' | 'region' | 'semantic' = 'semantic';

      // Category similarity
      if (article1.category === article2.category) {
        strength += 0.4;
        linkType = 'category';
      }

      // Region similarity
      if (article1.region === article2.region) {
        strength += 0.3;
        if (linkType === 'semantic') linkType = 'region';
      }

      // Semantic similarity
      const semanticSimilarity = calculateSemanticSimilarity(article1, article2);
      strength += semanticSimilarity * 0.3;

      // Only create link if there's meaningful connection
      if (strength > 0.2) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          strength: Math.min(strength, 1),
          type: linkType
        });
      }
    }
  }

  return { nodes, links };
};

export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Technology': '#3B82F6',
    'Science': '#10B981',
    'Politics': '#EF4444',
    'Health': '#F59E0B',
    'Finance': '#8B5CF6',
    'Sports': '#06B6D4',
    'World': '#84CC16',
    'Business': '#F97316'
  };
  return colors[category] || '#6B7280';
};

export const getLinkColor = (type: 'category' | 'region' | 'semantic'): string => {
  switch (type) {
    case 'category': return '#3B82F6';
    case 'region': return '#10B981';
    case 'semantic': return '#8B5CF6';
    default: return '#6B7280';
  }
};