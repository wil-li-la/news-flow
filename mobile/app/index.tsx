import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brain, BookOpen, Newspaper, RefreshCw, Search, Settings, TrendingUp, X, Heart } from 'lucide-react-native';
import SwipeCard from '../components/SwipeCard';
import ArticleCard from '../components/ArticleCard';
import { NewsArticle, SwipeDirection } from '../types';
import { fetchNews, summarize } from '../lib/api';
import { addSwipeAction } from '../lib/swipeStore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<NewsArticle[]>([]);
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ liked: 0, passed: 0 });
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const current = cards[index];
  const next = cards[index + 1];

  const load = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchNews(8, seen);
    setCards(fresh);
    setIndex(0);
    setLoading(false);
  }, [seen]);

  useEffect(() => { load(); }, [load]);

  // Summarize articles missing summary via backend OpenAI API
  useEffect(() => {
    const pending = cards.filter(a => !a.summary && a.description && a.description.length > 0);
    if (pending.length === 0) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, { summary?: string; bullets?: string[] }> = {};
      for (const a of pending) {
        if (summarizingIds.has(a.id)) continue;
        setSummarizingIds(prev => new Set(prev).add(a.id));
        const out = await summarize(a.title, a.description || '', 80);
        if (cancelled) return;
        if (out?.summary) updates[a.id] = out;
      }
      if (Object.keys(updates).length) {
        setCards(prev => prev.map(a => (updates[a.id] ? { ...a, ...updates[a.id] } : a)));
      }
    })();

    return () => { cancelled = true; };
  }, [cards, summarizingIds]);

  const onSwipe = useCallback((dir: SwipeDirection) => {
    if (!current) return;
    setStats((s) => ({ liked: s.liked + (dir === 'right' ? 1 : 0), passed: s.passed + (dir === 'left' ? 1 : 0) }));
    setSeen(prev => [...prev, current.id]);
    // record swipe for knowledge network
    addSwipeAction({ articleId: current.id, direction: dir, article: current });
    // Preload more when approaching end
    if (cards.length - index <= 3) {
      (async () => {
        if (isFetchingMore) return;
        try {
          setIsFetchingMore(true);
          const existingIds = new Set(cards.map(c => c.id));
          const more = await fetchNews(8, [...seen, ...cards.map(c => c.id)]);
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
      load();
    }
  }, [cards.length, current, index, load]);

  // Prefetch images for current and next few cards
  useEffect(() => {
    const nextItems = cards.slice(index, index + 3);
    nextItems.forEach(a => {
      if (a?.imageUrl) Image.prefetch(a.imageUrl).catch(() => {});
    });
  }, [cards, index]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading fresh news…</Text>
        </View>
      );
    }
    if (!current) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No more articles</Text>
          <Pressable style={styles.refreshBtn} onPress={load}><Text style={styles.refreshBtnText}>Refresh</Text></Pressable>
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        {next && (
          <SwipeCard isActive={false} onSwipeLeft={() => {}} onSwipeRight={() => {}}>
            <ArticleCard article={next} />
          </SwipeCard>
        )}
        <SwipeCard isActive onSwipeLeft={() => onSwipe('left')} onSwipeRight={() => onSwipe('right')}>
          <ArticleCard article={current} />
        </SwipeCard>
      </View>
    );
  }, [current, loading, load, next, onSwipe]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 6) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.brandIcon}><Newspaper color="#fff" size={18} /></View>
          <View>
            <Text style={styles.brandTitle}>NewsFlow</Text>
            <Text style={styles.brandSubtitle}>Discover your world</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Link href="/mindmap" asChild>
            <Pressable style={[styles.iconBtn, { backgroundColor: '#ede9fe' }]}><Brain color="#7c3aed" size={16} /></Pressable>
          </Link>
          <Link href="/knowledge" asChild>
            <Pressable style={[styles.iconBtn, { backgroundColor: '#e0e7ff' }]}><BookOpen color="#4f46e5" size={16} /></Pressable>
          </Link>
          <Link href="/search" asChild>
            <Pressable style={[styles.iconBtn, { backgroundColor: '#ffedd5' }]}><Search color="#ea580c" size={16} /></Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={[styles.iconBtn]}><Settings color="#475569" size={16} /></Pressable>
          </Link>
          <Pressable onPress={load} style={[styles.iconBtn, { backgroundColor: '#2563eb' }]}>
            <RefreshCw color="#fff" size={16} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp color="#16a34a" size={16} />
            <Text style={{ color: '#16a34a', fontWeight: '600' }}>{stats.liked} liked</Text>
          </View>
          <Text style={{ color: '#64748b', fontWeight: '600' }}>{stats.passed} passed</Text>
        </View>
      </View>
      <View style={styles.deck}>{content}</View>
      <View style={styles.hintRow}><Text style={styles.hint}>Swipe right to like • Swipe left to pass</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb' },
  header: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  brandSubtitle: { fontSize: 12, color: '#64748b' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  statsRow: { paddingHorizontal: 16, paddingVertical: 8 },
  deck: { flex: 1, padding: 16, position: 'relative' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#475569' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  refreshBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 10 },
  refreshBtnText: { color: 'white', fontWeight: '700' },
  hintRow: { padding: 12, alignItems: 'center' },
  hint: { color: '#64748b' }
});
