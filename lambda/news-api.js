import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(client);



const USER_TABLE_NAME = 'UserData';

async function fetchLatestNews() {
  try {
    const command = new ScanCommand({
      TableName: 'NewsArticles',
      Limit: 50
    });

    const response = await docClient.send(command);
    
    if (response.Items?.length > 0) {
      // Transform DynamoDB items to expected format
      const articles = response.Items.map(item => ({
        id: item.article_id,
        title: item.title,
        description: item.description,
        url: item.url,
        imageUrl: item.imageUrl,
        source: item.source,
        category: item.category,
        region: item.labels?.[0], // Use first label as region
        publishedAt: item.publishedAt,
        summary: item.structuredSummary
      }));
      
      return articles.sort((a, b) => {
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        return dateB - dateA;
      });
    }
    
    return [];
  } catch (error) {
    console.error('DynamoDB error:', error);
    throw new Error('Failed to fetch news from database');
  }
}

async function getUserPreferences(userId) {
  if (!userId) return null;
  
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: USER_TABLE_NAME,
      Key: { user_id: userId }
    }));
    return Item;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

function scoreArticleForUser(article, userPrefs) {
  if (!userPrefs) return 0;
  
  let score = 0;
  const { preferredLabels = {}, preferredSources = {}, preferredCategories = {} } = userPrefs;
  
  if (article.region && preferredLabels[article.region]) {
    score += preferredLabels[article.region] * 0.3;
  }
  if (article.source && preferredSources[article.source]) {
    score += preferredSources[article.source] * 0.4;
  }
  if (article.category && preferredCategories[article.category]) {
    score += preferredCategories[article.category] * 0.3;
  }
  
  return score;
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path;
    const queryParams = event.queryStringParameters || {};

    if (path === '/items' || path === '/prod/items') {
      // GET /items - fetch news with personalization
      const { limit = '10', seen = '', userId } = queryParams;
      const seenSet = new Set(
        String(seen).split(',').map(s => s.trim()).filter(Boolean)
      );

      const all = await fetchLatestNews();
      let filtered = all.filter(a => !seenSet.has(a.id));

      // Apply personalization if userId provided
      if (userId) {
        const userPrefs = await getUserPreferences(userId);
        if (userPrefs && userPrefs.customizationLevel > 0) {
          const scored = filtered.map(article => ({
            ...article,
            personalScore: scoreArticleForUser(article, userPrefs)
          }));
          
          // Sort by personal score, then by date
          filtered = scored.sort((a, b) => {
            if (a.personalScore !== b.personalScore) {
              return b.personalScore - a.personalScore;
            }
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
          });
        }
      }

      const result = filtered.slice(0, Number(limit) || 10);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    if (path === '/search' || path === '/prod/search') {
      // GET /search - search news
      const { q = '', limit = '20' } = queryParams;
      const query = String(q).trim();
      
      if (!query) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }

      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
      const all = await fetchLatestNews();

      const scored = all.map(a => {
        const hay = `${a.title || ''} ${a.description || ''} ${a.category || ''} ${a.region || ''}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
        return { a, score };
      });

      const result = scored
        .filter(x => x.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, Number(limit) || 20)
        .map(x => x.a);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};