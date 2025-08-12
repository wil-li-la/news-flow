import React from 'react';
import { ArrowLeft, Search, Clock, MapPin } from 'lucide-react';
import { NewsArticle } from '../types';

interface SearchResultsProps {
  results: NewsArticle[];
  query: string;
  onBack: () => void;
  onArticleSelect: (article: NewsArticle) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  query, 
  onBack, 
  onArticleSelect 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Search Results</h1>
                <p className="text-sm text-gray-600">
                  {results.length} results for "{query}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map(article => (
              <div
                key={article.id}
                onClick={() => onArticleSelect(article)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex gap-4">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs ml-2 flex-shrink-0">
                        {article.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {article.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{article.region}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                      </div>
                      <span className="font-medium">{article.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};