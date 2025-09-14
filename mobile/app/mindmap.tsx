import React, { useEffect, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Brain, Building2, Globe } from 'lucide-react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { subscribeSwipeHistory } from '../lib/swipeStore';
import { MindMapLink, MindMapNode, MindMapViewMode, SwipeAction } from '../types';
import { generateMindMapData, getCategoryColor, getLinkColor, getRegionColor, layoutNodes } from '../lib/mindMapUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MindMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<SwipeAction[]>([]);
  const [mode, setMode] = useState<MindMapViewMode>('semantic');

  useEffect(() => subscribeSwipeHistory(setHistory), []);

  const { nodes, links } = useMemo(() => generateMindMapData(history, mode), [history, mode]);

  const { width, height } = Dimensions.get('window');
  const canvasW = width;
  const canvasH = height - Math.max(64, insets.top + 64);
  const positions = useMemo(() => layoutNodes(canvasW, canvasH, nodes), [canvasW, canvasH, nodes]);

  const ModeIcon = (m: MindMapViewMode) => (m === 'category' ? Building2 : m === 'region' ? Globe : Brain);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 6) }]}> 
        <Pressable onPress={() => router.back()} style={styles.backBtn}><ArrowLeft color="#475569" size={18} /></Pressable>
        <View>
          <Text style={styles.title}>Knowledge Network</Text>
          <Text style={styles.subtitle}>Your news connections</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* View mode toggle */}
      <View style={styles.modeBar}>
        {(['semantic','category','region'] as MindMapViewMode[]).map((m) => {
          const Icon = ModeIcon(m);
          const active = m === mode;
          return (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.modeBtn, active && styles.modeBtnActive]}>
              <Icon color={active ? '#fff' : '#475569'} size={16} />
              <Text style={[styles.modeText, active && { color: '#fff' }]}>{m[0].toUpperCase() + m.slice(1)}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Simple SVG graph (radial layout) */}
      <View style={{ flex: 1 }}>
        <Svg width={canvasW} height={canvasH}>
          {links.map((l: MindMapLink) => {
            const s = positions[l.source];
            const t = positions[l.target];
            if (!s || !t) return null;
            return (
              <Line key={`${l.source}-${l.target}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={getLinkColor(l.type)} strokeOpacity={Math.max(0.2, 0.3 + l.strength * 0.7)} strokeWidth={1 + l.strength * 3} />
            );
          })}
          {nodes.map((n: MindMapNode) => {
            const p = positions[n.id];
            if (!p) return null;
            const r = 16 + Math.min(12, (n.articleCount || 1) * 2);
            const fill = mode === 'region' ? getRegionColor(n.region) : getCategoryColor(n.category);
            return (
              <React.Fragment key={n.id}>
                <Circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={n.sentiment === 'liked' ? '#10B981' : '#EF4444'} strokeWidth={3} />
                <SvgText x={p.x} y={p.y + r + 12} fontSize="10" fill="#374151" textAnchor="middle">{n.title}</SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 12, color: '#64748b' },
  modeBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f1f5f9' },
  modeBtnActive: { backgroundColor: '#2563eb' },
  modeText: { color: '#475569', fontWeight: '600' },
});
