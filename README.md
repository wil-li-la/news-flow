# NewsFlow

A modern news aggregation platform with AI-powered content curation and mobile app interface.

## Features

- **RSS News Ingestion**: Automated news fetching from multiple RSS sources
- **AI-Powered Summarization**: OpenAI integration for intelligent content summarization
- **Smart Content Filtering**: Algorithm-based news scoring and personalized feed
- **User Authentication**: AWS Cognito integration for secure user management
- **Mobile App**: React Native/Expo mobile application
- **Swipe Interface**: Tinder-like UI for news consumption
- **Content Deduplication**: Filters out previously seen articles

## Architecture

- **Backend**: Node.js/Express API with AWS Lambda deployment
- **Database**: AWS DynamoDB for user data and news storage
- **Mobile**: React Native with Expo framework
- **AI**: OpenAI GPT integration for content processing
- **Infrastructure**: AWS Amplify for deployment and hosting

## Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Expo CLI for mobile development

### Installation

```bash
# Clone repository
git clone <repository-url>
cd newsflow

# Install dependencies
npm install
cd mobile && npm install
```

### Development

```bash
# Start API server
npm run dev:api

# Start mobile app (iOS)
npm run ios

# Start mobile app (Android)
npm run android

# Start both API and mobile together
npm run mobile:start
```

## Project Structure

```
newsflow/
├── api/                 # Express.js backend API
├── mobile/             # React Native mobile app
├── lambda/             # AWS Lambda functions
├── amplify/            # AWS Amplify configuration
└── scripts/            # Utility scripts
```

## Environment Setup

Create `.env` files in root and `mobile/` directories with required AWS and OpenAI credentials.

## Deployment

The application is configured for AWS deployment using Amplify and Lambda functions in the `ap-southeast-2` region.

## License

Private project