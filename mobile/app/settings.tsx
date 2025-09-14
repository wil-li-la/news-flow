import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Settings as SettingsIcon, Shuffle, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPreferences, setPersonalizedRatio, subscribePreferences } from '../lib/prefsStore';
import { subscribeSwipeHistory } from '../lib/swipeStore';
import { SwipeAction } from '../types';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prefsVersion, setPrefsVersion] = useState(0);
  const [ratio, setRatio] = useState(getPreferences().personalizedRatio);
  const [history, setHistory] = useState<SwipeAction[]>([]);

  useEffect(() => subscribeSwipeHistory(setHistory), []);
  useEffect(() => subscribePreferences(() => { setPrefsVersion(v => v + 1); setRatio(getPreferences().personalizedRatio); }), []);

  const personalizedPct = Math.round(ratio * 100);
  const randomPct = 100 - personalizedPct;

  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    history.filter(h => h.direction === 'right').forEach(h => {
      const c = h.article.category || 'General';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  }, [history]);

  const topRegions = useMemo(() => {
    const counts: Record<string, number> = {};
    history.filter(h => h.direction === 'right').forEach(h => {
      const r = h.article.region || 'Global';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  }, [history]);

  const adjust = (delta: number) => {
    const next = Math.round((ratio + delta) * 10) / 10;
    setPersonalizedRatio(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 6) }]}> 
        <Pressable onPress={() => router.back()} style={styles.backBtn}><ArrowLeft color="#475569" size={18} /></Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SettingsIcon color="#2563eb" size={20} />
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16) }}>
        {/* Content Mix */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Content Mix</Text>
          <View style={{ gap: 12 }}>
            <View style={styles.rowBetween}>
              <View style={styles.rowCenter}><TrendingUp color="#2563eb" size={16} /><Text style={styles.rowLabel}>Personalized</Text></View>
              <Text style={[styles.pct, { color: '#2563eb' }]}>{personalizedPct}%</Text>
            </View>

            {/* Slider substitute: progress bar and stepper */}
            <View style={styles.progressWrap}>
              <View style={[styles.progressFill, { width: `${personalizedPct}%` }]} />
            </View>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => adjust(-0.1)} style={styles.stepperBtn}><Text style={styles.stepperText}>-</Text></Pressable>
              <Text style={styles.stepperValue}>{ratio.toFixed(1)}</Text>
              <Pressable onPress={() => adjust(+0.1)} style={styles.stepperBtn}><Text style={styles.stepperText}>+</Text></Pressable>
            </View>

            <View style={styles.rowBetween}>
              <View style={styles.rowCenter}><Shuffle color="#ea580c" size={16} /><Text style={styles.rowLabel}>Random</Text></View>
              <Text style={[styles.pct, { color: '#ea580c' }]}>{randomPct}%</Text>
            </View>
          </View>
        </View>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {topCategories.map(([c,count]) => (
                <Text key={c} style={styles.catPill}>{c} ({count})</Text>
              ))}
            </View>
          </View>
        )}

        {/* Preferred Regions */}
        {topRegions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Preferred Regions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {topRegions.map(([r,count]) => (
                <Text key={r} style={styles.regionPill}>{r} ({count})</Text>
              ))}
            </View>
          </View>
        )}

        {/* How it works */}
        <View style={[styles.card, { backgroundColor: '#f8fafc' }] }>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={{ gap: 4 }}>
            <Text style={styles.note}>• Swipe right (❤️) to like news articles</Text>
            <Text style={styles.note}>• Swipe left (❌) to pass on articles</Text>
            <Text style={styles.note}>• Adjust the slider to control content mix</Text>
            <Text style={styles.note}>• Higher personalization = more articles matching your interests</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },

  card: { backgroundColor: 'white', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#eef2f7', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { color: '#334155', marginLeft: 4 },
  pct: { fontWeight: '700' },
  progressWrap: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563eb' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 18, fontWeight: '800', color: '#111' },
  stepperValue: { minWidth: 44, textAlign: 'center', fontWeight: '700', color: '#111' },
  catPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#dbeafe', color: '#1d4ed8' },
  regionPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#dcfce7', color: '#166534' },
  note: { color: '#475569' }
});
