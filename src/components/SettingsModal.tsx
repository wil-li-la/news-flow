import React from 'react';
import { X, Settings, TrendingUp, Shuffle } from 'lucide-react';
import { UserPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdateRatio: (ratio: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdateRatio
}) => {
  if (!isOpen) return null;

  const personalizedPercentage = Math.round(preferences.personalizedRatio * 100);
  const randomPercentage = 100 - personalizedPercentage;

  const topCategories = Object.entries(preferences.likedCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const topRegions = Object.entries(preferences.likedRegions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Content Ratio */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Mix</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Personalized</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{personalizedPercentage}%</span>
              </div>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preferences.personalizedRatio}
                onChange={(e) => onUpdateRatio(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Random</span>
                </div>
                <span className="text-sm font-bold text-orange-600">{randomPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Your Interests */}
          {topCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Categories</h3>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(([category, count]) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {category} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {topRegions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Regions</h3>
              <div className="flex flex-wrap gap-2">
                {topRegions.map(([region, count]) => (
                  <span
                    key={region}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {region} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">How it works</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Swipe right (❤️) to like news articles</li>
              <li>• Swipe left (❌) to pass on articles</li>
              <li>• Adjust the slider to control content mix</li>
              <li>• Higher personalization = more articles matching your interests</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
};