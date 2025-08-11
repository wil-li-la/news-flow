import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Newspaper, TrendingUp } from 'lucide-react';
import { SwipeableCard } from './components/SwipeableCard';
import { SettingsModal } from './components/SettingsModal';
import { usePreferences } from './hooks/usePreferences';
import { mockNews, getPersonalizedNews, getRandomNews } from './data/mockNews';
import { NewsArticle, SwipeAction } from './types';

function App() {
  const { preferences, updatePreferences, setPersonalizedRatio } = usePreferences();
  const [currentArticles, setCurrentArticles] = useState<NewsArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seenArticleIds, setSeenArticleIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ liked: 0, passed: 0 });

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

  useEffect(() => {
    loadNewArticles();
  }, [preferences.personalizedRatio]);

  const handleSwipe = (swipeAction: SwipeAction) => {
    updatePreferences(swipeAction);
    
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

  const currentArticle = currentArticles[currentIndex];
  const nextArticle = currentArticles[currentIndex + 1];

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
                <h1 className="text-lg font-bold text-gray-900">NewsFlow</h1>
                <p className="text-xs text-gray-600">Discover your world</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
        <div className="relative h-[600px]">
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