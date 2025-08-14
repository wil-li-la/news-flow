import React, { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, Users, ChevronRight, Calendar, Star } from 'lucide-react';
import { SwipeAction, KeywordCluster, KnowledgeSeries } from '../types';
import { generateKeywordClusters, generateKnowledgeSeries } from '../utils/knowledgeUtils';

interface KnowledgeOrganizationProps {
  swipeHistory: SwipeAction[];
  onBack: () => void;
}

export const KnowledgeOrganization: React.FC<KnowledgeOrganizationProps> = ({ 
  swipeHistory, 
  onBack 
}) => {
  const [selectedCluster, setSelectedCluster] = useState<KeywordCluster | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<KnowledgeSeries | null>(null);

  const liked = useMemo(
    () => swipeHistory.filter(s => s.direction === 'right' && s.article),
    [swipeHistory]
  );

  // normalize optional article fields so we never try to access an undefined object
  const normalized = useMemo(() => {
    return liked.map(s => ({
      ...s,
      article: {
        ...s.article,
        summary: s.article.summary ?? s.article.description ?? '',
        category: s.article.category ?? 'general',
        region: s.article.region ?? 'world',
        publishedAt: s.article.publishedAt ?? null,
      }
    }));
  }, [liked])

  // same function, now use normalized objects
  const { series } = useMemo(() => {
    const clusters = generateKeywordClusters(normalized);
    const series = generateKnowledgeSeries(clusters);
    return { series };
  }, [normalized]);

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'mixed') => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
    }
  };

  // change to accept missing dates
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (selectedCluster) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCluster(null)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 capitalize">{selectedCluster.keyword}</h1>
                <p className="text-sm text-gray-600">{selectedCluster.articles.length} articles</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Cluster Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Keyword Analysis</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(selectedCluster.sentiment)}`}>
                  {selectedCluster.sentiment}
                </span>
              </div>
              
              {selectedCluster.relatedKeywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Related Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCluster.relatedKeywords.map(keyword => (
                      <span key={keyword} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Articles */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
              {selectedCluster.articles.map(article => (
                <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  {/* add fallback to image*/}
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-senter text-xs text-gray-400 flex-shrink-0">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{article.title}</h3>

                      {/* add fallback to category */}
                      {article.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs ml-2 flex-shrink-0">
                          {article.category}
                        </span>
                      )}
                    </div>
                    
                    {/* add fallback to summary */}
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                      {article.summary ?? article.description ?? ''}
                    </p>
                    
                    {/* add fallback to date */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.source ?? ''}</span>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (selectedSeries) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSeries(null)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selectedSeries.title}</h1>
                <p className="text-sm text-gray-600">{selectedSeries.category} • {selectedSeries.articles.length} articles</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Series Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">About This Series</h2>
                  <p className="text-gray-600 mb-4">{selectedSeries.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeries.keywords.map(keyword => (
                      <span key={keyword} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
              </div>
              
              <div className="space-y-6">
                {selectedSeries.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        event.importance > 0.7 ? 'bg-purple-600' : 'bg-gray-300'
                      }`} />
                      {index < selectedSeries.timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                        {event.importance > 0.7 && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 text-sm">{event.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (swipeHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Knowledge Organization</h1>
                <p className="text-sm text-gray-600">Organize your news insights</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Knowledge Yet</h3>
              <p className="text-gray-600 text-sm">Start swiping on news articles to build your knowledge base</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Knowledge Organization</h1>
                <p className="text-sm text-gray-600">Organize your news insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Series</h2>
            <span className="text-sm text-gray-600">{series.length} series found</span>
          </div>

          {series.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Series Yet</h3>
              <p className="text-gray-600">Swipe on more related articles to generate knowledge series</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {series.map(seriesItem => (
                <div
                  key={seriesItem.id}
                  onClick={() => setSelectedSeries(seriesItem)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {seriesItem.title}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{seriesItem.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{seriesItem.articles.length} articles</span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            {seriesItem.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {seriesItem.keywords.slice(0, 2).map(keyword => (
                            <span key={keyword} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};