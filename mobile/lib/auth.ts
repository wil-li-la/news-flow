import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

export function configureAws() {
  try {
    Amplify.configure(outputs);
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
    throw error;
  }
}