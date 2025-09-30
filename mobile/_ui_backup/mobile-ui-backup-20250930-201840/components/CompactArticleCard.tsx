import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { NewsArticle } from '../types';
import { colors, spacing, typography, borderRadius } from '../lib/design';

type Props = {
  article: NewsArticle;
};

export default function CompactArticleCard({ article }: Props) {
  const [img, setImg] = useState<string | null | undefined>(article.imageUrl);

  const handlePress = () => {
    if (article.url) {
      Linking.openURL(article.url).catch(() => {});
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.imageContainer}>
        {img ? (
          <Image 
            source={{ uri: img }} 
            style={styles.image} 
            resizeMode="cover" 
            onError={() => setImg(null)} 
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.source}>{article.source}</Text>
        {(article.structuredSummary || article.description) && (
          <Text style={styles.description} numberOfLines={2}>
            {article.structuredSummary || article.description}
          </Text>
        )}
      </View>
      <View style={styles.iconContainer}>
        <ExternalLink color={colors.gray400} size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  imageContainer: {
    marginRight: spacing.sm,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
  },
  imagePlaceholder: {
    backgroundColor: colors.gray100,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.gray900,
    marginBottom: 2,
  },
  source: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 4,
  },
  description: {
    ...typography.small,
    color: colors.gray600,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
});