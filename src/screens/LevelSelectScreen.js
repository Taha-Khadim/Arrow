import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Dimensions,
} from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { getLevelDifficulty, getLevelShapeName } from '../engine/levels';
import { DIFFICULTY_COLORS } from '../constants/colors';
import Star from '../components/Star';
import { tapHaptic } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');
const COLS_PER_ROW = 5;
const NODE_SIZE = 48;
const ROW_HEIGHT = 90;
const MAP_PADDING_H = 32;
const USABLE_WIDTH = W - MAP_PADDING_H * 2;
const COL_SPACING = USABLE_WIDTH / (COLS_PER_ROW - 1);

function getNodePositions(totalLevels) {
  const positions = [];
  for (let i = 0; i < totalLevels; i++) {
    const row = Math.floor(i / COLS_PER_ROW);
    const colInRow = i % COLS_PER_ROW;
    const goingRight = row % 2 === 0;
    const col = goingRight ? colInRow : (COLS_PER_ROW - 1 - colInRow);
    positions.push({
      x: MAP_PADDING_H + col * COL_SPACING,
      y: 80 + row * ROW_HEIGHT,
    });
  }
  return positions;
}

function buildPathD(positions) {
  if (positions.length < 2) return '';
  let d = `M ${positions[0].x} ${positions[0].y}`;
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    const row = Math.floor(i / COLS_PER_ROW);
    const prevRow = Math.floor((i - 1) / COLS_PER_ROW);
    if (row !== prevRow) {
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }
  return d;
}

function LevelNode({ level, position, completed, stars, unlocked, isCurrent, onPress, colors }) {
  const difficulty = getLevelDifficulty(level);
  const diffColor = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.expert;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCurrent) {
      scale.value = withSpring(1.15, { damping: 8, stiffness: 150 });
    }
  }, [isCurrent]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!unlocked) return;
    tapHaptic();
    onPress(level);
  };

  const bgColor = completed ? diffColor : unlocked ? colors.surface : colors.surfaceSecondary;
  const borderColor = isCurrent ? colors.accent
    : completed ? diffColor
    : unlocked ? colors.border
    : colors.surfaceSecondary;

  return (
    <Animated.View
      style={[
        styles.nodeWrapper,
        { left: position.x - NODE_SIZE / 2, top: position.y - NODE_SIZE / 2 },
        animStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.node, {
          width: NODE_SIZE, height: NODE_SIZE,
          backgroundColor: bgColor, borderColor,
          borderWidth: isCurrent ? 3 : completed ? 2 : 1,
          shadowColor: isCurrent ? colors.accent : 'transparent',
          shadowOpacity: isCurrent ? 0.4 : 0,
          shadowRadius: 8,
          elevation: isCurrent ? 6 : completed ? 2 : 0,
        }]}
      >
        {!unlocked ? (
          <Ionicons name="lock-closed" size={16} color={colors.textTertiary} />
        ) : (
          <Text style={[styles.nodeText, { color: completed ? '#FFF' : colors.text }]}>{level}</Text>
        )}
      </Pressable>
      {completed && (
        <View style={styles.nodeStars}>
          {[1, 2, 3].map(i => (
            <Star key={i} size={10} filled={i <= stars} color={colors.starFull} />
          ))}
        </View>
      )}
      {isCurrent && unlocked && !completed && (
        <View style={[styles.currentBadge, { backgroundColor: colors.accent }]}>
          <Ionicons name="play" size={8} color="#FFF" />
        </View>
      )}
      {isCurrent && (
        <Text style={[styles.shapeNameText, { color: colors.textSecondary }]} numberOfLines={1}>
          {getLevelShapeName(level)}
        </Text>
      )}
    </Animated.View>
  );
}

function DifficultyMarker({ label, color, y }) {
  return (
    <View style={[styles.diffMarker, { top: y - 55 }]}>
      <View style={[styles.diffMarkerBadge, { backgroundColor: color }]}>
        <Text style={styles.diffMarkerText}>{label}</Text>
      </View>
    </View>
  );
}

