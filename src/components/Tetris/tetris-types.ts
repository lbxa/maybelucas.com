// Tetromino shapes with NRS (Nintendo Rotation System) rotation states
export type TetrominoType = 'I' | 'O' | 'T' | 'J' | 'L' | 'S' | 'Z';

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
  rotation: number;
}

// NRS rotation states (clockwise rotations)
export const TETROMINOES: Record<TetrominoType, number[][][]> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
  ],
  O: [
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
  ],
  T: [
    [[0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]]
  ],
  J: [
    [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]]
  ],
  L: [
    [[0, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]],
    [[1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]]
  ],
  S: [
    [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0]],
    [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]]
  ],
  Z: [
    [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]
  ]
};

// Tetromino colors (muted palette for light/dark mode compatibility)
export const COLORS: Record<TetrominoType, string> = {
  I: '#60a5fa', // blue-400
  O: '#fbbf24', // amber-400
  T: '#a78bfa', // violet-400
  J: '#3b82f6', // blue-500
  L: '#f97316', // orange-500
  S: '#22c55e', // green-500
  Z: '#ef4444'  // red-500
};

// NES gravity table (frames per cell drop)
export const GRAVITY_TABLE: Record<number, number> = {
  0: 48, 1: 43, 2: 38, 3: 33, 4: 28, 5: 23, 6: 18, 7: 13, 8: 8, 9: 6,
  10: 5, 11: 5, 12: 5,
  13: 4, 14: 4, 15: 4,
  16: 3, 17: 3, 18: 3,
  19: 2, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2, 28: 2,
  29: 1
};

export function getGravity(level: number): number {
  if (level >= 29) return 1;
  return GRAVITY_TABLE[level] || 1;
}

// NES timing constants
export const TIMING = {
  DAS_DELAY: 16,      // Initial delay before auto-repeat (frames)
  DAS_REPEAT: 6,      // Auto-repeat rate (frames)
  ARE_MIN: 10,        // Minimum entry delay (frames)
  ARE_MAX: 18,        // Maximum entry delay (frames)
  LINE_CLEAR: 20,     // Line clear animation delay (frames)
  FPS: 60.098,        // NTSC frame rate
  SOFT_DROP_MULTIPLIER: 0.1 // Soft drop at 1/5 gravity speed
} as const;

// Game dimensions
export const GRID = {
  WIDTH: 10,
  HEIGHT: 20,
  HIDDEN_ROWS: 2,     // Spawn rows above visible playfield
  TOTAL_HEIGHT: 22
} as const;

// Game states
export enum GameStatus {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

// Main game state interface
export interface GameState {
  grid: number[][];           // 0 = empty, 1-7 = tetromino type
  currentPiece: Tetromino | null;
  currentPosition: Position;
  nextPiece: TetrominoType | null;
  status: GameStatus;
  score: number;
  lines: number;
  level: number;
  startLevel: number;
  highScore: number;
  showNextPiece: boolean;
  rngSeed: number;
  prevPieceType: number;
  frameCount: number;
  gravityCounter: number;
  softDropping: boolean;
  softDropScore: number;
  aiEnabled: boolean;
  aiTarget: { x: number; rotation: number } | null;
}

// Input state for DAS tracking
export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  rotateLeft: boolean;
  rotateRight: boolean;
  pause: boolean;
  restart: boolean;
  toggleNext: boolean;
  leftFrames: number;
  rightFrames: number;
  dasCharged: boolean;
  dasDirection: 'left' | 'right' | null;
  dasCounter: number;
}

// Scoring multipliers
export const SCORE_MULTIPLIERS = {
  SINGLE: 40,
  DOUBLE: 100,
  TRIPLE: 300,
  TETRIS: 1200,
  SOFT_DROP: 1
} as const;

// Key mappings for QWERTY controls
export const KEY_MAPPINGS = {
  LEFT: ['ArrowLeft', 'a', 'A'],
  RIGHT: ['ArrowRight', 'd', 'D'],
  DOWN: ['ArrowDown', 's', 'S'],
  ROTATE_CW: ['k', 'K', 'x', 'X'],
  ROTATE_CCW: ['j', 'J', 'z', 'Z'],
  PAUSE: ['Enter', 'p', 'P'],
  TOGGLE_NEXT: ['n', 'N'],
  RESTART: ['r', 'R']
} as const;

