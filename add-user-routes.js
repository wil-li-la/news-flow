#!/usr/bin/env node

import { execSync } from 'child_process';

const API_ID = 'a08y6nfdj0';
const REGION = 'ap-southeast-2';
const LAMBDA_ARN = 'arn:aws:lambda:ap-southeast-2:146739321042:function:news-api';

console.log('🔧 Adding user routes to API Gateway...');

try {
  // Get root resource ID
  console.log('📋 Getting API Gateway resources...');
  const resourcesOutput = execSync(`aws apigateway get-resources --rest-api-id ${API_ID} --region ${REGION}`, { encoding: 'utf8' });
  const resources = JSON.parse(resourcesOutput);
  const rootResource = resources.items.find(r => r.path === '/');
  
  if (!rootResource) {
    throw new Error('Root resource not found');
  }
  
  console.log('✅ Root resource ID:', rootResource.id);
  
  // Create /user resource
  console.log('📝 Creating /user resource...');
  const userResourceOutput = execSync(`aws apigateway create-resource --rest-api-id ${API_ID} --region ${REGION} --parent-id ${rootResource.id} --path-part user`, { encoding: 'utf8' });
  const userResource = JSON.parse(userResourceOutput);
  console.log('✅ Created /user resource:', userResource.id);
  
  // Create /user/{userId} resource
  console.log('📝 Creating /user/{userId} resource...');
  const userIdResourceOutput = execSync(`aws apigateway create-resource --rest-api-id ${API_ID} --region ${REGION} --parent-id ${userResource.id} --path-part "{userId}"`, { encoding: 'utf8' });
  const userIdResource = JSON.parse(userIdResourceOutput);
  console.log('✅ Created /user/{userId} resource:', userIdResource.id);
  
  // Create /user/{userId}/activity resource
  console.log('📝 Creating /user/{userId}/activity resource...');
  const activityResourceOutput = execSync(`aws apigateway create-resource --rest-api-id ${API_ID} --region ${REGION} --parent-id ${userIdResource.id} --path-part activity`, { encoding: 'utf8' });
  const activityResource = JSON.parse(activityResourceOutput);
  console.log('✅ Created /user/{userId}/activity resource:', activityResource.id);
  
  // Add GET method to /user/{userId}
  console.log('📝 Adding GET method to /user/{userId}...');
  execSync(`aws apigateway put-method --rest-api-id ${API_ID} --region ${REGION} --resource-id ${userIdResource.id} --http-method GET --authorization-type NONE`, { encoding: 'utf8' });
  
  // Add PUT method to /user/{userId}
  console.log('📝 Adding PUT method to /user/{userId}...');
  execSync(`aws apigateway put-method --rest-api-id ${API_ID} --region ${REGION} --resource-id ${userIdResource.id} --http-method PUT --authorization-type NONE`, { encoding: 'utf8' });
  
  // Add POST method to /user/{userId}/activity
  console.log('📝 Adding POST method to /user/{userId}/activity...');
  execSync(`aws apigateway put-method --rest-api-id ${API_ID} --region ${REGION} --resource-id ${activityResource.id} --http-method POST --authorization-type NONE`, { encoding: 'utf8' });
  
  // Add OPTIONS methods for CORS
  console.log('📝 Adding OPTIONS methods for CORS...');
  execSync(`aws apigateway put-method --rest-api-id ${API_ID} --region ${REGION} --resource-id ${userIdResource.id} --http-method OPTIONS --authorization-type NONE`, { encoding: 'utf8' });
  execSync(`aws apigateway put-method --rest-api-id ${API_ID} --region ${REGION} --resource-id ${activityResource.id} --http-method OPTIONS --authorization-type NONE`, { encoding: 'utf8' });
  
  // Add Lambda integrations
  console.log('📝 Adding Lambda integrations...');
  const integrationUri = `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations`;
  
  // GET /user/{userId} integration
  execSync(`aws apigateway put-integration --rest-api-id ${API_ID} --region ${REGION} --resource-id ${userIdResource.id} --http-method GET --type AWS_PROXY --integration-http-method POST --uri ${integrationUri}`, { encoding: 'utf8' });
  
  // PUT /user/{userId} integration
  execSync(`aws apigateway put-integration --rest-api-id ${API_ID} --region ${REGION} --resource-id ${userIdResource.id} --http-method PUT --type AWS_PROXY --integration-http-method POST --uri ${integrationUri}`, { encoding: 'utf8' });
  
  // POST /user/{userId}/activity integration
  execSync(`aws apigateway put-integration --rest-api-id ${API_ID} --region ${REGION} --resource-id ${activityResource.id} --http-method POST --type AWS_PROXY --integration-http-method POST --uri ${integrationUri}`, { encoding: 'utf8' });
  
  // Add Lambda permissions
  console.log('📝 Adding Lambda permissions...');
  const sourceArn = `arn:aws:execute-api:${REGION}:146739321042:${API_ID}/*/*`;
  execSync(`aws lambda add-permission --function-name news-api --region ${REGION} --statement-id apigateway-user-routes --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "${sourceArn}"`, { encoding: 'utf8' });
  
  // Deploy the API
  console.log('🚀 Deploying API...');
  execSync(`aws apigateway create-deployment --rest-api-id ${API_ID} --region ${REGION} --stage-name prod`, { encoding: 'utf8' });
  
  console.log('✅ Successfully added user routes to API Gateway!');
  console.log('📍 Available endpoints:');
  console.log('   GET /user/{userId}');
  console.log('   PUT /user/{userId}');
  console.log('   POST /user/{userId}/activity');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}