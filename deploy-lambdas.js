import { LambdaClient, UpdateFunctionCodeCommand, CreateFunctionCommand, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const lambda = new LambdaClient({ region: 'ap-southeast-2' });

const functions = [
  {
    name: 'newsflow-news-api',
    file: 'news-api.js',
    handler: 'news-api.handler',
    description: 'NewsFlow news API endpoints'
  },
  {
    name: 'newsflow-user-api', 
    file: 'user-api.js',
    handler: 'user-api.handler',
    description: 'NewsFlow user management API'
  },
  {
    name: 'newsflow-summarize-api',
    file: 'summarize-api.js', 
    handler: 'summarize-api.handler',
    description: 'NewsFlow AI summarization API'
  }
];

async function packageLambda(functionFile) {
  console.log(`📦 Packaging ${functionFile}...`);
  
  // Create temporary directory and copy files
  execSync('rm -rf /tmp/lambda-package && mkdir -p /tmp/lambda-package');
  execSync(`cp lambda/${functionFile} /tmp/lambda-package/`);
  execSync('cp lambda/package.json /tmp/lambda-package/');
  
  // Install dependencies
  execSync('cd /tmp/lambda-package && npm install --production', { stdio: 'inherit' });
  
  // Create zip
  execSync('cd /tmp/lambda-package && zip -r ../lambda-package.zip .');
  
  return readFileSync('/tmp/lambda-package.zip');
}

async function functionExists(functionName) {
  try {
    await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
    return true;
  } catch (error) {
    return false;
  }
}

async function deployFunction(func) {
  console.log(`🚀 Deploying ${func.name}...`);
  
  const zipBuffer = await packageLambda(func.file);
  
  const exists = await functionExists(func.name);
  
  if (exists) {
    // Update existing function
    await lambda.send(new UpdateFunctionCodeCommand({
      FunctionName: func.name,
      ZipFile: zipBuffer
    }));
    console.log(`✅ Updated ${func.name}`);
  } else {
    // Create new function
    await lambda.send(new CreateFunctionCommand({
      FunctionName: func.name,
      Runtime: 'nodejs18.x',
      Role: process.env.LAMBDA_EXECUTION_ROLE_ARN,
      Handler: func.handler,
      Code: { ZipFile: zipBuffer },
      Description: func.description,
      Environment: {
        Variables: {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY
        }
      }
    }));
    console.log(`✅ Created ${func.name}`);
  }
}

async function main() {
  if (!process.env.LAMBDA_EXECUTION_ROLE_ARN) {
    console.error('❌ LAMBDA_EXECUTION_ROLE_ARN environment variable required');
    process.exit(1);
  }
  
  for (const func of functions) {
    try {
      await deployFunction(func);
    } catch (error) {
      console.error(`❌ Failed to deploy ${func.name}:`, error.message);
    }
  }
  
  console.log('🎉 Lambda deployment complete!');
}

main().catch(console.error);