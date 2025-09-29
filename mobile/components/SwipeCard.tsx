import React, { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { Heart, X } from 'lucide-react-native';

type Props = {
  isActive: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: React.ReactNode;
  onDragProgress?: (p: number) => void; // 0..1 based on horizontal drag
};

export default function SwipeCard({ isActive, onSwipeLeft, onSwipeRight, children, onDragProgress }: Props) {
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => isActive,
        onPanResponderMove: (evt, gesture) => {
          Animated.event([null, { dx: translate.x, dy: translate.y }], { useNativeDriver: false })(evt, gesture);
          if (onDragProgress) {
            const p = Math.min(1, Math.abs(gesture.dx) / 120);
            onDragProgress(p);
          }
        },
        onPanResponderRelease: (_evt, gesture) => {
          const threshold = 100;
          if (gesture.dx > threshold) {
            Animated.spring(translate, { toValue: { x: 500, y: gesture.dy }, useNativeDriver: true }).start(() => {
              onDragProgress && onDragProgress(0);
              onSwipeRight();
            });
            return;
          }
          if (gesture.dx < -threshold) {
            Animated.spring(translate, { toValue: { x: -500, y: gesture.dy }, useNativeDriver: true }).start(() => {
              onDragProgress && onDragProgress(0);
              onSwipeLeft();
            });
            return;
          }
          Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(() => {
            onDragProgress && onDragProgress(0);
          });
        }
      }),
    [isActive, onSwipeLeft, onSwipeRight, translate, onDragProgress]
  );

  const rotate = translate.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-10deg', '0deg', '10deg'] });
  const opacity = translate.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.85, 1, 0.85] });
  const likeOpacity = translate.x.interpolate({ inputRange: [30, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOpacity = translate.x.interpolate({ inputRange: [-120, -30], outputRange: [1, 0], extrapolate: 'clamp' });

  // Build transforms with proper typing
  const transforms = [
    { translateX: translate.x },
    { translateY: translate.y },
    { rotate },
  ];

  return (
    <Animated.View
      style={[styles.container, { transform: transforms, opacity }]}
      pointerEvents={isActive ? 'auto' : 'none'}
      {...panResponder.panHandlers}
    >
      <View style={styles.shadow}>
        <View style={{ position: 'relative' }}>
          {children}
          <Animated.View pointerEvents="none" style={[styles.overlay, styles.like, { opacity: likeOpacity }]}>
            <Heart color="#fff" size={48} fill="#fff" />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.overlay, styles.pass, { opacity: passOpacity }]}>
            <X color="#fff" size={48} />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  shadow: {
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  like: { backgroundColor: 'rgba(34,197,94,0.25)' },
  pass: { backgroundColor: 'rgba(239,68,68,0.25)' },
});
