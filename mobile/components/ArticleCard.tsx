import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, Heart, X } from 'lucide-react-native';
import { NewsArticle } from '../types';

type Props = {
  article: NewsArticle;
  variant?: 'list' | 'swipe';
  onPass?: () => void;
  onLike?: () => void;
  onOpenLink?: () => void;
};

export default function ArticleCard({ article, variant = 'list', onPass, onLike, onOpenLink }: Props) {
  const [img, setImg] = useState<string | null | undefined>(article.imageUrl);
  const SWIPE_CARD_HEIGHT = useMemo(() => {
    const h = Dimensions.get('window').height;
    return Math.round(Math.max(540, Math.min(720, h * 0.72)));
  }, []);
  const CARD_WIDTH = useMemo(() => Math.round(Dimensions.get('window').width - 32), []);
  const thirdHeight = useMemo(() => Math.floor(SWIPE_CARD_HEIGHT / 3) - 20, [SWIPE_CARD_HEIGHT]);
  const maxImgWidth = useMemo(() => Math.floor(thirdHeight / 0.75), [thirdHeight]); // 4:3 => w = h / 0.75
  const topImageSize = useMemo(() => {
    const w = Math.min(CARD_WIDTH - 20, maxImgWidth);
    const h = Math.round(w * 0.75);
    return { width: w, height: h };
  }, [CARD_WIDTH, maxImgWidth]);

  if (variant === 'swipe') {
    return (
      <View style={[styles.card, { height: SWIPE_CARD_HEIGHT }]}> 
        {/* Top 1/3: Image at 4:3 within the third */}
        <View style={styles.thirdTop}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={[styles.topImage, topImageSize]}
              resizeMode="cover"
              onError={() => setImg(null)}
            />
          ) : (
            <View style={[styles.topImage, styles.imagePlaceholder, topImageSize]} />
          )}
          {!!article.category && (
            <View style={styles.categoryPill}><Text style={styles.categoryText}>{article.category}</Text></View>
          )}
        </View>

        {/* Middle 1/3: Content */}
        <View style={styles.thirdMiddle}>
          <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
          {Array.isArray(article.bullets) && article.bullets.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {article.bullets.slice(0, 4).map((b, i) => (
                <Text key={i} style={styles.bullet} numberOfLines={1}>• {b}</Text>
              ))}
            </View>
          ) : !!(article.summary ?? article.description) ? (
            <Text style={styles.summary} numberOfLines={5}>
              {article.summary ?? article.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{article.source}</Text>
            {article.publishedAt ? (
              <Text style={styles.meta}>{formatDate(article.publishedAt)}</Text>
            ) : null}
          </View>
        </View>

        {/* Bottom 1/3: Controls */}
        <View style={styles.thirdBottom}>
          <View style={styles.controlsRow}>
            <Pressable onPress={onPass} style={[styles.ctrlBtn, { backgroundColor: '#fee2e2' }]}> 
              <X color="#ef4444" size={22} />
            </Pressable>
            <Pressable
              onPress={onOpenLink || (() => { if (article.url) Linking.openURL(article.url).catch(() => {}); })}
              style={[styles.ctrlBtn, { backgroundColor: '#e0e7ff' }]}
            >
              <ExternalLink color="#4338ca" size={22} />
            </Pressable>
            <Pressable onPress={onLike} style={[styles.ctrlBtn, { backgroundColor: '#dcfce7' }]}> 
              <Heart color="#16a34a" size={22} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Default list variant (used in search results)
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="cover" onError={() => setImg(null)} />
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
  // Swipe variant thirds
  thirdTop: { flex: 1, position: 'relative', padding: 10 },
  thirdMiddle: { flex: 1, paddingHorizontal: 16, paddingBottom: 8 },
  thirdBottom: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 12 },
  topImage: { width: '100%', aspectRatio: 4/3, borderRadius: 12, alignSelf: 'center' } as any,
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 24 },
  ctrlBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: Math.round(Math.max(320, Math.min(520, Dimensions.get('window').height * 0.55))) } as any,
  imagePlaceholder: { backgroundColor: '#f0f0f0' },
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  summary: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#444' },
  metaRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#777' },
  categoryPill: { position: 'absolute', left: 12, top: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  categoryText: { color: 'white', fontSize: 12, fontWeight: '600' },
  bullet: { color: '#334155', fontSize: 14, lineHeight: 20 }
});
