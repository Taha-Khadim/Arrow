import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withDelay, withSpring, FadeInDown, FadeIn,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import ArrowSvg from '../components/ArrowSvg';
import { tapHaptic } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');

function FloatingArrow({ delay, x, y, direction, size, color }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.15, { duration: 500 }));
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    position: 'absolute',
    left: x,
    top: y,
  }));

  return (
    <Animated.View style={style}>
      <ArrowSvg size={size} color={color} direction={direction} />
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { currentLevel, totalStars, completedLevels, hearts, maxHearts } = useGame();

  const completedCount = Object.keys(completedLevels).length;
  const progress = completedCount / 100;

  const handlePlay = () => {
    tapHaptic();
    navigation.navigate('Game', { level: currentLevel });
  };

  const handleLevels = () => {
    tapHaptic();
    navigation.navigate('LevelSelect');
  };

  const handleSettings = () => {
    tapHaptic();
    navigation.navigate('Settings');
  };

  const floatingArrows = [
    { delay: 0, x: W * 0.1, y: 120, direction: 'up', size: 28, color: colors.arrowDark },
    { delay: 400, x: W * 0.75, y: 180, direction: 'right', size: 22, color: colors.arrowBlue },
    { delay: 800, x: W * 0.2, y: 280, direction: 'down', size: 20, color: colors.arrowRed },
    { delay: 200, x: W * 0.85, y: 350, direction: 'left', size: 26, color: colors.arrowBlue },
    { delay: 600, x: W * 0.05, y: 450, direction: 'up', size: 18, color: colors.arrowDark },
    { delay: 1000, x: W * 0.6, y: 100, direction: 'down', size: 24, color: colors.arrowRed },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {floatingArrows.map((a, i) => (
        <FloatingArrow key={i} {...a} />
      ))}

      <View style={styles.header}>
        <Pressable onPress={handleSettings} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={26} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoBox, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <ArrowSvg size={48} color={colors.arrowDark} direction="up" />
              <ArrowSvg size={36} color={colors.arrowBlue} direction="right" />
              <ArrowSvg size={30} color={colors.arrowRed} direction="down" />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Arrow</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Master the Flow
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>⭐ {totalStars}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stars</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{completedCount}/100</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Levels</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.heartFull }]}>{'❤️'.repeat(hearts)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lives</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={{ width: '100%', paddingHorizontal: 32 }}>
          <View style={[styles.progressBar, { backgroundColor: colors.surfaceSecondary }]}>
            <View
              style={[styles.progressFill, {
                backgroundColor: colors.accent,
                width: `${Math.max(progress * 100, 2)}%`,
              }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.buttons}>
          <Pressable
            onPress={handlePlay}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="play" size={24} color="#FFF" />
            <Text style={styles.playText}>
              {completedCount === 0 ? 'Start Playing' : `Level ${currentLevel}`}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLevels}
            style={[styles.levelsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="grid-outline" size={20} color={colors.text} />
            <Text style={[styles.levelsBtnText, { color: colors.text }]}>All Levels</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingTop: 56,
  },
  settingsBtn: { padding: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  logoBox: {
    width: 100, height: 100, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row', gap: -8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  title: { fontSize: 44, fontWeight: '800', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 24, marginBottom: 24,
  },
  statCard: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  progressBar: {
    height: 8, borderRadius: 4, width: '100%',
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  buttons: { width: '100%', paddingHorizontal: 32, marginTop: 32, gap: 12 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 30, gap: 8,
    shadowColor: '#E63946', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  playText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  levelsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 30, gap: 8,
    borderWidth: 1.5,
  },
  levelsBtnText: { fontSize: 16, fontWeight: '600' },
});
