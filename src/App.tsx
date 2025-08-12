import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Newspaper, TrendingUp, Brain, ArrowLeft, BookOpen, Search } from 'lucide-react';
import { SwipeableCard } from './components/SwipeableCard';
import { SettingsModal } from './components/SettingsModal';
import { MindMap } from './components/MindMap';
import { KnowledgeOrganization } from './components/KnowledgeOrganization';
import { SearchInterface } from './components/SearchInterface';
import { SearchResults } from './components/SearchResults';
import { usePreferences } from './hooks/usePreferences';
import { useSwipeHistory } from './hooks/useSwipeHistory';

import { NewsArticle, SwipeAction } from './types';

function App() {
  const { preferences, updatePreferences, setPersonalizedRatio } = usePreferences();
  const { swipeHistory, addSwipeAction } = useSwipeHistory();
  const [currentArticles, setCurrentArticles] = useState<NewsArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seenArticleIds, setSeenArticleIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ liked: 0, passed: 0 });
  const [currentView, setCurrentView] = useState<'news' | 'mindmap' | 'knowledge' | 'search' | 'search-results'>('news');
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  /*   Old mock data loading function
  const loadNewArticles = () => {
    setIsLoading(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const personalizedCount = Math.round(5 * preferences.personalizedRatio);
      const randomCount = 5 - personalizedCount;

      let newArticles: NewsArticle[] = [];

      if (personalizedCount > 0) {
        const personalized = getPersonalizedNews(preferences, seenArticleIds).slice(0, personalizedCount);
        newArticles.push(...personalized);
      }

      if (randomCount > 0) {
        const availableRandom = getRandomNews([...seenArticleIds, ...newArticles.map(a => a.id)]);
        const randomArticles = availableRandom
          .sort(() => Math.random() - 0.5)
          .slice(0, randomCount);
        newArticles.push(...randomArticles);
      }

      // Shuffle the final array
      newArticles = newArticles.sort(() => Math.random() - 0.5);

      setCurrentArticles(newArticles);
      setCurrentIndex(0);
      setIsLoading(false);
    }, 800);
  };
  */

  const loadNewArticles = async () => {
    setIsLoading(true);
    try {
      const seen = encodeURIComponent(seenArticleIds.join(','));
      const res = await fetch(`/api/news?limit=5&seen=${seen}`);
      const data: NewsArticle[] = await res.json();
      setCurrentArticles(data);
      setCurrentIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewArticles();
  }, [preferences.personalizedRatio]);

  // new effect
  useEffect(() => {
    let cancelled = false;

    const toSummarize = currentArticles.filter(
      a => !a.summary && a.description && a.description.length > 0
    );
    if (toSummarize.length === 0) return;

    (async () => {
      const results = await Promise.allSettled(
        toSummarize.map(async a => {
          const res = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: a.title, text: a.description, maxWords: 120 }),
          });
          if (!res.ok) return { id: a.id };
          const j = await res.json();
          return { id: a.id, summary: j.summary, bullets: j.bullets };
        })
      );

      if (cancelled) return;

      const byId = new Map<string, { summary?: string; bullets?: string[] }>();
      results.forEach((r, i) => {
        const id = toSummarize[i].id;
        if (r.status === 'fulfilled' && r.value?.summary) byId.set(id, r.value);
      });
      if (!byId.size) return;

      setCurrentArticles(prev =>
        prev.map(a => (byId.has(a.id) ? { ...a, ...byId.get(a.id)! } : a))
      );
    })();

    return () => { cancelled = true; };
  }, [currentArticles]);

  const handleSwipe = (swipeAction: SwipeAction) => {
    updatePreferences(swipeAction);
    addSwipeAction(swipeAction);
    
    // Update stats
    setStats(prev => ({
      liked: prev.liked + (swipeAction.direction === 'right' ? 1 : 0),
      passed: prev.passed + (swipeAction.direction === 'left' ? 1 : 0)
    }));

    // Add to seen articles
    setSeenArticleIds(prev => [...prev, swipeAction.articleId]);

    // Move to next article
    if (currentIndex < currentArticles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Load new articles when we run out
      loadNewArticles();
    }
  };

  const handleSearchResults = (results: NewsArticle[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setCurrentView('search-results');
  };

  const handleArticleSelect = (article: NewsArticle) => {
    setSelectedArticle(article);
    // You could open a detailed view or add to swipe queue
  };

  const handleBackToNews = () => {
    setCurrentView('news');
  };

  const currentArticle = currentArticles[currentIndex];
  const nextArticle = currentArticles[currentIndex + 1];

  if (currentView === 'mindmap') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('news')}
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Knowledge Network</h1>
                    <p className="text-xs text-gray-600">Your news connections</p>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {swipeHistory.filter(s => s.direction === 'right').length} interests mapped
              </div>
            </div>
          </div>
        </header>

        {/* Mind Map */}
        <main className="h-[calc(100vh-80px)]">
          <MindMap swipeHistory={swipeHistory} />
        </main>
      </div>
    );
  }

  if (currentView === 'knowledge') {
    return (
      <KnowledgeOrganization
        swipeHistory={swipeHistory}
        onBack={() => setCurrentView('news')}
      />
    );
  }

  if (currentView === 'search') {
    return (
      <SearchInterface
        onSearchResults={handleSearchResults}
        onClose={handleBackToNews}
      />
    );
  }

  if (currentView === 'search-results') {
    return (
      <SearchResults
        results={searchResults}
        query={searchQuery}
        onBack={handleBackToNews}
        onArticleSelect={handleArticleSelect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-sm mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CogniSphere</h1>
                <p className="text-xs text-gray-600">Discover your world</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('mindmap')}
                className="w-9 h-9 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors"
              >
                <Brain className="w-4 h-4 text-purple-600" />
              </button>
              <button
                onClick={() => setCurrentView('knowledge')}
                className="w-9 h-9 bg-indigo-100 hover:bg-indigo-200 rounded-full flex items-center justify-center transition-colors"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </button>
              <button
                onClick={() => setCurrentView('search')}
                className="w-9 h-9 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center transition-colors"
              >
                <Search className="w-4 h-4 text-orange-600" />
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={loadNewArticles}
                disabled={isLoading}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-sm mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{stats.liked} liked</span>
            </div>
            <div className="text-gray-500">
              <span className="font-medium">{stats.passed} passed</span>
            </div>
          </div>
          <div className="text-gray-400 text-xs">
            {Math.round(preferences.personalizedRatio * 100)}% personalized
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-sm mx-auto px-4 pb-8">
        <div className="relative h-[600px] sm:h-[760px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full h-full max-w-sm mx-auto flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                  <p className="text-gray-600 font-medium">Loading fresh news...</p>
                </div>
              </div>
            </div>
          ) : currentArticles.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full h-full max-w-sm mx-auto flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <Newspaper className="w-16 h-16 text-gray-300 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No more articles</h3>
                    <p className="text-gray-600 text-sm">Tap refresh to load more news</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Next card (background) */}
              {nextArticle && (
                <SwipeableCard
                  key={nextArticle.id}
                  article={nextArticle}
                  onSwipe={handleSwipe}
                  isActive={false}
                />
              )}
              
              {/* Current card (foreground) */}
              {currentArticle && (
                <SwipeableCard
                  key={currentArticle.id}
                  article={currentArticle}
                  onSwipe={handleSwipe}
                  isActive={true}
                />
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        {currentArticles.length > 0 && !isLoading && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Swipe right to like • Swipe left to pass
            </p>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdateRatio={setPersonalizedRatio}
      />
    </div>
  );
}

export default App;