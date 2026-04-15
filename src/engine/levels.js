import { SHAPE_MASKS, assignDirections, generateProceduralMask } from './shapes';

const SHAPE_ORDER = [
  'line_h', 'line_v', 'small_square', 'small_L', 'small_T',
  'cross_small', 'zigzag', 'u_shape', 'square_3', 'steps',
  'num_1', 'num_2', 'num_3', 'num_4', 'num_5',
  'num_6', 'num_7', 'num_8', 'num_9', 'num_0',
  'letter_A', 'letter_B', 'letter_C', 'letter_E', 'letter_F',
  'letter_H', 'letter_L', 'letter_P', 'letter_T', 'letter_Z',
  'heart_small', 'diamond', 'star_small', 'cross_large', 'triangle_up',
  'triangle_down', 'hourglass', 'arrow_right', 'ring', 'wave',
  'house', 'tree', 'cup', 'mushroom', 'key',
  'boat', 'crown', 'music_note', 'lightning', 'rocket',
  'heart_large', 'star_large', 'butterfly', 'fish', 'cat',
  'skull', 'sword', 'shield', 'moon', 'sun',
  'anchor', 'umbrella', 'flower', 'plane', 'guitar',
  'trophy', 'pacman', 'controller', 'planet', 'ghost',
  'castle', 'mountain', 'robot', 'phoenix', 'wolf',
  'dragon_head', 'alien', 'octopus', 'eagle', 'spaceship',
  'chess_knight', 'dna', 'infinity', 'yin_yang', 'brain',
  'globe', 'fire', 'telescope', 'atom', 'cactus',
  'dragon_full', 'crown_large', 'world_map', 'phoenix_full', 'maze',
  'spiral', 'treasure_chest', 'galaxy', 'diamond_large', 'victory',
];

// How many arrows a level should have, scaling aggressively
function getTargetArrowCount(levelNum) {
  if (levelNum <= 5) return 3 + levelNum;                    // 4-8
  if (levelNum <= 10) return 8 + (levelNum - 5) * 2;        // 10-18
  if (levelNum <= 20) return 18 + (levelNum - 10) * 2;      // 20-38
  if (levelNum <= 30) return 38 + (levelNum - 20) * 3;      // 41-68
  if (levelNum <= 50) return 68 + (levelNum - 30) * 3;      // 71-128

  // After 50: increase by a different amount every 5 levels
  const block = Math.floor((levelNum - 51) / 5);
  const posInBlock = (levelNum - 51) % 5;
  const increments = [4, 5, 6, 7, 8, 9, 10, 8, 12, 6, 11, 7, 9, 13, 8, 10, 14, 7, 11, 15];
  let total = 128;
  for (let b = 0; b <= block; b++) {
    const inc = increments[b % increments.length];
    const count = b === block ? posInBlock + 1 : 5;
    total += inc * count;
  }
  return total;
}

function scaleUpMask(baseMask, targetCount) {
  const baseCount = baseMask.flat().filter(v => v).length;
  if (baseCount >= targetCount) return baseMask;

  const baseRows = baseMask.length;
  const baseCols = baseMask[0].length;

  // Scale factor to reach target arrow count
  const scale = Math.max(2, Math.ceil(Math.sqrt(targetCount / Math.max(baseCount, 1))));
  const newRows = baseRows * scale;
  const newCols = baseCols * scale;

  // Tile the base mask to fill the larger grid
  const newMask = [];
  for (let r = 0; r < newRows; r++) {
    const row = [];
    for (let c = 0; c < newCols; c++) {
      const br = r % baseRows;
      const bc = c % baseCols;
      row.push(baseMask[br][bc]);
    }
    newMask.push(row);
  }

  // Count and trim to target
  let count = 0;
  for (let r = 0; r < newRows; r++)
    for (let c = 0; c < newCols; c++)
      if (newMask[r][c]) count++;

  // Remove excess arrows from edges
  if (count > targetCount) {
    const cells = [];
    for (let r = 0; r < newRows; r++)
      for (let c = 0; c < newCols; c++)
        if (newMask[r][c]) cells.push({ r, c });

    // Remove from outside-in
    cells.sort((a, b) => {
      const distA = Math.min(a.r, a.c, newRows - 1 - a.r, newCols - 1 - a.c);
      const distB = Math.min(b.r, b.c, newRows - 1 - b.r, newCols - 1 - b.c);
      return distA - distB;
    });

    let toRemove = count - targetCount;
    for (let i = 0; i < cells.length && toRemove > 0; i++) {
      newMask[cells[i].r][cells[i].c] = 0;
      toRemove--;
    }
  }

  return newMask;
}

