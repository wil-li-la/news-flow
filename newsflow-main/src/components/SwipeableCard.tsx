import React, { useState, useRef } from 'react';
import { Heart, X, Clock, MapPin } from 'lucide-react';
import { NewsArticle, SwipeAction } from '../types';

interface SwipeableCardProps {
  article: NewsArticle;
  onSwipe: (action: SwipeAction) => void;
  isActive: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ article, onSwipe, isActive }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number, clientY: number) => {
    if (!isActive) return;
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isActive) return;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging || !isActive) return;
    
    const threshold = 100;
    const direction = dragOffset.x > threshold ? 'right' : dragOffset.x < -threshold ? 'left' : null;
    
    if (direction) {
      onSwipe({ articleId: article.id, direction, article });
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleLike = () => {
    if (!isActive) return;
    onSwipe({ articleId: article.id, direction: 'right', article });
  };

  const handleDislike = () => {
    if (!isActive) return;
    onSwipe({ articleId: article.id, direction: 'left', article });
  };

  const rotation = isDragging ? dragOffset.x * 0.1 : 0;
  const opacity = isDragging ? Math.max(0.7, 1 - Math.abs(dragOffset.x) * 0.002) : 1;
  const scale = isActive ? 1 : 0.95;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      ref={cardRef}
      className={`absolute inset-0 transition-all duration-200 ${isActive ? 'z-20' : 'z-10'}`}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
        opacity
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-full max-w-sm mx-auto">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-sm font-medium">{article.category}</span>
          </div>
          {dragOffset.x > 50 && (
            <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
              <Heart className="w-16 h-16 text-white" fill="currentColor" />
            </div>
          )}
          {dragOffset.x < -50 && (
            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
              <X className="w-16 h-16 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
            {article.title}
          </h2>
          
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
            {article.summary}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{article.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 font-medium">
            {article.source}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-6">
          <button
            onClick={handleDislike}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
            disabled={!isActive}
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <button
            onClick={handleLike}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
            disabled={!isActive}
          >
            <Heart className="w-6 h-6" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};