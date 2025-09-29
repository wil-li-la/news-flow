import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Search as SearchIcon, TrendingUp } from 'lucide-react-native';
import ArticleCard from '../../components/ArticleCard';
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
    () => ['ChatGPT', 'Warren Buffett', 'Climate Change', 'Quantum Computing', 'Renewable Energy', 'AI Ethics', 'Tesla', 'Space Exploration', 'Cryptocurrency', 'Medical Breakthroughs'],
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
  const BOTTOM_BAR_MARGIN = 12;
  const paddingBottom = insets.bottom + BOTTOM_BAR_HEIGHT + BOTTOM_BAR_MARGIN + 16;
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <Pressable onPress={handleBack} style={styles.backBtn}><Text style={styles.backText}>Back</Text></Pressable>
        <Text style={styles.title}>Search</Text>
      </View>
      <View style={[styles.searchRow, { paddingTop: 10 }]}>
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
        <View style={{ flex: 1 }}>
          {suggestions.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              <View style={{ gap: 8 }}>
                {suggestions.map((s) => (
                  <Pressable key={s} style={styles.suggestionBtn} onPress={async () => { setQ(s); setLoading(true); const r = await searchNewsApi(s, 20); setResults(r); setLoading(false); }}>
                    <SearchIcon color="#94a3b8" size={16} /><Text style={{ color: '#0f172a' }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {q.length === 0 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <TrendingUp color="#2563eb" size={18} />
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
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Clock color="#475569" size={18} />
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              <View style={{ gap: 8 }}>
                {history.map((h) => (
                  <Pressable key={h.id} style={styles.historyBtn} onPress={async () => { setQ(h.query); setLoading(true); const r = await searchNewsApi(h.query, 20); setResults(r); setLoading(false); }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Clock color="#94a3b8" size={16} />
                      <Text style={{ color: '#0f172a' }}>{h.query}</Text>
                    </View>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>{h.count} results</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom }}
            renderItem={({ item }) => (
              <ArticleCard article={item} />
            )}
            ListEmptyComponent={<Text style={styles.empty}>Try a search to see results</Text>}
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
    gap: spacing.md, 
    padding: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.gray200 
  },
  backBtn: { 
    paddingHorizontal: spacing.sm, 
    paddingVertical: 6, 
    backgroundColor: colors.gray100, 
    borderRadius: borderRadius.sm 
  },
  backText: { color: colors.gray900, ...typography.bodySemibold },
  title: { ...typography.h3, color: colors.gray900 },
  searchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    padding: spacing.md 
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
  sectionTitle: { ...typography.smallMedium, color: colors.gray700 },
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
  popularText: { color: colors.primaryDark, ...typography.captionMedium },
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
  }
});
