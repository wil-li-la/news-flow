import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshCw, Undo2 } from 'lucide-react-native';
import SwipeCard from '../components/SwipeCard';
import ArticleCard from '../components/ArticleCard';
import { NewsArticle, SwipeDirection } from '../types';
import { fetchNews } from '../lib/api';
import { addSwipeAction } from '../lib/swipeStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<NewsArticle[]>([]);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed liked/passed status pill; no per-session stats needed
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [history, setHistory] = useState<{ id: string; direction: SwipeDirection }[]>([]);

  const current = cards[index];
  const next = cards[index + 1];

  const load = useCallback(async (withSeen: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchNews(8, withSeen);
      setCards(fresh);
      setIndex(0);
    } catch (e: any) {
      setCards([]);
      setError(e?.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load once on mount (no seen items yet)
  useEffect(() => { load([]); }, [load]);

  // Summarization disabled

  const onSwipe = useCallback((dir: SwipeDirection) => {
    if (!current) return;
    const newSeen = [...seen, current.id];
    setSeen(newSeen);
    setHistory(prev => [...prev, { id: current.id, direction: dir }]);
    // record swipe for knowledge network
    addSwipeAction({ articleId: current.id, direction: dir, article: current });
    // Preload more when approaching end
    if (cards.length - index <= 3) {
      (async () => {
        if (isFetchingMore) return;
        try {
          setIsFetchingMore(true);
          const existingIds = new Set(cards.map(c => c.id));
          const more = await fetchNews(8, [...newSeen, ...cards.map(c => c.id)]);
          const unique = more.filter(a => !existingIds.has(a.id));
          if (unique.length) setCards(prev => [...prev, ...unique]);
        } finally {
          setIsFetchingMore(false);
        }
      })();
    }

    if (index < cards.length - 1) {
      setIndex(prev => prev + 1);
    } else {
      load(newSeen);
    }
  }, [cards.length, current, index, isFetchingMore, load, seen]);

  const goPrev = useCallback(() => {
    if (history.length === 0 || index === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setSeen(prev => prev.slice(0, -1));
    setIndex(prev => Math.max(0, prev - 1));
  }, [history, index]);

  // Prefetch images for current and next few cards
  useEffect(() => {
    const nextItems = cards.slice(index, index + 3);
    nextItems.forEach(a => {
      if (a?.imageUrl) Image.prefetch(a.imageUrl).catch(() => {});
    });
  }, [cards, index]);

  const deckProgress = useRef(new Animated.Value(0)).current; // 0..1 while dragging

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading fresh news…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Failed to load</Text>
          <Text style={styles.loadingText}>{error}</Text>
          <Pressable style={styles.refreshBtn} onPress={() => load(seen)}><Text style={styles.refreshBtnText}>Retry</Text></Pressable>
        </View>
      );
    }
    if (!current) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No more articles</Text>
          <Pressable style={styles.refreshBtn} onPress={() => load(seen)}><Text style={styles.refreshBtnText}>Refresh</Text></Pressable>
        </View>
      );
    }

    const visible = cards.slice(index, index + 3);

    const layerStyle = (pos: number): any[] => {
      // All cards overlap exactly; only zIndex/elevation differs
      if (pos === 0) return [styles.cardWrapper, styles.currentCard, { zIndex: 2, elevation: 6 }];
      if (pos === 1) return [styles.cardWrapper, { zIndex: 1, elevation: 4 }];
      return [styles.cardWrapper, { zIndex: 0, elevation: 3 }];
    };

    return (
      <View style={styles.cardStack}>
        {visible.map((a, i) => {
          const pos = i; // 0 -> top, 1 -> next, 2 -> third
          const key = `${a.id}-${pos}`;
          if (pos === 0) {
            return (
              <Animated.View key={key} style={layerStyle(pos)}>
                <SwipeCard
                  isActive
                  onSwipeLeft={() => onSwipe('left')}
                  onSwipeRight={() => onSwipe('right')}
                  onDragProgress={(p) => deckProgress.setValue(p)}
                >
                  <ArticleCard
                    variant="swipe"
                    article={a}
                    onPass={() => onSwipe('left')}
                    onLike={() => onSwipe('right')}
                    onOpenLink={() => { if (a?.url) Linking.openURL(a.url).catch(() => {}); }}
                  />
                </SwipeCard>
              </Animated.View>
            );
          }
          return (
            <Animated.View key={key} style={layerStyle(pos)} pointerEvents="none">
              <ArticleCard variant="swipe" article={a} />
            </Animated.View>
          );
        }).reverse()}
      </View>
    );
  }, [loading, current, cards, index, onSwipe, load, deckProgress]);

  // Respect bottom tab bar so controls aren't hidden
  const BOTTOM_BAR_HEIGHT = 64;
  const BOTTOM_BAR_MARGIN = 12;
  const paddingBottom = insets.bottom + BOTTOM_BAR_HEIGHT + BOTTOM_BAR_MARGIN + 16;

  return (
    <View style={styles.container}>
      {/* Top app bar within safe area */}
      <View style={[styles.appBar, { paddingTop: insets.top + 10 }]}> 
        <Pressable onPress={() => load(seen)} style={[styles.iconBtn, { backgroundColor: '#e2e8f0' }]} accessibilityRole="button" accessibilityLabel="Refresh">
          <RefreshCw color="#0f172a" size={16} />
        </Pressable>
        <Text style={styles.appBarTitle}>For You</Text>
        <Pressable onPress={goPrev} style={[styles.iconBtn, { backgroundColor: '#0ea5e9' }]} accessibilityRole="button" accessibilityLabel="Undo last swipe">
          <Undo2 color="#fff" size={16} />
        </Pressable>
      </View>

      {/* Status pill removed for immersive UI */}

      {/* Card deck */}
      <View style={[styles.deck, { paddingBottom }]}>
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  appBarTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  iconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  // subHeader removed
  deck: { flex: 1, paddingHorizontal: 16, position: 'relative' },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  currentCard: {
    zIndex: 2,
    transform: [{ scale: 1 }]
  },
  nextCard: {
    zIndex: 1,
    transform: [{ scale: 0.95 }],
    opacity: 0.5
  },
  centered: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    color: '#475569',
    fontSize: 16
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 16 
  },
  refreshBtn: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#2563eb', 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  refreshBtnText: { 
    color: 'white', 
    fontWeight: '700',
    fontSize: 16
  },
  // status pill styles removed
});
