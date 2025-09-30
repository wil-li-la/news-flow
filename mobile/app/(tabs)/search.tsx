import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Search as SearchIcon, TrendingUp, ChevronLeft } from 'lucide-react-native';
import CompactArticleCard from '../../components/CompactArticleCard';
import { searchNewsApi } from '../../lib/api';
import { NewsArticle } from '../../types';
import { colors, spacing, typography, shadows, borderRadius } from '../../lib/design';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NewsArticle[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<{ id: string; query: string; count: number }[]>([]);

  const canSearch = useMemo(() => q.trim().length > 1, [q]);

  const onSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    try {
      const r = await searchNewsApi(q, 20);
      setResults(r);
      setHistory((prev) => [{ id: `search-${Date.now()}`, query: q, count: r.length }, ...prev].slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  const popular = useMemo(
    () => ['OpenAI', 'Tesla', 'Apple', 'Google', 'Microsoft', 'Meta', 'Bitcoin', 'Climate Change', 'Donald Trump', 'Ukraine War', 'NVIDIA', 'SpaceX'],
    []
  );

  useEffect(() => {
    if (q.trim().length > 2) {
      const filtered = popular.filter((p) => p.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [q, popular]);

  const handleBack = async () => {
    // If there's an active query or results shown, clear to stay on Search screen
    if (q.length > 0 || results.length > 0 || suggestions.length > 0) {
      setQ('');
      setResults([]);
      setSuggestions([]);
      return;
    }
    router.back();
  };

  const BOTTOM_BAR_HEIGHT = 64;
  const paddingBottom = insets.bottom + BOTTOM_BAR_HEIGHT + 24;
  return (
    <View style={{ flex: 1, backgroundColor: colors.gray100 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <Pressable onPress={handleBack} style={styles.iconBtn}>
          <ChevronLeft color={colors.gray600} size={16} />
        </Pressable>
        <Text style={styles.title}>Search</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search news topics, people, companies…"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={onSearch}
          style={styles.input}
          returnKeyType="search"
          autoFocus
        />
        <Pressable disabled={!canSearch} onPress={onSearch} style={[styles.searchBtn, !canSearch && { opacity: 0.5 }]}>
          <SearchIcon color="#fff" size={16} />
        </Pressable>
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {suggestions.length > 0 && (
            <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 8 }]}>Suggestions</Text>
          )}

          {q.length === 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <TrendingUp color={colors.primary} size={18} />
                <Text style={styles.sectionTitle}>Popular Searches</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {popular.map((p) => (
                  <Pressable key={p} style={styles.popularPill} onPress={async () => { setQ(p); setLoading(true); const r = await searchNewsApi(p, 20); setResults(r); setLoading(false); }}>
                    <Text style={styles.popularText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {history.length > 0 && q.length === 0 && (
            <View style={styles.contentCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Clock color={colors.gray600} size={18} />
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              <View style={{ gap: 8 }}>
                {history.map((h) => (
                  <Pressable key={h.id} style={styles.historyBtn} onPress={async () => { setQ(h.query); setLoading(true); const r = await searchNewsApi(h.query, 20); setResults(r); setLoading(false); }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Clock color={colors.gray400} size={16} />
                      <Text style={{ color: colors.gray900, ...typography.body }}>{h.query}</Text>
                    </View>
                    <Text style={{ color: colors.gray500, ...typography.caption }}>{h.count} results</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8, paddingBottom }}
            renderItem={({ item }) => (
              <CompactArticleCard article={item} />
            )}
            ListEmptyComponent={q.length > 0 ? <Text style={styles.empty}>No results found. Try different keywords.</Text> : <Text style={styles.empty}>Try a search to see results</Text>}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.sm 
  },
  iconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: borderRadius.full, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    ...shadows.sm,
  },
  title: { ...typography.h2, color: colors.gray900 },
  searchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
  },
  input: { 
    flex: 1, 
    backgroundColor: colors.gray50, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.sm, 
    borderRadius: borderRadius.sm, 
    borderWidth: 1, 
    borderColor: colors.gray200,
    ...typography.body,
  },
  searchBtn: { 
    width: 44, 
    height: 40, 
    backgroundColor: colors.primary, 
    borderRadius: borderRadius.sm, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  empty: { color: colors.gray500, textAlign: 'center', marginTop: spacing.xxl, ...typography.body },
  sectionTitle: { ...typography.body, color: colors.gray700 },
  suggestionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    backgroundColor: colors.gray50, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.md, 
    borderRadius: borderRadius.sm, 
    borderWidth: 1, 
    borderColor: colors.gray200 
  },
  popularPill: { 
    paddingHorizontal: spacing.sm, 
    paddingVertical: spacing.sm, 
    backgroundColor: colors.infoLight, 
    borderRadius: borderRadius.full 
  },
  popularText: { color: colors.primaryDark, ...typography.small },
  historyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: colors.gray50, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.md, 
    borderRadius: borderRadius.sm, 
    borderWidth: 1, 
    borderColor: colors.gray200 
  },

  contentCard: {
    backgroundColor: colors.white,
    marginBottom: 12,
    padding: 16,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  }
});
