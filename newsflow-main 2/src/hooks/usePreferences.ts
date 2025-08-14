import { useState, useEffect } from 'react';
import { UserPreferences, SwipeAction } from '../types';

const defaultPreferences: UserPreferences = {
  likedCategories: {},
  likedRegions: {},
  dislikedCategories: {},
  dislikedRegions: {},
  personalizedRatio: 0.7 // 70% personalized by default
};

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem('newsPreferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse preferences:', error);
      }
    }
  }, []);

  const savePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('newsPreferences', JSON.stringify(newPreferences));
  };

  const updatePreferences = (swipeAction: SwipeAction) => {
    const { direction, article } = swipeAction;
    const isLike = direction === 'right';

    setPreferences(prev => {
      const newPrefs = { ...prev };

      if (isLike) {
        newPrefs.likedCategories[article.category] = (newPrefs.likedCategories[article.category] || 0) + 1;
        newPrefs.likedRegions[article.region] = (newPrefs.likedRegions[article.region] || 0) + 1;
      } else {
        newPrefs.dislikedCategories[article.category] = (newPrefs.dislikedCategories[article.category] || 0) + 1;
        newPrefs.dislikedRegions[article.region] = (newPrefs.dislikedRegions[article.region] || 0) + 1;
      }

      localStorage.setItem('newsPreferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  const setPersonalizedRatio = (ratio: number) => {
    const newPrefs = { ...preferences, personalizedRatio: ratio };
    savePreferences(newPrefs);
  };

  return {
    preferences,
    updatePreferences,
    setPersonalizedRatio,
    savePreferences
  };
};