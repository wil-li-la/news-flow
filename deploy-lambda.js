import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('📦 Creating Lambda deployment package...');

// Install dependencies in a temp directory
execSync('mkdir -p lambda-temp && cd lambda-temp && npm init -y', { stdio: 'inherit' });
execSync('cd lambda-temp && npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb', { stdio: 'inherit' });

// Create deployment zip
execSync('cp newsApi-dynamo.js lambda-temp/newsApi.js', { stdio: 'inherit' });
execSync('cd lambda-temp && zip -r ../news-api-lambda.zip .', { stdio: 'inherit' });

console.log('🚀 Deploying to AWS Lambda...');

// Update Lambda function
try {
    execSync(`aws lambda update-function-code --region ap-southeast-2 --function-name news-api --zip-file fileb://news-api-lambda.zip`, { stdio: 'inherit' });
    console.log('✅ Lambda function updated successfully!');
} catch (error) {
    console.error('❌ Failed to update Lambda function:', error.message);
}

// Cleanup
execSync('rm -rf lambda-temp news-api-lambda.zip', { stdio: 'inherit' });