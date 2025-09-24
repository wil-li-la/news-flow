// Minimal event system to avoid Node's 'events' dependency in RN

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
};

type AwsConfig = {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  identityPoolId?: string;
};

let awsConfig: AwsConfig | null = null;
let currentUser: AuthUser | null = null;
type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();
const emitAuth = () => { listeners.forEach((cb) => cb(currentUser)); };

// Call in app bootstrap once AWS values are available
export function configureAws(config: AwsConfig) {
  awsConfig = config;
}

export function subscribeAuth(cb: (user: AuthUser | null) => void) {
  cb(currentUser);
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getCurrentUser() {
  return currentUser;
}

// Replace the stubs below with real AWS Cognito calls using `aws-amplify`
// Example:
// import { Amplify } from 'aws-amplify';
// import { signIn as aSignIn, signOut as aSignOut, signUp as aSignUp, confirmSignUp as aConfirm } from 'aws-amplify/auth';
// Amplify.configure({ Auth: { region, userPoolId, userPoolWebClientId } });

export async function signIn(email: string, password: string) {
  if (!awsConfig) {
    // Dev stub: accept any non-empty credentials
    if (!email || !password) throw new Error('Email and password required');
    currentUser = { id: `local-${Date.now()}`, email, name: email.split('@')[0] };
    emitAuth();
    return currentUser;
  }
  // TODO: integrate AWS Amplify Auth signIn
  // const out = await aSignIn({ username: email, password });
  // currentUser = { id: out.userId, email };
  // emitAuth();
  // return currentUser;
  throw new Error('AWS Auth not wired yet');
}

export async function signOut() {
  if (!awsConfig) {
    currentUser = null;
    emitAuth();
    return;
  }
  // TODO: integrate AWS Amplify Auth signOut
  // await aSignOut();
  // currentUser = null;
  // emitAuth();
  throw new Error('AWS Auth not wired yet');
}

export async function signUp(params: { email: string; password: string; name?: string }) {
  const { email, password, name } = params;
  if (!awsConfig) {
    // Dev stub: emulate sign-up success
    return { email, delivery: 'email' as const };
  }
  // TODO: integrate AWS Amplify Auth signUp
  // await aSignUp({ username: email, password, options: { userAttributes: { email, name } } });
  throw new Error('AWS Auth not wired yet');
}

export async function confirmSignUp(email: string, code: string) {
  if (!awsConfig) {
    // Dev stub: accept any code
    return true;
  }
  // TODO: integrate AWS Amplify Auth confirmSignUp
  // await aConfirm({ username: email, confirmationCode: code });
  throw new Error('AWS Auth not wired yet');
}
