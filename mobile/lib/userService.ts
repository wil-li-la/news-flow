import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { NewsArticle } from '../types';

const API_BASE = 'https://oq5bvm222k.execute-api.ap-southeast-2.amazonaws.com/prod';

export const userService = {
  async getUserPreferences() {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      
      const response = await fetch(`${API_BASE}/user/${user.userId}`, {
        headers: {
          'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { customizationLevel: 50, activities: [] };
    }
  },

  async updateCustomizationLevel(level: number) {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      
      const response = await fetch(`${API_BASE}/user/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customizationLevel: level,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      console.log('✅ Customization level updated:', level);
    } catch (error) {
      console.error('Error updating customization level:', error);
      throw error;
    }
  },

  async trackActivity(articleId: string, action: 'viewed' | 'liked' | 'disliked' | 'shared', articleData?: { category?: string; source?: string; region?: string }) {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      
      const response = await fetch(`${API_BASE}/user/${user.userId}/activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleId,
          action,
          timestamp: new Date().toISOString(),
          articleData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      console.log('✅ Activity tracked:', action, articleId, articleData ? 'with metadata' : '');
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw error;
    }
  },

  async getViewedArticles() {
    try {
      const userData = await this.getUserPreferences();
      // Use seenArticles field for better tracking
      const seenArticles = userData?.seenArticles || [];
      console.log('📊 Retrieved', seenArticles.length, 'seen articles from user data');
      return seenArticles;
    } catch (error) {
      console.error('Error getting viewed articles:', error);
      return [];
    }
  }
};