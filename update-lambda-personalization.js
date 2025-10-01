import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USER_TABLE = 'UserData';
const NEWS_TABLE = 'NewsArticles';

// Cache for news data
let newsCache = { items: [], lastFetched: 0 };
const CACHE_MS = 1000 * 60 * 5; // 5 minutes

async function fetchNewsFromDynamoDB() {
    const now = Date.now();
    if (now - newsCache.lastFetched < CACHE_MS && newsCache.items.length) {
        console.log('Using cached data:', newsCache.items.length, 'items');
        return newsCache.items;
    }

    const { Items } = await docClient.send(new ScanCommand({
        TableName: NEWS_TABLE,
        Limit: 100
    }));
    
    const articles = (Items || []).map(item => ({
        id: item.article_id,
        title: item.title,
        description: item.description,
        url: item.url,
        source: item.source,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt,
        category: item.category,
        structuralSummary: item.structuredSummary
    })).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    newsCache = { items: articles, lastFetched: now };
    console.log('Fetched from DynamoDB:', articles.length, 'items');
    return articles;
}

function getPersonalizedNews(allNews, userPrefs, customizationLevel, seenSet, limit) {
    const x = Math.round((customizationLevel / 100) * limit);
    const randomCount = limit - x;
    
    const unseen = allNews.filter(a => !seenSet.has(a.id));
    
    // Personalized pool: match user preferences (sources, categories, labels)
    const personalized = unseen.filter(a => 
        (userPrefs.preferredSources || []).includes(a.source) ||
        (userPrefs.preferredCategories || []).includes(a.category) ||
        (a.labels || []).some(label => (userPrefs.preferredLabels || []).includes(label))
    );
    
    // Random pool: all other unseen
    const random = unseen.filter(a => 
        !(userPrefs.preferredSources || []).includes(a.source) &&
        !(userPrefs.preferredCategories || []).includes(a.category) &&
        !(a.labels || []).some(label => (userPrefs.preferredLabels || []).includes(label))
    );
    
    const selectedPersonalized = personalized.slice(0, x);
    const selectedRandom = random.slice(0, randomCount);
    
    console.log(`Personalization: ${x} personalized, ${randomCount} random from ${personalized.length}/${random.length} pools`);
    return [...selectedPersonalized, ...selectedRandom].slice(0, limit);
}

