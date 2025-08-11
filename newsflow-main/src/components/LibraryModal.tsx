import React from 'react';
import { X } from 'lucide-react';
import { NewsArticle } from '../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: { [category: string]: NewsArticle[] };
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, library }) => {
  if (!isOpen) return null;

  const categories = Object.keys(library);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Personal Library</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-gray-500">No articles liked yet.</p>
        ) : (
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {library[category].map(article => (
                    <span
                      key={article.id}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {article.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryModal;
