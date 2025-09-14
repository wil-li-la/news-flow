import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, BookOpen, Calendar, ChevronRight, Star, Users } from 'lucide-react-native';
import { subscribeSwipeHistory } from '../lib/swipeStore';
import { generateKeywordClusters, generateKnowledgeSeries } from '../lib/knowledgeUtils';
import { KnowledgeSeries, SwipeAction } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KnowledgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<SwipeAction[]>([]);
  const [selected, setSelected] = useState<KnowledgeSeries | null>(null);

  useEffect(() => {
    return subscribeSwipeHistory(setHistory);
  }, []);

  const series = useMemo(() => {
    const clusters = generateKeywordClusters(history);
    return generateKnowledgeSeries(clusters);
  }, [history]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 6) }]}> 
        <Pressable onPress={() => selected ? setSelected(null) : router.back()} style={styles.backBtn}>
          <ArrowLeft color="#475569" size={18} />
        </Pressable>
        <View>
          <Text style={styles.title}>{selected ? selected.title : 'Knowledge Organization'}</Text>
          {!selected && <Text style={styles.subtitle}>Organize your news insights</Text>}
        </View>
      </View>

      {!selected ? (
        <View style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Knowledge Series</Text>
            <Text style={styles.sectionMeta}>{series.length} series found</Text>
          </View>
          {series.length === 0 ? (
            <View style={styles.emptyWrap}>
              <BookOpen color="#cbd5e1" size={48} />
              <Text style={styles.emptyTitle}>No Series Yet</Text>
              <Text style={styles.emptyText}>Swipe on more related articles to generate knowledge series</Text>
            </View>
          ) : (
            <FlatList
              data={series}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => setSelected(item)} style={styles.card}>
                  <View style={styles.iconSquare}><BookOpen color="#7c3aed" size={20} /></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <ChevronRight color="#94a3b8" size={18} />
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.cardMetaRow}>
                        <Users color="#64748b" size={14} />
                        <Text style={styles.cardMetaText}>{item.articles.length} articles</Text>
                        <Text style={styles.categoryPill}>{item.category}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                        {item.keywords.slice(0, 2).map((k) => (
                          <Text key={k} style={styles.keywordPill}>{k}</Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Series meta under header to mirror web */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 12 }}>{selected.category} • {selected.articles.length} articles</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16) }}>
            <View style={styles.detailCard}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.iconSquare, { backgroundColor: '#f3e8ff' }]}><BookOpen color="#7c3aed" size={22} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>About This Series</Text>
                  <Text style={styles.detailText}>{selected.description}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {selected.keywords.map(k => (<Text key={k} style={styles.keywordPill}>{k}</Text>))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Calendar color="#7c3aed" size={18} />
                <Text style={styles.detailTitle}>Timeline</Text>
              </View>
              <View style={{ gap: 16 }}>
                {selected.timeline.map((ev, i) => (
                  <View key={ev.id} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ev.importance > 0.7 ? '#7c3aed' : '#cbd5e1' }} />
                      {i < selected.timeline.length - 1 && <View style={{ width: 2, height: 48, backgroundColor: '#e2e8f0', marginTop: 4 }} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.eventDate}>{formatDate(ev.date || undefined)}</Text>
                        {ev.importance > 0.7 && <Star color="#f59e0b" size={14} />}
                      </View>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      {!!ev.summary && <Text style={styles.eventSummary}>{ev.summary}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 12, color: '#64748b' },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  sectionMeta: { fontSize: 12, color: '#64748b' },

  emptyWrap: { marginTop: 24, alignItems: 'center', gap: 8 },
  emptyTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#111' },
  emptyText: { color: '#64748b' },

  card: { backgroundColor: 'white', borderRadius: 14, padding: 12, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#eef2f7' },
  iconSquare: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1 },
  cardDesc: { marginTop: 4, color: '#475569', fontSize: 13 },
  cardFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 12, color: '#64748b' },
  categoryPill: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f1f5f9', color: '#475569', overflow: 'hidden' },
  keywordPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#ede9fe', color: '#7c3aed', fontSize: 12, overflow: 'hidden' },

  detailCard: { backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#eef2f7', marginBottom: 12 },
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  detailText: { color: '#475569' },
  eventDate: { fontSize: 12, color: '#64748b' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 2 },
  eventSummary: { color: '#475569', fontSize: 13 }
});
