import React, { memo, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink, Heart, X } from 'lucide-react-native';
import { NewsArticle } from '../types';
import { colors, spacing, typography, shadows, borderRadius } from '../lib/design';

type Props = {
  article: NewsArticle;
  variant?: 'list' | 'swipe';
  onPass?: () => void;
  onLike?: () => void;
  onOpenLink?: () => void;
};

function ArticleCard({ article, variant = 'list', onPass, onLike, onOpenLink }: Props) {
  const [img, setImg] = useState<string | null | undefined>(article.imageUrl);
  
  // Debug image URL
  console.log('🖼️ ArticleCard:', article.id, 'imageUrl:', article.imageUrl, 'img state:', img);
  const SWIPE_CARD_HEIGHT = useMemo(() => {
    const h = Dimensions.get('window').height;
    return Math.round(Math.max(540, Math.min(720, h * 0.72)));
  }, []);
  const CARD_WIDTH = useMemo(() => Math.round(Dimensions.get('window').width - 32), []);
  const thirdHeight = useMemo(() => Math.floor(SWIPE_CARD_HEIGHT / 3) - 20, [SWIPE_CARD_HEIGHT]);
  const maxImgWidth = useMemo(() => Math.floor(thirdHeight / 0.75), [thirdHeight]); // 4:3 => w = h / 0.75
  const topImageSize = useMemo(() => {
    return { width: CARD_WIDTH, height: thirdHeight };
  }, [CARD_WIDTH, thirdHeight]);

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
              onError={(error) => {
                console.log('❌ Image load error for:', img, 'Error:', error.nativeEvent?.error);
                setImg(null);
              }}
              onLoad={() => console.log('✅ Image loaded successfully:', img)}
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
          ) : !!(article.structuredSummary ?? article.summary ?? article.description) ? (
            <Text style={styles.summary} numberOfLines={5}>
              {article.structuredSummary ?? article.summary ?? article.description}
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
            <Pressable onPress={onPass} style={[styles.ctrlBtn, { backgroundColor: colors.errorLight }]}> 
              <X color={colors.error} size={22} />
            </Pressable>
            <Pressable
              onPress={onOpenLink || (() => { if (article.url) Linking.openURL(article.url).catch(() => {}); })}
              style={[styles.ctrlBtn, { backgroundColor: colors.gray100 }]}
            >
              <ExternalLink color={colors.primary} size={22} />
            </Pressable>
            <Pressable onPress={onLike} style={[styles.ctrlBtn, { backgroundColor: colors.successLight }]}> 
              <Heart color={colors.success} size={22} />
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
          <Image 
            source={{ uri: img }} 
            style={styles.image} 
            resizeMode="cover" 
            onError={(error) => {
              console.log('❌ List image load error for:', img, 'Error:', error.nativeEvent?.error);
              setImg(null);
            }}
            onLoad={() => console.log('✅ List image loaded successfully:', img)}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {!!article.category && (
          <View style={styles.categoryPill}><Text style={styles.categoryText}>{article.category}</Text></View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
        {!!(article.structuredSummary ?? article.summary ?? article.description) && (
          <Text style={styles.summary} numberOfLines={4}>
            {article.structuredSummary ?? article.summary ?? article.description}
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.md,
  },
  // Swipe variant thirds
  thirdTop: { flex: 1, position: 'relative' },
  thirdMiddle: { flex: 1, paddingHorizontal: 16, paddingBottom: 8 },
  thirdBottom: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 12 },
  topImage: { width: '100%', height: '100%', borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg } as any,
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 24 },
  ctrlBtn: { width: 64, height: 64, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: Math.round(Math.max(320, Math.min(520, Dimensions.get('window').height * 0.55))) } as any,
  imagePlaceholder: { backgroundColor: colors.gray100 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h3, color: colors.gray900 },
  summary: { marginTop: spacing.sm, ...typography.small, color: colors.gray700 },
  metaRow: { marginTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  meta: { ...typography.caption, color: colors.gray500 },
  categoryPill: { position: 'absolute', left: spacing.md, top: spacing.md, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full },
  categoryText: { color: colors.white, ...typography.captionMedium },
  bullet: { color: colors.gray700, ...typography.small }
});

export default memo(ArticleCard);
