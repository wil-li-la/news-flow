import express from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router();
const client = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'UserData';

// Get user data
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { Item } = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { user_id: userId }
    }));
    
    res.json(Item || { user_id: userId, customizationLevel: 50, activities: [], preferredLabels: {}, preferredSources: {}, preferredCategories: {} });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update user preferences
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { customizationLevel, updatedAt } = req.body;
    
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { user_id: userId },
      UpdateExpression: 'SET customizationLevel = :level, updatedAt = :now',
      ExpressionAttributeValues: {
        ':level': customizationLevel,
        ':now': updatedAt
      }
    }));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Track user activity with swipe data
router.post('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { articleId, action, timestamp, articleData } = req.body;
    
    // Get existing data
    const { Item } = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { user_id: userId }
    }));
    
    const activities = Item?.activities || [];
    const activityEntry = { 
      articleId, 
      action, 
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
    
    if (action === 'liked' && articleData) {
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
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking activity:', error);
    res.status(500).json({ error: 'Failed to track activity' });
  }
});

export default router;