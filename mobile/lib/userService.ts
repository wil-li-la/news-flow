import { client } from './dataClient';
import { getCurrentUser } from 'aws-amplify/auth';

export async function createUserProfile(email: string, name?: string) {
  try {
    const user = await getCurrentUser();
    return await client.models.UserInfo.create({
      user_id: user.userId,
      email,
      name,
      preferences: {}
    });
  } catch (error) {
    console.error('Failed to create user profile:', error);
    throw error;
  }
}

export async function getUserProfile() {
  try {
    const user = await getCurrentUser();
    const result = await client.models.UserInfo.get({ user_id: user.userId });
    return result.data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: { name?: string; preferences?: any }) {
  try {
    const user = await getCurrentUser();
    return await client.models.UserInfo.update({
      user_id: user.userId,
      ...updates
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
}