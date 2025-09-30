import { fetchLatestNews } from './api/services/rssIngestor.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const USER_TABLE = 'UserData';

export const handler = async (event) => {
    console.log('Lambda event:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, path, rawPath, queryStringParameters, requestContext, pathParameters } = event;
        const method = httpMethod || requestContext?.http?.method;
        const requestPath = rawPath || path || requestContext?.http?.path;
        const query = queryStringParameters || {};
        console.log('Method:', method, 'Path:', requestPath);
        console.log('About to process request...');
        
        // CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        };
        
        // Handle OPTIONS requests
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }
        
        // Handle GET /items (with stage prefix)
        if (method === 'GET' && (requestPath === '/items' || requestPath === '/prod/items')) {
            const { limit = '10', seen = '' } = query;
            const seenSet = new Set(
                String(seen).split(',').map(s => s.trim()).filter(Boolean)
            );
            
            console.log('Fetching news with limit:', limit, 'seen:', seenSet.size);
            const all = await fetchLatestNews();
            const filtered = all.filter(a => !seenSet.has(a.id)).slice(0, Number(limit) || 10);
            
            console.log('Returning', filtered.length, 'articles');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(filtered)
            };
        }
        
        console.log('After items endpoint, continuing to user endpoints...');
        
        // Handle user endpoints
        console.log('Checking user endpoints for path:', requestPath);
        console.log('Path includes /user/:', requestPath.includes('/user/'));
        if (requestPath.includes('/user/')) {
            console.log('User endpoint detected');
            const userId = pathParameters?.userId || requestPath.replace('/prod', '').split('/user/')[1].split('/')[0];
            console.log('Extracted userId:', userId);
            
            if (method === 'GET') {
                // Get user data
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
                // Update user preferences
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
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true })
                };
            }
            
            if (method === 'POST' && requestPath.includes('/activity')) {
                // Track user activity
                const body = JSON.parse(event.body || '{}');
                const { articleId, action, timestamp } = body;
                
                // Get existing data
                const { Item } = await docClient.send(new GetCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId }
                }));
                
                const activities = Item?.activities || [];
                activities.push({ articleId, action, timestamp });
                
                // Keep only last 1000 activities
                const recentActivities = activities.slice(-1000);
                
                await docClient.send(new UpdateCommand({
                    TableName: USER_TABLE,
                    Key: { user_id: userId },
                    UpdateExpression: 'SET activities = :activities, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':activities': recentActivities,
                        ':now': new Date().toISOString()
                    }
                }));
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true })
                };
            }
        }
        
        // Handle GET /search (with stage prefix)
        if (method === 'GET' && (requestPath === '/search' || requestPath === '/prod/search')) {
            const { q = '', limit = '20' } = query;
            const searchQuery = String(q).trim();
            
            if (!searchQuery) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([])
                };
            }
            
            const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 1);
            const all = await fetchLatestNews();
            
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
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(results)
            };
        }
        
        // Route not found
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Route not found' })
        };
        
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