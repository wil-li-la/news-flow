#!/usr/bin/env node

import { execSync } from 'child_process';

const REGION = 'ap-southeast-2';
const LAMBDA_ARN = 'arn:aws:lambda:ap-southeast-2:146739321042:function:news-api';

console.log('🔧 Creating new API Gateway for newsflow...');

try {
  // Create REST API
  console.log('📝 Creating REST API...');
  const apiOutput = execSync(`aws apigateway create-rest-api --name newsflow-api --region ${REGION}`, { encoding: 'utf8' });
  const api = JSON.parse(apiOutput);
  const API_ID = api.id;
  
  console.log('✅ Created API Gateway:', API_ID);
  console.log('🔗 API URL will be: https://' + API_ID + '.execute-api.' + REGION + '.amazonaws.com/prod');
  
  // Get root resource
  const resourcesOutput = execSync(`aws apigateway get-resources --rest-api-id ${API_ID} --region ${REGION}`, { encoding: 'utf8' });
  const resources = JSON.parse(resourcesOutput);
  const rootResource = resources.items.find(r => r.path === '/');
  
  // Create resources and methods
  const createResource = (parentId, pathPart) => {
    const output = execSync(`aws apigateway create-resource --rest-api-id ${API_ID} --region ${REGION} --parent-id ${parentId} --path-part "${pathPart}"`, { encoding: 'utf8' });
    return JSON.parse(output);
  };
  
  const addMethod = (resourceId, method) => {
    execSync(`aws apigateway put-method --rest-api-id ${API_ID} --region ${REGION} --resource-id ${resourceId} --http-method ${method} --authorization-type NONE`, { encoding: 'utf8' });
  };
  
  const addIntegration = (resourceId, method) => {
    if (method === 'OPTIONS') {
      // CORS preflight integration
      execSync(`aws apigateway put-integration --rest-api-id ${API_ID} --region ${REGION} --resource-id ${resourceId} --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}'`, { encoding: 'utf8' });
      execSync(`aws apigateway put-method-response --rest-api-id ${API_ID} --region ${REGION} --resource-id ${resourceId} --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}'`, { encoding: 'utf8' });
      execSync(`aws apigateway put-integration-response --rest-api-id ${API_ID} --region ${REGION} --resource-id ${resourceId} --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'","method.response.header.Access-Control-Allow-Methods":"'GET,POST,PUT,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}'`, { encoding: 'utf8' });
    } else {
      const integrationUri = `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations`;
      execSync(`aws apigateway put-integration --rest-api-id ${API_ID} --region ${REGION} --resource-id ${resourceId} --http-method ${method} --type AWS_PROXY --integration-http-method POST --uri ${integrationUri}`, { encoding: 'utf8' });
    }
  };
  
  // Create /items resource
  console.log('📝 Creating /items resource...');
  const itemsResource = createResource(rootResource.id, 'items');
  addMethod(itemsResource.id, 'GET');
  addMethod(itemsResource.id, 'OPTIONS');
  addIntegration(itemsResource.id, 'GET');
  addIntegration(itemsResource.id, 'OPTIONS');
  
  // Create /search resource
  console.log('📝 Creating /search resource...');
  const searchResource = createResource(rootResource.id, 'search');
  addMethod(searchResource.id, 'GET');
  addMethod(searchResource.id, 'OPTIONS');
  addIntegration(searchResource.id, 'GET');
  addIntegration(searchResource.id, 'OPTIONS');
  
  // Create /user resource
  console.log('📝 Creating /user resource...');
  const userResource = createResource(rootResource.id, 'user');
  
  // Create /user/{userId} resource
  console.log('📝 Creating /user/{userId} resource...');
  const userIdResource = createResource(userResource.id, '{userId}');
  addMethod(userIdResource.id, 'GET');
  addMethod(userIdResource.id, 'PUT');
  addMethod(userIdResource.id, 'OPTIONS');
  addIntegration(userIdResource.id, 'GET');
  addIntegration(userIdResource.id, 'PUT');
  addIntegration(userIdResource.id, 'OPTIONS');
  
  // Create /user/{userId}/activity resource
  console.log('📝 Creating /user/{userId}/activity resource...');
  const activityResource = createResource(userIdResource.id, 'activity');
  addMethod(activityResource.id, 'POST');
  addMethod(activityResource.id, 'OPTIONS');
  addIntegration(activityResource.id, 'POST');
  addIntegration(activityResource.id, 'OPTIONS');
  
  // Add Lambda permission
  console.log('📝 Adding Lambda permissions...');
  const sourceArn = `arn:aws:execute-api:${REGION}:146739321042:${API_ID}/*/*`;
  try {
    execSync(`aws lambda add-permission --function-name news-api --region ${REGION} --statement-id apigateway-invoke-${API_ID} --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "${sourceArn}"`, { encoding: 'utf8' });
  } catch (e) {
    console.log('⚠️  Permission might already exist, continuing...');
  }
  
  // Deploy the API
  console.log('🚀 Deploying API...');
  execSync(`aws apigateway create-deployment --rest-api-id ${API_ID} --region ${REGION} --stage-name prod`, { encoding: 'utf8' });
  
  console.log('✅ Successfully created API Gateway!');
  console.log('');
  console.log('📍 New API URL: https://' + API_ID + '.execute-api.' + REGION + '.amazonaws.com/prod');
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('   GET /items');
  console.log('   GET /search');
  console.log('   GET /user/{userId}');
  console.log('   PUT /user/{userId}');
  console.log('   POST /user/{userId}/activity');
  console.log('');
  console.log('🔧 Next steps:');
  console.log('   1. Update your mobile app API_BASE to use the new URL');
  console.log('   2. Update your .env files with the new API URL');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}