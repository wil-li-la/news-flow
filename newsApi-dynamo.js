const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

// Try common table name patterns
const POSSIBLE_TABLE_NAMES = [
  'Article',
  'NewsArticles', 
  'newsflow-Article'
];

let cache = { items: [], lastFetched: 0, tableName: null };
const CACHE_MS = 1000 * 60 * 5; // 5 minutes

async function fetchLatestNews() {
    const now = Date.now();
    if (now - cache.lastFetched < CACHE_MS && cache.items.length) {
        console.log('Using cached data:', cache.items.length, 'items');
        return cache.items;
    }

    // Try to find the correct table
    for (const tableName of POSSIBLE_TABLE_NAMES) {
        try {
            console.log('Trying DynamoDB table:', tableName);
            
            const command = new ScanCommand({
                TableName: tableName,
                Limit: 100
            });

            const response = await docClient.send(command);
            console.log('DynamoDB success:', response.Items?.length || 0, 'items from', tableName);
            
            if (response.Items?.length > 0) {
                // Log sample data structure
                console.log('Sample item:', JSON.stringify(response.Items[0], null, 2));
                
                // Sort by publishedAt descending
                const sorted = response.Items.sort((a, b) => {
                    const dateA = new Date(a.publishedAt || 0);
                    const dateB = new Date(b.publishedAt || 0);
                    return dateB - dateA;
                });

                cache = { items: sorted, lastFetched: now, tableName };
                return sorted;
            }
        } catch (error) {
            console.log('Table', tableName, 'failed:', error.message);
            continue;
        }
    }
    
    console.error('No accessible DynamoDB tables found');
    throw new Error('No DynamoDB tables accessible');
}

exports.handler = async (event) => {
    console.log('Lambda event:', JSON.stringify(event, null, 2));
    
    try {
        const httpMethod = event.httpMethod || event.requestContext?.http?.method;
        const path = event.path || event.rawPath || event.requestContext?.http?.path;
        const query = event.queryStringParameters || {};
        
        console.log('Method:', httpMethod, 'Path:', path);
        
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        };
        
        if (httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }
        
        if (httpMethod === 'GET' && (path === '/items' || path === '/prod/items')) {
            const { limit = '10', seen = '' } = query;
            const seenSet = new Set(String(seen).split(',').map(s => s.trim()).filter(Boolean));
            
            console.log('Fetching news with limit:', limit, 'seen:', seenSet.size);
            const all = await fetchLatestNews();
            const filtered = all.filter(a => !seenSet.has(a.id)).slice(0, Number(limit) || 10);
            
            console.log('Returning', filtered.length, 'articles');
            console.log('Sample imageUrls:', filtered.slice(0, 3).map(item => ({ 
                id: item.id, 
                imageUrl: item.imageUrl 
            })));
            
            return { statusCode: 200, headers, body: JSON.stringify(filtered) };
        }
        
        if (httpMethod === 'GET' && (path === '/search' || path === '/prod/search')) {
            const { q = '', limit = '20' } = query;
            const searchQuery = String(q).trim();
            
            if (!searchQuery) {
                return { statusCode: 200, headers, body: JSON.stringify([]) };
            }
            
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
            const all = await fetchLatestNews();
            
            const scored = all.map(a => {
                const hay = `${a.title || ''} ${a.content || ''} ${a.summary || ''} ${a.category || ''}`.toLowerCase();
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
        
        // User routes
        const userMatch = path.match(/^\/(?:prod\/)?user\/([^/]+)(?:\/(.+))?$/);
        if (userMatch) {
            const userId = userMatch[1];
            const subPath = userMatch[2];
            
            if (httpMethod === 'GET' && !subPath) {
                const { Item } = await docClient.send(new GetCommand({
                    TableName: 'UserData',
                    Key: { user_id: userId }
                }));
                return { statusCode: 200, headers, body: JSON.stringify(Item || { user_id: userId, customizationLevel: 50, activities: [] }) };
            }
            
            if (httpMethod === 'PUT' && !subPath) {
                const body = JSON.parse(event.body || '{}');
                await docClient.send(new UpdateCommand({
                    TableName: 'UserData',
                    Key: { user_id: userId },
                    UpdateExpression: 'SET customizationLevel = :level, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':level': body.customizationLevel,
                        ':now': body.updatedAt
                    }
                }));
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
            
            if (httpMethod === 'POST' && subPath === 'activity') {
                const body = JSON.parse(event.body || '{}');
                const { Item } = await docClient.send(new GetCommand({
                    TableName: 'UserData',
                    Key: { user_id: userId }
                }));
                
                const activities = Item?.activities || [];
                activities.push({ articleId: body.articleId, action: body.action, timestamp: body.timestamp });
                
                await docClient.send(new UpdateCommand({
                    TableName: 'UserData',
                    Key: { user_id: userId },
                    UpdateExpression: 'SET activities = :activities, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':activities': activities.slice(-1000),
                        ':now': new Date().toISOString()
                    }
                }));
                return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
            }
        }
        
        return { statusCode: 404, headers, body: JSON.stringify({ message: 'Route not found' }) };
        
    } catch (error) {
        console.error('Lambda error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};