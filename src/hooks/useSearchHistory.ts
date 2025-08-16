import { useState, useEffect } from 'react';
import { SearchResult, SearchHistory } from '../types';

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistory>({ queries: [] });

  useEffect(() => {
    const stored = localStorage.getItem('searchHistory');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse search history:', error);
      }
    }
  }, []);

  const addSearchResult = (result: SearchResult) => {
    setSearchHistory(prev => {
      // Remove duplicate queries
      const filteredQueries = prev.queries.filter(q => q.query !== result.query);
      const newHistory = {
        queries: [result, ...filteredQueries].slice(0, 20) // Keep last 20 searches
      };
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory({ queries: [] });
    localStorage.removeItem('searchHistory');
  };

  return {
    searchHistory,
    addSearchResult,
    clearSearchHistory
  };
};