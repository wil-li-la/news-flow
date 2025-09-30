#!/usr/bin/env node

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { fetchLatestNews } from '../api/services/rssIngestor.js';
import { readFileSync } from 'fs';

// Read Amplify outputs to get table name
const amplifyOutputs = JSON.parse(readFileSync('./amplify_outputs.json', 'utf8'));
const region = amplifyOutputs.auth.aws_region;

// Initialize DynamoDB client
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

// Table name pattern for Amplify Gen 2
const TABLE_NAME = 'Article-' + amplifyOutputs.auth.user_pool_id.split('_')[1]; // Approximate table name

async function cleanupFlawedNews() {
    console.log('🔍 Scanning for flawed news articles...');
    
    let deletedCount = 0;
    let lastEvaluatedKey;
    
    do {
        const scanParams = {
            TableName: TABLE_NAME,
            ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
        };
        
        try {
            const result = await docClient.send(new ScanCommand(scanParams));
            
            for (const item of result.Items || []) {
                let shouldDelete = false;
                const reasons = [];
                
                // Check for missing image
                if (!item.imageUrl || item.imageUrl.trim() === '') {
                    shouldDelete = true;
                    reasons.push('no image');
                }
                
                // Check for missing structural summary
                if (!item.structuralSummary || item.structuralSummary.trim() === '') {
                    shouldDelete = true;
                    reasons.push('no structural summary');
                }
                
                // Check for invalid HTML-encoded text
                if (item.title && (item.title.includes('&lt;') || item.title.includes('&gt;') || item.title.includes('&amp;'))) {
                    shouldDelete = true;
                    reasons.push('invalid HTML encoding in title');
                }
                
                if (item.description && (item.description.includes('&lt;') || item.description.includes('&gt;') || item.description.includes('&amp;'))) {
                    shouldDelete = true;
                    reasons.push('invalid HTML encoding in description');
                }
                
                if (shouldDelete) {
                    console.log(`🗑️  Deleting article: "${item.title}" (${reasons.join(', ')})`);
                    
                    await docClient.send(new DeleteCommand({
                        TableName: TABLE_NAME,
                        Key: { id: item.id }
                    }));
                    
                    deletedCount++;
                }
            }
            
            lastEvaluatedKey = result.LastEvaluatedKey;
        } catch (error) {
            console.error('❌ Error scanning table:', error.message);
            break;
        }
    } while (lastEvaluatedKey);
    
    console.log(`✅ Cleanup complete. Deleted ${deletedCount} flawed articles.`);
    return deletedCount;
}

async function fetchAndStoreNews() {
    console.log('📰 Fetching latest news...');
    
    try {
        const articles = await fetchLatestNews();
        console.log(`📥 Fetched ${articles.length} articles`);
        
        let storedCount = 0;
        
        for (const article of articles) {
            try {
                // Store in DynamoDB
                await docClient.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: {
                        id: article.id,
                        title: article.title,
                        content: article.description,
                        summary: article.structuralSummary,
                        url: article.url,
                        source: article.source,
                        publishedAt: article.publishedAt,
                        category: article.category,
                        imageUrl: article.imageUrl,
                        region: article.region,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    ConditionExpression: 'attribute_not_exists(id)' // Only insert if not exists
                }));
                
                storedCount++;
                console.log(`✅ Stored: ${article.title}`);
            } catch (error) {
                if (error.name === 'ConditionalCheckFailedException') {
                    console.log(`⏭️  Skipped duplicate: ${article.title}`);
                } else {
                    console.error(`❌ Error storing article "${article.title}":`, error.message);
                }
            }
        }
        
        console.log(`✅ Stored ${storedCount} new articles in DynamoDB`);
        return storedCount;
    } catch (error) {
        console.error('❌ Error fetching news:', error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 Starting cleanup and fetch process...');
    console.log(`📍 Region: ${region}`);
    console.log(`🗄️  Table: ${TABLE_NAME}`);
    
    try {
        // Step 1: Clean up flawed articles
        const deletedCount = await cleanupFlawedNews();
        
        // Step 2: Fetch and store new articles
        const storedCount = await fetchAndStoreNews();
        
        console.log('\n📊 Summary:');
        console.log(`   Deleted: ${deletedCount} flawed articles`);
        console.log(`   Stored: ${storedCount} new articles`);
        console.log('🎉 Process completed successfully!');
        
    } catch (error) {
        console.error('❌ Process failed:', error.message);
        process.exit(1);
    }
}

main();