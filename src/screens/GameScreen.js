import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions, Modal,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withDelay, withSequence, ZoomIn, Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import {
  createGameState, simulateTap, applyMove, getStars, DIR_VECTORS,
} from '../engine/gameLogic';
import { getLevel, getLevelDifficulty, getLevelShapeName } from '../engine/levels';
import { DIFFICULTY_COLORS } from '../constants/colors';
import ArrowSvg from '../components/ArrowSvg';
import Heart from '../components/Heart';
import Star from '../components/Star';
import { tapHaptic, successHaptic, errorHaptic, heavyHaptic } from '../utils/haptics';
import { playTapSound, playCompleteSound, playErrorSound } from '../utils/sounds';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const GRID_PADDING = 20;
const MAX_GRID_WIDTH = W - GRID_PADDING * 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function arrowVariant(row, col) {
  return ((row * 7 + col * 13 + 3) * 2654435761) >>> 0;
}

function ArrowCell({ arrow, cellSize, onTap, colors }) {
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const gone = useRef(false);

  useEffect(() => {
    scale.value = withDelay(
      Math.min((arrow.row + arrow.col) * 8, 300),
      withSpring(1, { damping: 14, stiffness: 250 })
    );
  }, []);

  const animateOut = useCallback((direction) => {
    gone.current = true;
    const vec = DIR_VECTORS[direction];
    const distance = Math.max(W, H) * 1.2;
    scale.value = withSequence(
      withTiming(1.2, { duration: 50 }),
      withTiming(1, { duration: 30 })
    );
    translateX.value = withDelay(60, withTiming(vec.dc * distance, {
      duration: 300, easing: Easing.bezier(0.4, 0, 1, 1),
    }));
    translateY.value = withDelay(60, withTiming(vec.dr * distance, {
      duration: 300, easing: Easing.bezier(0.4, 0, 1, 1),
    }));
    opacity.value = withDelay(250, withTiming(0, { duration: 80 }));
  }, []);

  const animateBlocked = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 30 }),
      withTiming(8, { duration: 30 }),
      withTiming(-5, { duration: 30 }),
      withTiming(5, { duration: 30 }),
      withTiming(0, { duration: 30 }),
    );
    scale.value = withSequence(
      withTiming(0.9, { duration: 40 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value + shakeX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (gone.current) return;
    onTap(arrow.id, { animateOut, animateBlocked });
  };

  const v = arrowVariant(arrow.row, arrow.col);
  const colorChoices = [colors.arrowRed, colors.arrowDark, colors.arrowBlue];
  const arrowColor = colorChoices[v % 3];
  const variant = v % 5;
  const arrowSize = cellSize * 0.55;

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.arrowCell,
        {
          width: cellSize,
          height: cellSize,
          left: arrow.col * cellSize,
          top: arrow.row * cellSize,
        },
        animStyle,
      ]}
    >
      <ArrowSvg size={arrowSize} color={arrowColor} direction={arrow.direction} variant={variant} />
    </AnimatedPressable>
  );
}

