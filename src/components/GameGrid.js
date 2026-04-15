import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import ArrowSvg from './ArrowSvg';
import { useTheme } from '../context/ThemeContext';
import { DIR_VECTORS } from '../engine/gameLogic';
import { SCREEN } from '../constants/dimensions';

const GRID_PADDING = 16;
const MAX_GRID_WIDTH = SCREEN.width - GRID_PADDING * 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ArrowCell({ arrow, cellSize, onTap, isAnimating }) {
  const { colors } = useTheme();
  const scale = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    scale.value = withDelay(
      (arrow.row * 3 + arrow.col * 2) * 30,
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    mounted.current = true;
  }, []);

  const animateOut = useCallback((direction, delay = 0) => {
    const vec = DIR_VECTORS[direction];
    const distance = Math.max(SCREEN.width, SCREEN.height);

    translateX.value = withDelay(delay, withTiming(vec.dc * distance, {
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));
    translateY.value = withDelay(delay, withTiming(vec.dr * distance, {
      duration: 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));
    rotation.value = withDelay(delay, withTiming(360, { duration: 500 }));
    opacity.value = withDelay(delay + 300, withTiming(0, { duration: 200 }));
  }, []);

  const animateCollected = useCallback((direction, delay = 0) => {
    const vec = DIR_VECTORS[direction];
    const distance = Math.max(SCREEN.width, SCREEN.height);

    scale.value = withDelay(delay, withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(0.8, { duration: 100 })
    ));
    translateX.value = withDelay(delay + 100, withTiming(vec.dc * distance, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));
    translateY.value = withDelay(delay + 100, withTiming(vec.dr * distance, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));
    opacity.value = withDelay(delay + 350, withTiming(0, { duration: 150 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (isAnimating) return;
    scale.value = withSequence(
      withTiming(0.85, { duration: 60 }),
      withTiming(1, { duration: 60 })
    );
    onTap(arrow.id, animateOut, animateCollected);
  };

  const arrowSize = cellSize * 0.55;
  const arrowColor = arrow.col % 2 === arrow.row % 2 ? colors.arrowDark : colors.arrowBlue;

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          left: arrow.col * cellSize,
          top: arrow.row * cellSize,
        },
        animatedStyle,
      ]}
    >
      <ArrowSvg
        size={arrowSize}
        color={arrowColor}
        direction={arrow.direction}
      />
    </AnimatedPressable>
  );
}

export default function GameGrid({ gameState, onArrowTap, isAnimating, arrowRefs }) {
  const { colors } = useTheme();
  const { rows, cols, arrows } = gameState;

  const cellSize = Math.floor(Math.min(MAX_GRID_WIDTH / cols, (SCREEN.height * 0.55) / rows));
  const gridWidth = cellSize * cols;
  const gridHeight = cellSize * rows;

  const activeArrows = Object.values(arrows).filter(a => a.active);

  const renderDots = () => {
    const dots = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        dots.push(
          <View
            key={`dot-${r}-${c}`}
            style={[
              styles.dot,
              {
                left: c * cellSize - 1.5,
                top: r * cellSize - 1.5,
                backgroundColor: colors.gridDot,
              },
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={[styles.container, { width: gridWidth, height: gridHeight }]}>
      {renderDots()}
      {activeArrows.map(arrow => (
        <ArrowCell
          key={arrow.id}
          arrow={arrow}
          cellSize={cellSize}
          onTap={onArrowTap}
          isAnimating={isAnimating}
          ref={ref => { if (arrowRefs) arrowRefs.current[arrow.id] = ref; }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
