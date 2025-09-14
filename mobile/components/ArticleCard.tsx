import React from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { NewsArticle } from '../types';

type Props = { article: NewsArticle };

export default function ArticleCard({ article }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {!!article.category && (
          <View style={styles.categoryPill}><Text style={styles.categoryText}>{article.category}</Text></View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
        {!!(article.summary ?? article.description) && (
          <Text style={styles.summary} numberOfLines={4}>
            {article.summary ?? article.description}
          </Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{article.source}</Text>
          {article.publishedAt ? (
            <Text style={styles.meta}>{formatDate(article.publishedAt)}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (Platform.OS === 'ios') {
    try {
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {}
  }
  return d.toISOString().slice(5, 16).replace('T', ' ');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: Math.round(Math.max(260, Math.min(380, Dimensions.get('window').height * 0.4))) } as any,
  imagePlaceholder: { backgroundColor: '#f0f0f0' },
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  summary: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#444' },
  metaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#777' },
  categoryPill: { position: 'absolute', left: 12, top: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  categoryText: { color: 'white', fontSize: 12, fontWeight: '600' }
});
