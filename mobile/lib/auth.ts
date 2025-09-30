import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

export function configureAws() {
  Amplify.configure(outputs);
  console.log('AWS Amplify configured');
}