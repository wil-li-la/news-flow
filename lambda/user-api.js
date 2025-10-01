import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'UserData';

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
    const pathParts = event.path.split('/').filter(Boolean);
    const userId = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
    const action = pathParts[pathParts.length - 1];

    if (event.httpMethod === 'GET') {
      // GET /user/{userId}
      const { Item } = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId }
      }));
      
      const userData = Item || { 
        user_id: userId, 
        customizationLevel: 50, 
        activities: [], 
        preferredLabels: {}, 
        preferredSources: {}, 
        preferredCategories: {} 
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userData)
      };
    }

    if (event.httpMethod === 'PUT') {
      // PUT /user/{userId}
      const body = JSON.parse(event.body || '{}');
      const { customizationLevel, updatedAt } = body;
      
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId },
        UpdateExpression: 'SET customizationLevel = :level, updatedAt = :now',
        ExpressionAttributeValues: {
          ':level': customizationLevel,
          ':now': updatedAt
        }
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    if (event.httpMethod === 'POST' && action === 'activity') {
      // POST /user/{userId}/activity
      const body = JSON.parse(event.body || '{}');
      const { articleId, action: userAction, timestamp, articleData } = body;
      
      // Get existing data
      const { Item } = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId }
      }));
      
      const activities = Item?.activities || [];
      const activityEntry = { 
        articleId, 
        action: userAction, 
        timestamp,
        ...(articleData && {
          category: articleData.category,
          source: articleData.source,
          region: articleData.region
        })
      };
      activities.push(activityEntry);
      
      // Keep only last 1000 activities
      const recentActivities = activities.slice(-1000);
      
      // Update preference counters for liked articles
      let updateExpression = 'SET activities = :activities, updatedAt = :now';
      const expressionValues = {
        ':activities': recentActivities,
        ':now': new Date().toISOString()
      };
      
      if (userAction === 'liked' && articleData) {
        const preferredLabels = Item?.preferredLabels || {};
        const preferredSources = Item?.preferredSources || {};
        const preferredCategories = Item?.preferredCategories || {};
        
        if (articleData.region) {
          preferredLabels[articleData.region] = (preferredLabels[articleData.region] || 0) + 1;
        }
        if (articleData.source) {
          preferredSources[articleData.source] = (preferredSources[articleData.source] || 0) + 1;
        }
        if (articleData.category) {
          preferredCategories[articleData.category] = (preferredCategories[articleData.category] || 0) + 1;
        }
        
        updateExpression += ', preferredLabels = :labels, preferredSources = :sources, preferredCategories = :categories';
        expressionValues[':labels'] = preferredLabels;
        expressionValues[':sources'] = preferredSources;
        expressionValues[':categories'] = preferredCategories;
      }
      
      await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { user_id: userId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionValues
      }));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('User API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process request' })
    };
  }
};