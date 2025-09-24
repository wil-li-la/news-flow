// Fill in your AWS Cognito config to enable real authentication.
// Leave as `null` to use local stub auth for development.

export const AWS_CONFIG: null | {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  identityPoolId?: string;
} = null;

