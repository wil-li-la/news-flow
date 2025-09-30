import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Article: a
    .model({
      title: a.string().required(),
      content: a.string(),
      summary: a.string(),
      url: a.string(),
      source: a.string(),
      publishedAt: a.datetime(),
      category: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  UserPreferences: a
    .model({
      userId: a.string().required(),
      customizationLevel: a.integer().default(50),
      preferredCategories: a.string().array(),
      preferredSources: a.string().array(),
    })
    .authorization((allow) => [allow.owner()]),

  UserActivity: a
    .model({
      userId: a.string().required(),
      articleId: a.string().required(),
      action: a.enum(['viewed', 'liked', 'disliked', 'shared']),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});