function generateLevel(levelNum) {
  const target = getTargetArrowCount(levelNum);
  const seed = levelNum * 7919 + 31337;
  let mask, shapeName;

  if (levelNum <= 100) {
    const shapeKey = SHAPE_ORDER[levelNum - 1];
    const baseMask = SHAPE_MASKS[shapeKey];
    if (!baseMask) return null;
    mask = scaleUpMask(baseMask, target);
    shapeName = shapeKey;
  } else {
    // Infinite levels: procedurally generated
    mask = generateProceduralMask(levelNum, target, seed);
    shapeName = `procedural_${levelNum}`;
  }

  const grid = assignDirections(mask, seed);
  const rows = grid.length;
  const cols = grid[0].length;
  const arrowCount = grid.flat().filter(v => v > 0).length;
  const optimalMoves = arrowCount;

  return { level: levelNum, shapeName, grid, rows, cols, optimalMoves, arrowCount };
}

const levelCache = {};

export function getLevel(levelNum) {
  if (levelNum < 1) return null;
  if (!levelCache[levelNum]) {
    levelCache[levelNum] = generateLevel(levelNum);
  }
  return levelCache[levelNum];
}

export function getTotalLevels() {
  return Infinity;
}

export function getLevelDifficulty(levelNum) {
  if (levelNum <= 10) return 'easy';
  if (levelNum <= 30) return 'medium';
  if (levelNum <= 60) return 'hard';
  if (levelNum <= 100) return 'expert';
  if (levelNum <= 200) return 'master';
  return 'legendary';
}

const SHAPE_NAMES = {
  line_h: 'Horizon', line_v: 'Tower', small_square: 'Block',
  small_L: 'Corner', small_T: 'Junction', cross_small: 'Cross',
  zigzag: 'Zigzag', u_shape: 'Valley', square_3: 'Grid', steps: 'Steps',
  num_1: 'One', num_2: 'Two', num_3: 'Three', num_4: 'Four', num_5: 'Five',
  num_6: 'Six', num_7: 'Seven', num_8: 'Eight', num_9: 'Nine', num_0: 'Zero',
  letter_A: 'Alpha', letter_B: 'Bravo', letter_C: 'Charlie',
  letter_E: 'Echo', letter_F: 'Foxtrot', letter_H: 'Hotel',
  letter_L: 'Lima', letter_P: 'Papa', letter_T: 'Tango', letter_Z: 'Zulu',
  heart_small: 'Heart', diamond: 'Diamond', star_small: 'Star',
  cross_large: 'Plus', triangle_up: 'Peak', triangle_down: 'Dip',
  hourglass: 'Time', arrow_right: 'Direction', ring: 'Ring', wave: 'Wave',
  house: 'Home', tree: 'Tree', cup: 'Cup', mushroom: 'Mushroom',
  key: 'Key', boat: 'Sail', crown: 'Crown', music_note: 'Music',
  lightning: 'Thunder', rocket: 'Rocket', heart_large: 'Love',
  star_large: 'Starlight', butterfly: 'Butterfly', fish: 'Fish',
  cat: 'Cat', skull: 'Skull', sword: 'Blade', shield: 'Shield',
  moon: 'Moon', sun: 'Sun', anchor: 'Anchor', umbrella: 'Umbrella',
  flower: 'Flower', plane: 'Flight', guitar: 'Guitar',
  trophy: 'Trophy', pacman: 'Chomp', controller: 'Game',
  planet: 'Planet', ghost: 'Ghost', castle: 'Castle',
  mountain: 'Mountain', robot: 'Robot', phoenix: 'Phoenix',
  wolf: 'Wolf', dragon_head: 'Dragon', alien: 'Alien',
  octopus: 'Octopus', eagle: 'Eagle', spaceship: 'Spaceship',
  chess_knight: 'Knight', dna: 'DNA', infinity: 'Infinity',
  yin_yang: 'Balance', brain: 'Mind', globe: 'World',
  fire: 'Fire', telescope: 'Vision', atom: 'Atom', cactus: 'Cactus',
  dragon_full: 'Dragon Lord', crown_large: 'Emperor',
  world_map: 'Explorer', phoenix_full: 'Rebirth', maze: 'Labyrinth',
  spiral: 'Vortex', treasure_chest: 'Treasure', galaxy: 'Galaxy',
  diamond_large: 'Gem', victory: 'Victory',
};

const PROCEDURAL_NAMES = [
  'Abyss', 'Storm', 'Nebula', 'Titan', 'Apex', 'Zenith', 'Rift', 'Prism',
  'Forge', 'Echo', 'Flux', 'Nova', 'Pulse', 'Helix', 'Quake', 'Void',
  'Cipher', 'Blaze', 'Frost', 'Shadow', 'Omega', 'Cosmos', 'Inferno', 'Mirage',
];

export function getLevelShapeName(levelNum) {
  const level = getLevel(levelNum);
  if (!level) return '';
  if (SHAPE_NAMES[level.shapeName]) return SHAPE_NAMES[level.shapeName];
  // Procedural name
  const idx = (levelNum * 17 + 7) % PROCEDURAL_NAMES.length;
  return `${PROCEDURAL_NAMES[idx]} ${levelNum}`;
}