export default function LevelSelectScreen({ navigation }) {
  const { colors } = useTheme();
  const { completedLevels, isLevelUnlocked, currentLevel } = useGame();
  const scrollRef = useRef(null);

  // Show levels up to max(currentLevel + 10, 100) so there's always more ahead
  const displayCount = Math.max(100, currentLevel + 10);

  const positions = useMemo(() => getNodePositions(displayCount), [displayCount]);
  const pathD = useMemo(() => buildPathD(positions), [positions]);

  const completedCount = Object.keys(completedLevels).length;
  const completedPathD = useMemo(() => {
    if (completedCount === 0) return '';
    const end = Math.min(completedCount, displayCount);
    return buildPathD(positions.slice(0, end));
  }, [positions, completedCount, displayCount]);

  const totalHeight = positions.length > 0 ? positions[positions.length - 1].y + 120 : 500;

  const markers = useMemo(() => {
    const m = [
      { label: 'Easy', color: DIFFICULTY_COLORS.easy, level: 1 },
      { label: 'Medium', color: DIFFICULTY_COLORS.medium, level: 11 },
      { label: 'Hard', color: DIFFICULTY_COLORS.hard, level: 31 },
      { label: 'Expert', color: DIFFICULTY_COLORS.expert, level: 61 },
    ];
    if (displayCount > 100)
      m.push({ label: 'Master', color: DIFFICULTY_COLORS.master, level: 101 });
    if (displayCount > 200)
      m.push({ label: 'Legendary', color: DIFFICULTY_COLORS.legendary, level: 201 });
    return m.filter(mk => mk.level <= displayCount);
  }, [displayCount]);

  useEffect(() => {
    if (currentLevel > 1 && currentLevel <= displayCount && scrollRef.current) {
      const targetY = positions[currentLevel - 1].y - 200;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
      }, 300);
    }
  }, [currentLevel, positions, displayCount]);

  const handleLevelPress = useCallback((level) => {
    navigation.navigate('Game', { level });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Levels</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.completedText, { color: colors.textSecondary }]}>
            {completedCount} done
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ height: totalHeight }}
        showsVerticalScrollIndicator={false}
      >
        <Svg width={W} height={totalHeight} style={StyleSheet.absoluteFill}>
          <Path d={pathD} stroke={colors.border} strokeWidth={4} fill="none"
            strokeLinecap="round" strokeDasharray="8,8" />
          {completedPathD ? (
            <Path d={completedPathD} stroke={colors.accent} strokeWidth={4}
              fill="none" strokeLinecap="round" />
          ) : null}
        </Svg>

        {Array.from({ length: displayCount }, (_, i) => i + 1).map(level => {
          const data = completedLevels[level];
          return (
            <LevelNode key={level} level={level} position={positions[level - 1]}
              completed={!!data} stars={data?.stars || 0}
              unlocked={isLevelUnlocked(level)} isCurrent={level === currentLevel}
              onPress={handleLevelPress} colors={colors} />
          );
        })}

        {markers.map(m => (
          <DifficultyMarker key={m.label} label={m.label} color={m.color}
            y={positions[m.level - 1].y} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, zIndex: 10,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerRight: { paddingRight: 8 },
  completedText: { fontSize: 14, fontWeight: '600' },
  nodeWrapper: { position: 'absolute', alignItems: 'center', zIndex: 3, elevation: 3 },
  node: { borderRadius: NODE_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
  nodeText: { fontSize: 15, fontWeight: '800' },
  nodeStars: { flexDirection: 'row', marginTop: 3, gap: 2 },
  currentBadge: {
    position: 'absolute', top: -6, right: -6,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  shapeNameText: { fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  diffMarker: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center',
    zIndex: 10, elevation: 10,
  },
  diffMarkerBadge: {
    paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 10,
  },
  diffMarkerText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
