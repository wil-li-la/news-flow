import { NewsArticle, SwipeAction, KeywordCluster, KnowledgeSeries, TimelineEvent } from '../types';

// Extract meaningful keywords from text
export const extractKeywords = (text: string): string[] => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we',
    'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him',
    'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'whose', 'this', 'that',
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'said', 'says', 'new', 'news', 'today', 'yesterday', 'now', 'then',
    'here', 'there', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'now'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers

  // Count word frequency
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Return words sorted by frequency, take top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

// Extract named entities (simple pattern matching)
export const extractEntities = (text: string): string[] => {
  const entities: string[] = [];
  
  // Company names (simple patterns)
  const companyPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|Corp|Ltd|LLC|Company|Technologies|Systems|Group)\b/g,
    /\b(?:Apple|Google|Microsoft|Amazon|Facebook|Meta|Tesla|Netflix|Uber|Airbnb|SpaceX|OpenAI|ChatGPT|GPT-4|Bitcoin|Ethereum)\b/gi
  ];

  // Person names (capitalized words, common patterns)
  const personPatterns = [
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    /\b(?:Warren\s+Buffett|Elon\s+Musk|Bill\s+Gates|Jeff\s+Bezos|Mark\s+Zuckerberg|Tim\s+Cook|Satya\s+Nadella)\b/gi
  ];

  // Countries and regions
  const locationPatterns = [
    /\b(?:United\s+States|China|Japan|Germany|France|United\s+Kingdom|India|Brazil|Russia|Canada|Australia|South\s+Korea|Italy|Spain|Mexico)\b/gi,
    /\b(?:Europe|Asia|Africa|North\s+America|South\s+America|Middle\s+East|Pacific|Atlantic)\b/gi
  ];

  [companyPatterns, personPatterns, locationPatterns].forEach(patterns => {
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.push(...matches.map(match => match.trim()));
      }
    });
  });

  return [...new Set(entities)]; // Remove duplicates
};

// Generate keyword clusters from swipe history
export const generateKeywordClusters = (swipeHistory: SwipeAction[]): KeywordCluster[] => {
  const keywordMap: { [key: string]: { articles: NewsArticle[], sentiment: ('positive' | 'negative')[] } } = {};

  // Process each swiped article
  swipeHistory.forEach(swipe => {
    const { article, direction } = swipe;
    const sentiment = direction === 'right' ? 'positive' : 'negative';
    
    // Extract keywords from title and summary
    const keywords = [
      ...extractKeywords(`${article.title} ${article.summary}`),
      ...extractEntities(`${article.title} ${article.summary}`)
    ];

    keywords.forEach(keyword => {
      if (!keywordMap[keyword]) {
        keywordMap[keyword] = { articles: [], sentiment: [] };
      }
      
      // Avoid duplicates
      if (!keywordMap[keyword].articles.find(a => a.id === article.id)) {
        keywordMap[keyword].articles.push(article);
        keywordMap[keyword].sentiment.push(sentiment);
      }
    });
  });

  // Convert to clusters
  const clusters: KeywordCluster[] = Object.entries(keywordMap)
    .filter(([, data]) => data.articles.length >= 2) // Only keywords with multiple articles
    .map(([keyword, data]) => {
      const positiveCount = data.sentiment.filter(s => s === 'positive').length;
      const negativeCount = data.sentiment.filter(s => s === 'negative').length;
      
      let overallSentiment: 'positive' | 'negative' | 'mixed';
      if (positiveCount > negativeCount * 1.5) {
        overallSentiment = 'positive';
      } else if (negativeCount > positiveCount * 1.5) {
        overallSentiment = 'negative';
      } else {
        overallSentiment = 'mixed';
      }

      return {
        id: `cluster-${keyword}`,
        keyword,
        articles: data.articles,
        sentiment: overallSentiment,
        frequency: data.articles.length,
        lastUpdated: new Date().toISOString(),
        relatedKeywords: findRelatedKeywords(keyword, keywordMap)
      };
    })
    .sort((a, b) => b.frequency - a.frequency);

  return clusters;
};

// Find related keywords based on article overlap
const findRelatedKeywords = (
  targetKeyword: string, 
  keywordMap: { [key: string]: { articles: NewsArticle[], sentiment: ('positive' | 'negative')[] } }
): string[] => {
  const targetArticleIds = new Set(keywordMap[targetKeyword].articles.map(a => a.id));
  const related: { keyword: string, overlap: number }[] = [];

  Object.entries(keywordMap).forEach(([keyword, data]) => {
    if (keyword === targetKeyword) return;
    
    const overlapCount = data.articles.filter(a => targetArticleIds.has(a.id)).length;
    if (overlapCount > 0) {
      related.push({ keyword, overlap: overlapCount });
    }
  });

  return related
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 5)
    .map(r => r.keyword);
};

