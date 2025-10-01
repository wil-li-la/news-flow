import { APIGatewayClient, PutIntegrationCommand, PutMethodCommand } from '@aws-sdk/client-api-gateway';

const apiGateway = new APIGatewayClient({ region: 'ap-southeast-2' });
const API_ID = 'oq5bvm222k';
const ACCOUNT_ID = '146739321042';

const integrations = [
  {
    resourceId: '28sjp0', // /items
    httpMethod: 'GET',
    lambdaFunction: 'newsflow-news-api'
  },
  {
    resourceId: 'lgmdwc', // /search  
    httpMethod: 'GET',
    lambdaFunction: 'newsflow-news-api'
  },
  {
    resourceId: '90nrn8', // /user/{userId}
    httpMethod: 'GET', 
    lambdaFunction: 'newsflow-user-api'
  },
  {
    resourceId: '90nrn8', // /user/{userId}
    httpMethod: 'PUT',
    lambdaFunction: 'newsflow-user-api'  
  },
  {
    resourceId: 'ciip5n', // /user/{userId}/activity
    httpMethod: 'POST',
    lambdaFunction: 'newsflow-user-api'
  }
];

async function updateIntegration(integration) {
  const lambdaUri = `arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-2:${ACCOUNT_ID}:function:${integration.lambdaFunction}/invocations`;
  
  console.log(`🔗 Updating ${integration.httpMethod} ${integration.resourceId} -> ${integration.lambdaFunction}`);
  
  await apiGateway.send(new PutIntegrationCommand({
    restApiId: API_ID,
    resourceId: integration.resourceId,
    httpMethod: integration.httpMethod,
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    uri: lambdaUri
  }));
}

async function main() {
  for (const integration of integrations) {
    try {
      await updateIntegration(integration);
      console.log(`✅ Updated ${integration.httpMethod} ${integration.resourceId}`);
    } catch (error) {
      console.error(`❌ Failed to update ${integration.httpMethod} ${integration.resourceId}:`, error.message);
    }
  }
  
  console.log('🎉 API Gateway integrations updated!');
  console.log('📝 Remember to deploy the API stage to activate changes');
}

main().catch(console.error);