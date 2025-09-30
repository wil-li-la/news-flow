import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const API_BASE = 'https://a08y6nfdj0.execute-api.ap-southeast-2.amazonaws.com/prod';

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

  async trackActivity(articleId: string, action: 'viewed' | 'liked' | 'disliked' | 'shared') {
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
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      console.log('✅ Activity tracked:', action, articleId);
    } catch (error) {
      console.error('Error tracking activity:', error);
      throw error;
    }
  },

  async getViewedArticles() {
    try {
      const userData = await this.getUserPreferences();
      const activities = userData?.activities || [];
      return activities
        .filter((a: any) => a.action === 'viewed')
        .map((a: any) => a.articleId);
    } catch (error) {
      console.error('Error getting viewed articles:', error);
      return [];
    }
  }
};