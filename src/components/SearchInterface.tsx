import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X, TrendingUp } from 'lucide-react';
import { NewsArticle, SearchResult } from '../types';
import { searchNews } from '../data/mockNews';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { mockNews } from '../data/mockNews';

interface SearchInterfaceProps {
  onSearchResults: (results: NewsArticle[], query: string) => void;
  onClose: () => void;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ onSearchResults, onClose }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchHistory, addSearchResult } = useSearchHistory();

  const popularSearches = [
    'ChatGPT', 'Warren Buffett', 'Climate Change', 'Quantum Computing',
    'Renewable Energy', 'AI Ethics', 'Tesla', 'Space Exploration',
    'Cryptocurrency', 'Medical Breakthroughs'
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const filtered = popularSearches.filter(search => 
        search.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      try {
        const response = await fetch(`/api/news/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results: NewsArticle[] = await response.json();
        
        // Add to search history
        const searchResult: SearchResult = {
          id: `search-${Date.now()}`,
          query: searchQuery,
          articles: results,
          timestamp: new Date().toISOString()
        };
        addSearchResult(searchResult);
        
        onSearchResults(results, searchQuery);
      } catch (apiError) {
        console.warn('Search API unavailable, using mock results:', apiError);
        // Fallback to mock search results
        const mockResults = mockNews.filter(article => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 20);
        
        // Add to search history
        const searchResult: SearchResult = {
          id: `search-${Date.now()}`,
          query: searchQuery,
          articles: mockResults,
          timestamp: new Date().toISOString()
        };
        addSearchResult(searchResult);
        
        onSearchResults(mockResults, searchQuery);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search news topics, people, companies..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                )}
              </div>
            </form>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h3>
              <div className="space-y-2">
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {query.length === 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Popular Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map(search => (
                  <button
                    key={search}
                    onClick={() => handleSuggestionClick(search)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm font-medium transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {searchHistory.queries.length > 0 && query.length === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
              </div>
              <div className="space-y-2">
                {searchHistory.queries.slice(0, 10).map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleHistoryClick(result.query)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{result.query}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.articles.length} results
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};