function CompletionModal({ visible, stars, level, shapeName, moves, onNext, onReplay, onHome, colors }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={ZoomIn.springify().delay(200)}
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>Level Complete!</Text>
          <Text style={[styles.modalShape, { color: colors.textSecondary }]}>
            {shapeName} — {moves} move{moves !== 1 ? 's' : ''}
          </Text>
          <View style={styles.starsDisplay}>
            {[1, 2, 3].map(i => (
              <Animated.View key={i} entering={ZoomIn.delay(400 + i * 200).springify()}>
                <Star size={44} filled={i <= stars} color={colors.starFull} />
              </Animated.View>
            ))}
          </View>
          <View style={styles.modalButtons}>
            <Pressable onPress={onNext}
              style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.accent }]}>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
              <Text style={styles.modalBtnPrimaryText}>Next Level</Text>
            </Pressable>
            <View style={styles.modalBtnRow}>
              <Pressable onPress={onReplay}
                style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: colors.border }]}>
                <Ionicons name="refresh" size={18} color={colors.text} />
                <Text style={[styles.modalBtnSecText, { color: colors.text }]}>Replay</Text>
              </Pressable>
              <Pressable onPress={onHome}
                style={[styles.modalBtn, styles.modalBtnSecondary, { borderColor: colors.border }]}>
                <Ionicons name="home-outline" size={18} color={colors.text} />
                <Text style={[styles.modalBtnSecText, { color: colors.text }]}>Home</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function GameOverModal({ visible, onRetry, onHome, colors }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View entering={ZoomIn.springify().delay(200)}
          style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Ionicons name="heart-dislike" size={56} color={colors.accent} />
          <Text style={[styles.modalTitle, { color: colors.text, marginTop: 12 }]}>Out of Lives!</Text>
          <Text style={[styles.modalShape, { color: colors.textSecondary }]}>
            You ran out of hearts. Try again?
          </Text>
          <View style={[styles.modalButtons, { marginTop: 8 }]}>
            <Pressable onPress={onRetry}
              style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.accent }]}>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.modalBtnPrimaryText}>Try Again</Text>
            </Pressable>
            <Pressable onPress={onHome}
              style={[styles.modalBtn, styles.modalBtnSecondary, {
                borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
              }]}>
              <Ionicons name="home-outline" size={18} color={colors.text} />
              <Text style={[styles.modalBtnSecText, { color: colors.text }]}>Go Home</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function GameScreen({ route, navigation }) {
  const { level } = route.params;
  const { colors } = useTheme();
  const { hearts, completeLevel, loseHeart, refillHearts } = useGame();

  const levelData = useMemo(() => getLevel(level), [level]);
  const difficulty = getLevelDifficulty(level);
  const shapeName = getLevelShapeName(level);
  const diffColor = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.expert;

  const [gameState, setGameState] = useState(() => createGameState(levelData));
  const gameRef = useRef(gameState);
  gameRef.current = gameState;

  const [moves, setMoves] = useState(0);
  const movesRef = useRef(0);
  movesRef.current = moves;

  // Track reset generation to force fresh ArrowCell mounts on reset only
  const [generation, setGeneration] = useState(0);

  const [showComplete, setShowComplete] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  useEffect(() => {
    if (hearts <= 0 && !showComplete && !showGameOver) {
      setTimeout(() => { heavyHaptic(); setShowGameOver(true); }, 300);
    }
  }, [hearts, showComplete, showGameOver]);

  const cellSize = useMemo(() => {
    const maxW = MAX_GRID_WIDTH / gameState.cols;
    const maxH = (H * 0.55) / gameState.rows;
    return Math.floor(Math.min(maxW, maxH));
  }, [gameState.cols, gameState.rows]);

  const gridWidth = cellSize * gameState.cols;
  const gridHeight = cellSize * gameState.rows;

  const handleArrowTap = useCallback((arrowId, anims) => {
    if (hearts <= 0) return;
    const state = gameRef.current;
    const result = simulateTap(state, arrowId);
    if (!result) return;

    if (result.blocked) {
      anims.animateBlocked();
      errorHaptic();
      playErrorSound();
      loseHeart();
      setMoves(m => m + 1);
      movesRef.current += 1;
      return;
    }

    tapHaptic();
    playTapSound();
    anims.animateOut(result.direction);

    const newState = applyMove(state, result);
    const newMoves = movesRef.current + 1;
    movesRef.current = newMoves;
    setMoves(newMoves);
    setGameState(newState);

    if (newState.isComplete) {
      const stars = getStars(newMoves, levelData.optimalMoves);
      setEarnedStars(stars);
      completeLevel(level, stars);
      successHaptic();
      playCompleteSound();
      setTimeout(() => setShowComplete(true), 400);
    }
  }, [level, levelData, hearts]);

  const handleReset = useCallback(() => {
    tapHaptic(); refillHearts();
    const s = createGameState(levelData);
    setGameState(s); gameRef.current = s;
    setMoves(0); movesRef.current = 0;
    setShowComplete(false); setShowGameOver(false);
    setGeneration(g => g + 1);
  }, [levelData]);

  const handleRetry = useCallback(() => {
    setShowGameOver(false); refillHearts();
    const s = createGameState(levelData);
    setGameState(s); gameRef.current = s;
    setMoves(0); movesRef.current = 0;
    setGeneration(g => g + 1);
  }, [levelData]);

  const handleNext = useCallback(() => {
    const nextLevel = getLevel(level + 1);
    if (nextLevel) {
      refillHearts(); setShowComplete(false);
      const s = createGameState(nextLevel);
      setGameState(s); gameRef.current = s;
      setMoves(0); movesRef.current = 0;
      setEarnedStars(0);
      setGeneration(g => g + 1);
      navigation.setParams({ level: level + 1 });
    } else {
      navigation.navigate('Home');
    }
  }, [level, navigation]);

  const handleHome = useCallback(() => { refillHearts(); navigation.navigate('Home'); }, [navigation]);

  const activeArrows = useMemo(
    () => Object.values(gameState.arrows).filter(a => a.active),
    [gameState.arrows]
  );
  const remaining = activeArrows.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => { refillHearts(); navigation.goBack(); }} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
            <Text style={styles.diffText}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Text>
          </View>
          <Text style={[styles.levelText, { color: colors.text }]}>Level {level}</Text>
        </View>
        <Pressable onPress={handleReset} style={styles.headerBtn}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.heartsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} size={20} filled={i < hearts} color={colors.heartFull} />
          ))}
        </View>
        <Text style={[styles.shapeName, { color: colors.textSecondary }]}>{shapeName}</Text>
        <Text style={[styles.movesText, { color: colors.textSecondary }]}>Moves: {moves}</Text>
      </View>

      <View style={styles.remainingRow}>
        <Text style={[styles.remainingText, { color: colors.text }]}>
          {remaining} arrow{remaining !== 1 ? 's' : ''} left
        </Text>
      </View>

      <View style={styles.gridContainer}>
        <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
          {Array.from({ length: gameState.rows + 1 }).map((_, r) =>
            Array.from({ length: gameState.cols + 1 }).map((_, c) => (
              <View key={`d${r}-${c}`} style={[styles.gridDot, {
                left: c * cellSize - 1.5, top: r * cellSize - 1.5,
                backgroundColor: colors.gridDot,
              }]} />
            ))
          )}
          {Array.from({ length: gameState.rows + 1 }).map((_, r) => (
            <View key={`h${r}`} style={[styles.gridLineH, {
              top: r * cellSize, width: gridWidth, backgroundColor: colors.gridLine,
            }]} />
          ))}
          {Array.from({ length: gameState.cols + 1 }).map((_, c) => (
            <View key={`v${c}`} style={[styles.gridLineV, {
              left: c * cellSize, height: gridHeight, backgroundColor: colors.gridLine,
            }]} />
          ))}

          {activeArrows.map(arrow => (
            <ArrowCell
              key={`${arrow.id}-g${generation}`}
              arrow={arrow}
              cellSize={cellSize}
              onTap={handleArrowTap}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <CompletionModal visible={showComplete} stars={earnedStars} level={level}
        shapeName={shapeName} moves={moves} onNext={handleNext}
        onReplay={handleReset} onHome={handleHome} colors={colors} />
      <GameOverModal visible={showGameOver} onRetry={handleRetry}
        onHome={handleHome} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8,
  },
  headerBtn: { padding: 8, width: 44, alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 4 },
  diffText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  levelText: { fontSize: 20, fontWeight: '700' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
  },
  heartsRow: { flexDirection: 'row', gap: 4 },
  shapeName: { fontSize: 13, fontWeight: '600' },
  movesText: { fontSize: 13, fontWeight: '500' },
  remainingRow: { alignItems: 'center', paddingBottom: 4 },
  remainingText: { fontSize: 14, fontWeight: '600' },
  gridContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { position: 'relative' },
  gridDot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5 },
  gridLineH: { position: 'absolute', height: 0.5, left: 0, opacity: 0.5 },
  gridLineV: { position: 'absolute', width: 0.5, top: 0, opacity: 0.5 },
  arrowCell: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: W * 0.85, borderRadius: 24, padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  modalTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  modalShape: { fontSize: 16, fontWeight: '500', marginBottom: 20 },
  starsDisplay: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  modalButtons: { width: '100%', gap: 12 },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, gap: 8,
  },
  modalBtnPrimary: {
    shadowColor: '#E63946', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalBtnPrimaryText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, borderWidth: 1.5 },
  modalBtnSecText: { fontSize: 14, fontWeight: '600' },
});
