import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, FlatList,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withDelay, withSequence, FadeIn, FadeInDown, SlideInRight,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import ArrowSvg from '../components/ArrowSvg';

const { width: W, height: H } = Dimensions.get('window');

const PAGES = [
  {
    title: 'Welcome to Arrow',
    subtitle: 'A puzzle game that sharpens your mind',
    desc: 'Tap arrows to launch them off the grid.\nClear all arrows to complete each level.',
    demo: 'welcome',
  },
  {
    title: 'Tap to Launch',
    subtitle: 'Each arrow flies in the direction it points',
    desc: 'Tap an arrow and watch it shoot across the board.\nIt clears any arrows in its path!',
    demo: 'tap',
  },
  {
    title: 'Chain Reactions',
    subtitle: 'One tap can clear multiple arrows',
    desc: 'Arrows in the path get swept away.\nPlan your moves for maximum combos!',
    demo: 'chain',
  },
  {
    title: '100 Unique Shapes',
    subtitle: 'Numbers, letters, animals and more',
    desc: 'Each level has a unique shape to solve.\nCan you master them all?',
    demo: 'shapes',
  },
];

function DemoWelcome() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.demoContainer}>
      <View style={styles.demoGrid}>
        {['up', 'right', 'down', 'left'].map((dir, i) => (
          <Animated.View
            key={dir}
            entering={FadeInDown.delay(500 + i * 150).springify()}
            style={[styles.demoArrow, { backgroundColor: colors.surface }]}
          >
            <ArrowSvg size={40} color={i % 2 === 0 ? colors.arrowDark : colors.arrowBlue} direction={dir} />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

function DemoTap() {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [tapped, setTapped] = useState(false);

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    translateY.value = withTiming(-300, { duration: 600 });
    opacity.value = withDelay(400, withTiming(0, { duration: 200 }));
    setTimeout(() => {
      translateY.value = 0;
      opacity.value = 1;
      setTapped(false);
    }, 1200);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.demoContainer}>
      <Text style={[styles.demoHint, { color: colors.textSecondary }]}>
        Tap the arrow!
      </Text>
      <Pressable onPress={handleTap}>
        <Animated.View style={[styles.demoSingleArrow, { backgroundColor: colors.surface }, animStyle]}>
          <ArrowSvg size={50} color={colors.arrowDark} direction="up" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function DemoChain() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.demoContainer}>
      <View style={styles.chainRow}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            entering={SlideInRight.delay(400 + i * 200).springify()}
            style={[styles.demoArrow, { backgroundColor: colors.surface }]}
          >
            <ArrowSvg
              size={36}
              color={i === 0 ? colors.arrowRed : colors.arrowBlue}
              direction="right"
            />
          </Animated.View>
        ))}
        <Animated.View
          entering={FadeIn.delay(1200)}
          style={[styles.exitIndicator, { borderColor: colors.success }]}
        >
          <Text style={{ color: colors.success, fontSize: 20 }}>✓</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function DemoShapes() {
  const { colors } = useTheme();
  const shapes = [
    [[0,1,0],[1,1,1],[0,1,0]],
    [[1,1,1],[1,0,1],[1,1,1]],
    [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
  ];

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.demoContainer}>
      <View style={styles.shapesRow}>
        {shapes.map((shape, si) => (
          <Animated.View
            key={si}
            entering={FadeInDown.delay(400 + si * 250).springify()}
            style={styles.miniShape}
          >
            {shape.map((row, ri) => (
              <View key={ri} style={styles.miniRow}>
                {row.map((cell, ci) => (
                  <View
                    key={ci}
                    style={[
                      styles.miniCell,
                      {
                        backgroundColor: cell ? colors.arrowDark : 'transparent',
                        opacity: cell ? 0.8 : 0,
                      }
                    ]}
                  />
                ))}
              </View>
            ))}
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const { colors } = useTheme();
  const { finishOnboarding } = useGame();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef(null);

  const demos = { welcome: DemoWelcome, tap: DemoTap, chain: DemoChain, shapes: DemoShapes };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentPage + 1 });
      setCurrentPage(currentPage + 1);
    } else {
      finishOnboarding();
      navigation.replace('Home');
    }
  };

  const handleSkip = () => {
    finishOnboarding();
    navigation.replace('Home');
  };

  const renderPage = ({ item, index }) => {
    const Demo = demos[item.demo];
    return (
      <View style={[styles.page, { width: W }]}>
        <View style={styles.demoArea}>
          <Demo />
        </View>
        <View style={styles.textArea}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: colors.accent }]}>{item.subtitle}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.desc}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable onPress={handleSkip} style={styles.skipBtn}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          setCurrentPage(idx);
        }}
        keyExtractor={(_, i) => i.toString()}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentPage ? colors.accent : colors.textTertiary,
                  width: i === currentPage ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: colors.accent }]}
        >
          <Text style={styles.nextText}>
            {currentPage === PAGES.length - 1 ? "Let's Play!" : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { fontSize: 16, fontWeight: '500' },
  page: { flex: 1, justifyContent: 'center' },
  demoArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  textArea: { paddingHorizontal: 32, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 32, paddingBottom: 50, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  nextBtn: {
    paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 30, width: '100%', alignItems: 'center',
  },
  nextText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  demoContainer: { alignItems: 'center', justifyContent: 'center' },
  demoGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 120, justifyContent: 'center', gap: 16,
  },
  demoArrow: {
    width: 52, height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  demoHint: { fontSize: 14, marginBottom: 16, fontWeight: '500' },
  demoSingleArrow: {
    width: 72, height: 72, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exitIndicator: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  shapesRow: { flexDirection: 'row', gap: 24, alignItems: 'center' },
  miniShape: { alignItems: 'center' },
  miniRow: { flexDirection: 'row' },
  miniCell: { width: 10, height: 10, margin: 1, borderRadius: 2 },
});
