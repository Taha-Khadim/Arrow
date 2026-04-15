export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
};

export const DIR_VECTORS = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

export const DIR_ANGLES = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

export const DIR_FROM_NUM = {
  1: DIRECTIONS.UP,
  2: DIRECTIONS.RIGHT,
  3: DIRECTIONS.DOWN,
  4: DIRECTIONS.LEFT,
};

export function createGameState(levelData) {
  const arrows = {};
  const { grid, rows, cols } = levelData;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      if (val > 0 && val <= 4) {
        const key = `${r}-${c}`;
        arrows[key] = {
          id: key,
          row: r,
          col: c,
          direction: DIR_FROM_NUM[val],
          active: true,
        };
      }
    }
  }

  return {
    arrows,
    rows,
    cols,
    totalArrows: Object.keys(arrows).length,
    clearedArrows: 0,
    moves: 0,
    isComplete: false,
  };
}

// Check if the arrow's path to the grid edge is completely clear
function isPathClear(gameState, arrowId) {
  const arrow = gameState.arrows[arrowId];
  if (!arrow || !arrow.active) return false;

  const { dr, dc } = DIR_VECTORS[arrow.direction];
  let r = arrow.row + dr;
  let c = arrow.col + dc;

  while (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
    const key = `${r}-${c}`;
    const other = gameState.arrows[key];
    if (other && other.active) {
      return false; // BLOCKED by another arrow
    }
    r += dr;
    c += dc;
  }

  return true; // Clear path to edge
}

// Tap an arrow: only succeeds if path is clear (no other arrow blocking)
export function simulateTap(gameState, arrowId) {
  const arrow = gameState.arrows[arrowId];
  if (!arrow || !arrow.active) return null;

  const clear = isPathClear(gameState, arrowId);

  if (!clear) {
    // Path blocked - return a blocked result
    return { blocked: true, arrowId, direction: arrow.direction };
  }

  // Path is clear - arrow exits the grid
  const { dr, dc } = DIR_VECTORS[arrow.direction];
  let exitRow = arrow.row;
  let exitCol = arrow.col;
  while (
    exitRow + dr >= 0 && exitRow + dr < gameState.rows &&
    exitCol + dc >= 0 && exitCol + dc < gameState.cols
  ) {
    exitRow += dr;
    exitCol += dc;
  }
  exitRow += dr;
  exitCol += dc;

  return {
    blocked: false,
    cleared: [arrowId],
    arrowId,
    direction: arrow.direction,
    exitRow,
    exitCol,
  };
}

export function applyMove(gameState, tapResult) {
  if (tapResult.blocked) {
    return { ...gameState, moves: gameState.moves + 1 };
  }

  const newState = {
    ...gameState,
    arrows: { ...gameState.arrows },
    moves: gameState.moves + 1,
    clearedArrows: gameState.clearedArrows + tapResult.cleared.length,
  };

  tapResult.cleared.forEach(id => {
    newState.arrows[id] = { ...newState.arrows[id], active: false };
  });

  const remaining = Object.values(newState.arrows).filter(a => a.active).length;
  newState.isComplete = remaining === 0;

  return newState;
}

export function getStars(moves, optimalMoves) {
  // 3 stars = no wrong taps (moves == arrowCount)
  // 2 stars = 1-2 wrong taps
  // 1 star = 3+ wrong taps
  const mistakes = moves - optimalMoves;
  if (mistakes <= 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export function getRemainingArrows(gameState) {
  return Object.values(gameState.arrows).filter(a => a.active);
}

// Check how many arrows currently have a clear exit path
export function getMovableArrows(gameState) {
  return Object.values(gameState.arrows)
    .filter(a => a.active && isPathClear(gameState, a.id));
}

export function getDifficulty(level) {
  if (level <= 20) return 'easy';
  if (level <= 50) return 'medium';
  if (level <= 80) return 'hard';
  return 'expert';
}

export function getDifficultyLabel(level) {
  const d = getDifficulty(level);
  return d.charAt(0).toUpperCase() + d.slice(1);
}
