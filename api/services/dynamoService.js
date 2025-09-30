import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(client);

// Try common table name patterns
const POSSIBLE_TABLE_NAMES = [
  'Article', 
  'NewsArticles',
  'newsflow-Article',
  process.env.ARTICLE_TABLE_NAME
].filter(Boolean);

export async function fetchLatestNews() {
  for (const tableName of POSSIBLE_TABLE_NAMES) {
    try {
      console.log('📊 DynamoDB: Trying table', tableName);
      
      const command = new ScanCommand({
        TableName: tableName,
        // Remove imageUrl filter for now to see what data exists
        Limit: 50
      });

      const response = await docClient.send(command);
      console.log('✅ DynamoDB: Retrieved', response.Items?.length || 0, 'items from', tableName);
      
      if (response.Items?.length > 0) {
        console.log('🖼️ DynamoDB: Sample data:', response.Items.slice(0, 2).map(item => ({ 
          id: item.id, 
          title: item.title?.slice(0, 50),
          imageUrl: item.imageUrl,
          hasImage: !!item.imageUrl
        })));
        
        // Sort by publishedAt descending
        const sorted = response.Items.sort((a, b) => {
          const dateA = new Date(a.publishedAt || 0);
          const dateB = new Date(b.publishedAt || 0);
          return dateB - dateA;
        });

        return sorted;
      }
    } catch (error) {
      console.log('⚠️ DynamoDB: Table', tableName, 'failed:', error.message);
      continue;
    }
  }
  
  console.error('❌ DynamoDB: No accessible tables found');
  throw new Error('No DynamoDB tables accessible');
}