export const handler = async (event) => {
    console.log('Lambda event:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, path, rawPath, queryStringParameters, requestContext, pathParameters } = event;
        const method = httpMethod || requestContext?.http?.method;
        const requestPath = rawPath || path || requestContext?.http?.path;
        const query = queryStringParameters || {};
        console.log('Method:', method, 'Path:', requestPath);
        
        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        };
        
        // Handle OPTIONS requests
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }
        
        // Handle GET /items with personalization
        if (method === 'GET' && (requestPath === '/items' || requestPath === '/prod/items')) {
            const { limit = '10', seen = '', userId } = query;
            const seenSet = new Set(String(seen).split(',').map(s => s.trim()).filter(Boolean));
            
            console.log('Fetching news with limit:', limit, 'seen:', seenSet.size, 'userId:', userId);
            const allNews = await fetchNewsFromDynamoDB();
            
            let result;
            if (userId) {
                // Get user preferences for personalization
                const { Item: userPrefs } = await docClient.send(new GetCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId }
                }));
                
                // Use real-time customization level from user preferences
                const customizationLevel = userPrefs?.customizationLevel || 50;
                console.log('Real-time customization level:', customizationLevel, 'for user:', userId);
                result = getPersonalizedNews(allNews, userPrefs || {}, customizationLevel, seenSet, Number(limit) || 10);
            } else {
                // Fallback: random unseen articles
                result = allNews.filter(a => !seenSet.has(a.id)).slice(0, Number(limit) || 10);
            }
            
            console.log('Returning', result.length, 'articles');
            console.log('Sample imageUrls:', result.slice(0, 3).map(item => ({ id: item.id, imageUrl: item.imageUrl })));
            return { statusCode: 200, headers, body: JSON.stringify(result) };
        }
        
        // Handle user endpoints
        if (requestPath.includes('/user/')) {
            const userId = pathParameters?.userId || requestPath.replace('/prod', '').split('/user/')[1].split('/')[0];
            
            if (method === 'GET') {
                const { Item } = await docClient.send(new GetCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId }
                }));
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(Item || { user_id: userId, customizationLevel: 50, activities: [] })
                };
            }
            
            if (method === 'PUT') {
                const body = JSON.parse(event.body || '{}');
                const { customizationLevel, updatedAt } = body;
                
                await docClient.send(new UpdateCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId },
                    UpdateExpression: 'SET customizationLevel = :level, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':level': customizationLevel,
                        ':now': updatedAt || new Date().toISOString()
                    }
                }));
                
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
            
            if (method === 'POST' && requestPath.includes('/activity')) {
                const body = JSON.parse(event.body || '{}');
                const { articleId, action, timestamp } = body;
                
                // Get existing data
                const { Item } = await docClient.send(new GetCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId }
                }));
                
                const activities = Item?.activities || [];
                activities.push({ articleId, action, timestamp });
                const recentActivities = activities.slice(-1000);
                
                // Update preferences if user liked an article
                let updateExpression = 'SET activities = :activities, updatedAt = :now';
                let expressionValues = {
                    ':activities': recentActivities,
                    ':now': new Date().toISOString()
                };
                
                if (action === 'liked') {
                    try {
                        // Try by article_id first, then by URL
                        let article;
                        try {
                            const { Item } = await docClient.send(new GetCommand({
                                TableName: NEWS_TABLE,
                                Key: { article_id: articleId }
                            }));
                            article = Item;
                        } catch (e) {
                            // If not found by ID, scan for URL match
                            const { Items } = await docClient.send(new ScanCommand({
                                TableName: NEWS_TABLE,
                                FilterExpression: '#url = :url',
                                ExpressionAttributeNames: { '#url': 'url' },
                                ExpressionAttributeValues: { ':url': articleId },
                                Limit: 1
                            }));
                            article = Items?.[0];
                        }
                        
                        if (article) {
                            const currentSources = Item?.preferredSources || [];
                            const currentCategories = Item?.preferredCategories || [];
                            const currentLabels = Item?.preferredLabels || [];
                            
                            const updatedSources = article.source && !currentSources.includes(article.source)
                                ? [...currentSources, article.source].slice(-10)
                                : currentSources;
                            
                            const updatedCategories = article.category && article.category !== 'General' && !currentCategories.includes(article.category)
                                ? [...currentCategories, article.category].slice(-10)
                                : currentCategories;
                            
                            const articleLabels = article.labels || [];
                            const newLabels = articleLabels.filter(label => !currentLabels.includes(label));
                            const updatedLabels = [...currentLabels, ...newLabels].slice(-20);
                            
                            updateExpression += ', preferredSources = :sources, preferredCategories = :categories, preferredLabels = :labels';
                            expressionValues[':sources'] = updatedSources;
                            expressionValues[':categories'] = updatedCategories;
                            expressionValues[':labels'] = updatedLabels;
                            
                            console.log('Updated preferences:', { sources: updatedSources, categories: updatedCategories, labels: updatedLabels });
                        } else {
                            console.log('Article not found for preference update:', articleId);
                        }
                    } catch (e) {
                        console.warn('Failed to update preferences:', e.message);
                    }
                }
                
                await docClient.send(new UpdateCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId },
                    UpdateExpression: updateExpression,
                    ExpressionAttributeValues: expressionValues
                }));
                
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
        }
        
        // Handle GET /search
        if (method === 'GET' && (requestPath === '/search' || requestPath === '/prod/search')) {
            const { q = '', limit = '20' } = query;
            const searchQuery = String(q).trim();
            
            if (!searchQuery) {
                return { statusCode: 200, headers, body: JSON.stringify([]) };
            }
            
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
            const all = await fetchNewsFromDynamoDB();
            
            const scored = all.map(a => {
                const hay = `${a.title || ''} ${a.description || ''} ${a.category || ''} ${a.region || ''}`.toLowerCase();
                const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
                return { a, score };
            });
            
            const results = scored
                .filter(x => x.score > 0)
                .sort((x, y) => y.score - x.score)
                .slice(0, Number(limit) || 20)
                .map(x => x.a);
            
            return { statusCode: 200, headers, body: JSON.stringify(results) };
        }
        
        return { statusCode: 404, headers, body: JSON.stringify({ message: 'Route not found' }) };
        
    } catch (error) {
        console.error('Lambda error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};