import { useState, useEffect } from 'react';
import { SwipeAction } from '../types';

export const useSwipeHistory = () => {
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('swipeHistory');
    if (stored) {
      try {
        setSwipeHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse swipe history:', error);
      }
    }
  }, []);

  const addSwipeAction = (action: SwipeAction) => {
    setSwipeHistory(prev => {
      const newHistory = [...prev, action];
      // Keep only last 50 swipes to prevent storage bloat
      const trimmedHistory = newHistory.slice(-50);
      localStorage.setItem('swipeHistory', JSON.stringify(trimmedHistory));
      return trimmedHistory;
    });
  };

  const clearHistory = () => {
    setSwipeHistory([]);
    localStorage.removeItem('swipeHistory');
  };

  return {
    swipeHistory,
    addSwipeAction,
    clearHistory
  };
};