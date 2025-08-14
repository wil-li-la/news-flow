import { NewsArticle, MindMapNode, MindMapLink, SwipeAction } from '../types';

export type MindMapViewMode = 'semantic' | 'category' | 'region';

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

export const generateMindMapData = (swipeHistory: SwipeAction[], viewMode: MindMapViewMode = 'semantic'): { nodes: MindMapNode[], links: MindMapLink[] } => {
  // Only include liked articles for the mind map (as per CogniSphere concept)
  const likedSwipes = swipeHistory.filter(swipe => swipe.direction === 'right');
  
  if (viewMode === 'semantic') {
    return generateSemanticView(likedSwipes);
  } else if (viewMode === 'category') {
    return generateCategoryView(likedSwipes);
  } else if (viewMode === 'region') {
    return generateRegionView(likedSwipes);
  }
  
  return { nodes: [], links: [] };
};

const generateSemanticView = (likedSwipes: SwipeAction[]): { nodes: MindMapNode[], links: MindMapLink[] } => {
  // Extract keywords and create keyword-based nodes
  const keywordMap: { [key: string]: NewsArticle[] } = {};
  
  likedSwipes.forEach(swipe => {
    const keywords = extractKeywords(`${swipe.article.title} ${swipe.article.summary || swipe.article.description || ''}`);
    keywords.slice(0, 3).forEach(keyword => { // Take top 3 keywords per article
      if (!keywordMap[keyword]) {
        keywordMap[keyword] = [];
      }
      keywordMap[keyword].push(swipe.article);
    });
  });

  // Create nodes for keywords with multiple articles
  const nodes: MindMapNode[] = Object.entries(keywordMap)
    .filter(([, articles]) => articles.length >= 2)
    .map(([keyword, articles]) => ({
      id: `keyword-${keyword}`,
      title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
      category: getMostCommonCategory(articles),
      region: getMostCommonRegion(articles),
      sentiment: 'liked',
      nodeType: 'keyword',
      articleCount: articles.length
    }));

  const links: MindMapLink[] = [];

  // Generate links between articles
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const keyword1 = nodes[i].title.toLowerCase();
      const keyword2 = nodes[j].title.toLowerCase();
      const articles1 = keywordMap[keyword1] || [];
      const articles2 = keywordMap[keyword2] || [];
      
      let strength = 0;
      let linkType: 'category' | 'region' | 'semantic' = 'semantic';

      // Calculate overlap between keyword groups
      const sharedArticles = articles1.filter(a1 => 
        articles2.some(a2 => a2.id === a1.id)
      ).length;
      
      if (sharedArticles > 0) {
        strength = sharedArticles / Math.max(articles1.length, articles2.length);
        linkType = 'semantic';
      }

      // Only create link if there's meaningful connection
      if (strength > 0.2) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          strength: Math.min(strength * 2, 1), // Amplify strength for better visibility
          type: linkType
        });
      }
    }
  }

  return { nodes, links };
};

const generateCategoryView = (likedSwipes: SwipeAction[]): { nodes: MindMapNode[], links: MindMapLink[] } => {
  const categoryMap: { [key: string]: NewsArticle[] } = {};
  
  likedSwipes.forEach(swipe => {
    const category = swipe.article.category || 'Other';
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(swipe.article);
  });

  const nodes: MindMapNode[] = Object.entries(categoryMap).map(([category, articles]) => ({
    id: `category-${category}`,
    title: category,
    category: category,
    region: 'Global',
    sentiment: 'liked',
    nodeType: 'category',
    articleCount: articles.length
  }));

  const links: MindMapLink[] = [];
  
  // Create links between categories based on shared semantic content
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const cat1Articles = categoryMap[nodes[i].title] || [];
      const cat2Articles = categoryMap[nodes[j].title] || [];
      
      let totalSimilarity = 0;
      let comparisons = 0;
      
      cat1Articles.forEach(a1 => {
        cat2Articles.forEach(a2 => {
          totalSimilarity += calculateSemanticSimilarity(a1, a2);
          comparisons++;
        });
      });
      
      if (comparisons > 0) {
        const avgSimilarity = totalSimilarity / comparisons;
        if (avgSimilarity > 0.1) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: Math.min(avgSimilarity * 3, 1),
            type: 'category'
          });
        }
      }
    }
  }
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Technology': '#3B82F6',
    'Science': '#10B981',
    'Politics': '#EF4444',
    'Health': '#F59E0B',
    'Finance': '#8B5CF6',
    'Sports': '#06B6D4',
    'World': '#84CC16',
    'Business': '#F97316',
    'Other': '#6B7280'
  };
  return colors[category] || '#6B7280';
};

export const getRegionColor = (region: string): string => {
  const colors: { [key: string]: string } = {
    'North America': '#EF4444',
    'Europe': '#3B82F6',
    'Asia': '#10B981',
    'Asia Pacific': '#10B981',
    'South America': '#F59E0B',
    'Africa': '#8B5CF6',
    'Middle East': '#EC4899',
    'Global': '#6B7280'
  };
  return colors[category] || '#6B7280';
};

  return { nodes, links };
};

const generateRegionView = (likedSwipes: SwipeAction[]): { nodes: MindMapNode[], links: MindMapLink[] } => {
  const regionMap: { [key: string]: NewsArticle[] } = {};
  
  likedSwipes.forEach(swipe => {
    const region = swipe.article.region || 'Global';
    if (!regionMap[region]) {
      regionMap[region] = [];
    }
    regionMap[region].push(swipe.article);
  });

  const nodes: MindMapNode[] = Object.entries(regionMap).map(([region, articles]) => ({
    id: `region-${region}`,
    title: region,
    category: getMostCommonCategory(articles),
    region: region,
    sentiment: 'liked',
    nodeType: 'region',
    articleCount: articles.length
  }));

  const links: MindMapLink[] = [];
  
  // Create links between regions based on shared topics
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const reg1Articles = regionMap[nodes[i].title] || [];
      const reg2Articles = regionMap[nodes[j].title] || [];
      
      let totalSimilarity = 0;
      let comparisons = 0;
      
      reg1Articles.forEach(a1 => {
        reg2Articles.forEach(a2 => {
          totalSimilarity += calculateSemanticSimilarity(a1, a2);
          comparisons++;
        });
      });
      
      if (comparisons > 0) {
        const avgSimilarity = totalSimilarity / comparisons;
        if (avgSimilarity > 0.1) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: Math.min(avgSimilarity * 3, 1),
            type: 'region'
          });
        }
      }
    }
  }

  return { nodes, links };
};

const extractKeywords = (text: string): string[] => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'this', 'that', 'these', 'those', 'new', 'news', 'today', 'yesterday'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word));

  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
};

const getMostCommonCategory = (articles: NewsArticle[]): string => {
  const categoryCount: { [key: string]: number } = {};
  articles.forEach(article => {
    const category = article.category || 'Other';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Other';
};

const getMostCommonRegion = (articles: NewsArticle[]): string => {
  const regionCount: { [key: string]: number } = {};
  articles.forEach(article => {
    const region = article.region || 'Global';
    regionCount[region] = (regionCount[region] || 0) + 1;
  });
  
  return Object.entries(regionCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Global';
};

export const getLinkColor = (type: 'category' | 'region' | 'semantic'): string => {
  switch (type) {
    case 'category': return '#3B82F6';
    case 'region': return '#10B981';
    case 'semantic': return '#8B5CF6';
    default: return '#6B7280';
  }
};