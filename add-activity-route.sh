#!/bin/bash

# Add the missing POST /user/{userId}/activity route
aws apigatewayv2 create-route \
  --api-id a08y6nfdj0 \
  --route-key "POST /user/{userId}/activity" \
  --target "integrations/$(aws apigatewayv2 get-integrations --api-id a08y6nfdj0 --query 'Items[0].IntegrationId' --output text)" \
  --region ap-southeast-2

echo "✅ Added POST /user/{userId}/activity route"