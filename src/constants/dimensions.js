import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SCREEN = { width: SCREEN_WIDTH, height: SCREEN_HEIGHT };

export const GRID_PADDING = 20;
export const MAX_GRID_SIZE = SCREEN_WIDTH - GRID_PADDING * 2;

export const getCellSize = (gridCols) => {
  return Math.floor(MAX_GRID_SIZE / gridCols);
};

export const getGridOffset = (gridCols, gridRows) => {
  const cellSize = getCellSize(gridCols);
  const gridWidth = cellSize * gridCols;
  const gridHeight = cellSize * gridRows;
  return {
    x: (SCREEN_WIDTH - gridWidth) / 2,
    y: (SCREEN_HEIGHT * 0.45 - gridHeight / 2),
  };
};

export const ARROW_SIZE_RATIO = 0.55;
export const DOT_SIZE = 3;

export const LEVEL_CARD_SIZE = (SCREEN_WIDTH - 60) / 5;