// Generate knowledge series from clusters
export const generateKnowledgeSeries = (clusters: KeywordCluster[]): KnowledgeSeries[] => {
  const series: KnowledgeSeries[] = [];

  // Group clusters that might form series
  const potentialSeries = clusters.filter(cluster => 
    cluster.frequency >= 3 && 
    (cluster.sentiment === 'positive' || cluster.sentiment === 'mixed')
  );

  potentialSeries.forEach(cluster => {
    // Create timeline from articles
    const timeline: TimelineEvent[] = cluster.articles
      .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
      .map((article, index) => ({
        id: `event-${article.id}`,
        date: article.publishedAt,
        title: article.title,
        summary: article.summary,
        articleId: article.id,
        importance: calculateImportance(article, cluster.articles)
      }));

    const seriesTitle = generateSeriesTitle(cluster.keyword, cluster.articles);
    const description = generateSeriesDescription(cluster);

    series.push({
      id: `series-${cluster.id}`,
      title: seriesTitle,
      description,
      keywords: [cluster.keyword, ...cluster.relatedKeywords],
      articles: cluster.articles,
      timeline,
      category: getMostCommonCategory(cluster.articles),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  return series.sort((a, b) => b.articles.length - a.articles.length);
};

// Calculate importance of an article within a cluster
const calculateImportance = (article: NewsArticle, allArticles: NewsArticle[]): number => {
  let importance = 0.5; // Base importance
  
  // More recent articles are more important
  const articleDate = new Date(article.publishedAt).getTime();
  const latestDate = Math.max(...allArticles.map(a => new Date(a.publishedAt).getTime()));
  const recencyScore = articleDate / latestDate;
  importance += recencyScore * 0.3;
  
  // Articles with more keywords in title are more important
  const titleWords = article.title.split(' ').length;
  const avgTitleLength = allArticles.reduce((sum, a) => sum + a.title.split(' ').length, 0) / allArticles.length;
  if (titleWords > avgTitleLength) {
    importance += 0.2;
  }
  
  return Math.min(importance, 1);
};

// Generate a meaningful title for the series
const generateSeriesTitle = (keyword: string, articles: NewsArticle[]): string => {
  const categories = [...new Set(articles.map(a => a.category))];
  const mainCategory = categories[0];
  
  // Capitalize keyword
  const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  
  if (articles.length >= 5) {
    return `The ${capitalizedKeyword} Chronicles`;
  } else if (mainCategory === 'Technology') {
    return `${capitalizedKeyword} Tech Evolution`;
  } else if (mainCategory === 'Politics') {
    return `${capitalizedKeyword} Political Timeline`;
  } else if (mainCategory === 'Finance') {
    return `${capitalizedKeyword} Market Journey`;
  } else {
    return `${capitalizedKeyword} Story`;
  }
};

// Generate description for the series
const generateSeriesDescription = (cluster: KeywordCluster): string => {
  const { keyword, articles, sentiment } = cluster;
  const timeSpan = getTimeSpan(articles);
  const categories = [...new Set(articles.map(a => a.category))];
  
  let description = `A collection of ${articles.length} articles about ${keyword} spanning ${timeSpan}. `;
  
  if (categories.length === 1) {
    description += `Focused on ${categories[0].toLowerCase()} developments. `;
  } else {
    description += `Covering ${categories.join(', ').toLowerCase()} topics. `;
  }
  
  if (sentiment === 'positive') {
    description += 'Generally positive coverage and developments.';
  } else if (sentiment === 'negative') {
    description += 'Highlighting challenges and concerns.';
  } else {
    description += 'Mixed perspectives and balanced coverage.';
  }
  
  return description;
};

// Calculate time span of articles
const getTimeSpan = (articles: NewsArticle[]): string => {
  if (articles.length < 2) return 'recent time';
  
  const dates = articles.map(a => new Date(a.publishedAt).getTime()).sort();
  const earliest = new Date(dates[0]);
  const latest = new Date(dates[dates.length - 1]);
  
  const diffDays = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return `${diffDays} days`;
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)} weeks`;
  } else {
    return `${Math.ceil(diffDays / 30)} months`;
  }
};

// Get most common category
const getMostCommonCategory = (articles: NewsArticle[]): string => {
  const categoryCount: { [key: string]: number } = {};
  articles.forEach(article => {
    categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0][0];
};