import type { Tetromino, Position, TetrominoType, InputState } from './tetris-types';
import { TETROMINOES, COLORS, GRID, SCORE_MULTIPLIERS, TIMING } from './tetris-types';

// NES-style 7-value LFSR RNG with repeat protection
export function nextPiece(prevPieceType: number, seed: number): { piece: number; newSeed: number } {
  // Emulate NES 7-bit LFSR
  let newSeed = (seed >> 1) | (((seed ^ (seed >> 1)) & 1) << 7);
  let candidate = newSeed % 8;
  
  // If candidate is 7 or same as previous, reroll
  if (candidate === 7 || candidate === prevPieceType) {
    newSeed = (newSeed >> 1) | (((newSeed ^ (newSeed >> 1)) & 1) << 7);
    candidate = newSeed % 7;
  }
  
  return { piece: candidate, newSeed };
}

// Convert piece number to tetromino type
export function getPieceType(pieceNum: number): TetrominoType {
  const types: TetrominoType[] = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'];
  return types[pieceNum % 7];
}

// Create a tetromino object
export function createTetromino(type: TetrominoType, rotation: number = 0): Tetromino {
  return {
    type,
    shape: TETROMINOES[type][rotation % 4],
    color: COLORS[type],
    rotation: rotation % 4
  };
}

// Check if a piece collides with the grid or boundaries
export function checkCollision(
  grid: number[][],
  piece: Tetromino,
  position: Position
): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const gridX = position.x + x;
        const gridY = position.y + y;
        
        // Check boundaries
        if (gridX < 0 || gridX >= GRID.WIDTH || gridY >= GRID.TOTAL_HEIGHT) {
          return true;
        }
        
        // Check grid collision (only if within bounds)
        if (gridY >= 0 && grid[gridY][gridX]) {
          return true;
        }
      }
    }
  }
  return false;
}

// Rotate piece (NRS - no wall kicks)
export function rotatePiece(
  grid: number[][],
  piece: Tetromino,
  position: Position,
  clockwise: boolean
): Tetromino | null {
  const newRotation = clockwise 
    ? (piece.rotation + 1) % 4 
    : (piece.rotation + 3) % 4;
  
  const rotated = createTetromino(piece.type, newRotation);
  
  // Check if rotation is valid (no wall kicks in NRS)
  if (checkCollision(grid, rotated, position)) {
    return null;
  }
  
  return rotated;
}

// Lock piece to grid
export function lockPiece(grid: number[][], piece: Tetromino, position: Position): number[][] {
  const newGrid = grid.map(row => [...row]);
  const typeIndex = ['I', 'O', 'T', 'J', 'L', 'S', 'Z'].indexOf(piece.type) + 1;
  
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const gridY = position.y + y;
        if (gridY >= 0 && gridY < GRID.TOTAL_HEIGHT) {
          newGrid[gridY][position.x + x] = typeIndex;
        }
      }
    }
  }
  
  return newGrid;
}

// Check for completed lines and return their indices
export function findCompletedLines(grid: number[][]): number[] {
  const completedLines: number[] = [];
  
  for (let y = 0; y < GRID.TOTAL_HEIGHT; y++) {
    if (grid[y].every(cell => cell !== 0)) {
      completedLines.push(y);
    }
  }
  
  return completedLines;
}

// Clear completed lines from grid
export function clearLines(grid: number[][], lineIndices: number[]): number[][] {
  let newGrid = grid.map(row => [...row]);
  
  // Sort lines from top to bottom
  const sortedLines = [...lineIndices].sort((a, b) => a - b);
  
  // Remove completed lines
  for (const lineIndex of sortedLines) {
    newGrid.splice(lineIndex, 1);
    // Add empty line at the top
    newGrid.unshift(Array(GRID.WIDTH).fill(0));
  }
  
  return newGrid;
}

// Calculate score for cleared lines
export function calculateScore(linesCleared: number, level: number, softDropCells: number): number {
  let lineScore = 0;
  
  switch (linesCleared) {
    case 1:
      lineScore = SCORE_MULTIPLIERS.SINGLE * (level + 1);
      break;
    case 2:
      lineScore = SCORE_MULTIPLIERS.DOUBLE * (level + 1);
      break;
    case 3:
      lineScore = SCORE_MULTIPLIERS.TRIPLE * (level + 1);
      break;
    case 4:
      lineScore = SCORE_MULTIPLIERS.TETRIS * (level + 1);
      break;
  }
  
  return lineScore + (softDropCells * SCORE_MULTIPLIERS.SOFT_DROP);
}

// Calculate level progression
export function calculateLevel(startLevel: number, totalLines: number): number {
  if (startLevel >= 10) {
    // Special rule for high starts
    const threshold = Math.max(100, startLevel * 10 - 50);
    if (totalLines >= threshold) {
      return startLevel + Math.floor((totalLines - threshold) / 10) + 1;
    }
    return startLevel;
  } else {
    // Standard progression
    const threshold = startLevel * 10 + 10;
    if (totalLines >= threshold) {
      return startLevel + Math.floor((totalLines - threshold) / 10) + 1;
    }
    return startLevel;
  }
}

// Check if piece is above visible playfield (top-out condition)
export function isAbovePlayfield(position: Position, piece: Tetromino): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        if (position.y + y < GRID.HIDDEN_ROWS) {
          return true;
        }
      }
    }
  }
  return false;
}

// Initialize empty grid
export function createEmptyGrid(): number[][] {
  return Array(GRID.TOTAL_HEIGHT).fill(0).map(() => Array(GRID.WIDTH).fill(0));
}

// Get spawn position for new piece
export function getSpawnPosition(): Position {
  return {
    x: Math.floor((GRID.WIDTH - 4) / 2),
    y: 0
  };
}

// Process DAS (Delayed Auto Shift) input
export function processDAS(
  inputState: InputState,
  grid: number[][],
  piece: Tetromino,
  position: Position
): Position {
  let newPosition = { ...position };
  
  // Handle left/right movement with DAS
  if (inputState.left && !inputState.right) {
    if (inputState.leftFrames === 1) {
      // Initial press
      const testPos = { x: position.x - 1, y: position.y };
      if (!checkCollision(grid, piece, testPos)) {
        newPosition = testPos;
      }
    } else if (inputState.leftFrames > TIMING.DAS_DELAY) {
      // DAS charged, auto-repeat
      if ((inputState.leftFrames - TIMING.DAS_DELAY) % TIMING.DAS_REPEAT === 0) {
        const testPos = { x: position.x - 1, y: position.y };
        if (!checkCollision(grid, piece, testPos)) {
          newPosition = testPos;
        }
      }
    }
  } else if (inputState.right && !inputState.left) {
    if (inputState.rightFrames === 1) {
      // Initial press
      const testPos = { x: position.x + 1, y: position.y };
      if (!checkCollision(grid, piece, testPos)) {
        newPosition = testPos;
      }
    } else if (inputState.rightFrames > TIMING.DAS_DELAY) {
      // DAS charged, auto-repeat
      if ((inputState.rightFrames - TIMING.DAS_DELAY) % TIMING.DAS_REPEAT === 0) {
        const testPos = { x: position.x + 1, y: position.y };
        if (!checkCollision(grid, piece, testPos)) {
          newPosition = testPos;
        }
      }
    }
  }
  
  return newPosition;
}

// Calculate ghost piece position (for visual hint)
export function getGhostPosition(grid: number[][], piece: Tetromino, position: Position): Position {
  let ghostY = position.y;
  
  while (!checkCollision(grid, piece, { x: position.x, y: ghostY + 1 })) {
    ghostY++;
  }
  
  return { x: position.x, y: ghostY };
}

// Load high score from localStorage
export function loadHighScore(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tetrisHighScore');
    return stored ? parseInt(stored, 10) : 0;
  }
  return 0;
}

// Save high score to localStorage
export function saveHighScore(score: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tetrisHighScore', score.toString());
  }
}

// Load game state from localStorage
export function loadGameState(): { score: number; level: number; lines: number } {
  if (typeof window !== 'undefined') {
    const storedScore = localStorage.getItem('tetrisGameScore');
    const storedLevel = localStorage.getItem('tetrisGameLevel');
    const storedLines = localStorage.getItem('tetrisGameLines');
    
    return {
      score: storedScore ? parseInt(storedScore, 10) : 0,
      level: storedLevel ? parseInt(storedLevel, 10) : 0,
      lines: storedLines ? parseInt(storedLines, 10) : 0
    };
  }
  return { score: 0, level: 0, lines: 0 };
}

// Save game state to localStorage
export function saveGameState(score: number, level: number, lines: number): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tetrisGameScore', score.toString());
    localStorage.setItem('tetrisGameLevel', level.toString());
    localStorage.setItem('tetrisGameLines', lines.toString());
  }
}

// Load cumulative high score from localStorage
export function loadCumulativeHighScore(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tetrisCumulativeHighScore');
    return stored ? parseInt(stored, 10) : 0;
  }
  return 0;
}

// Save cumulative high score to localStorage
export function saveCumulativeHighScore(score: number): void {
  if (typeof window !== 'undefined') {
    const currentCumulative = loadCumulativeHighScore();
    if (score > currentCumulative) {
      localStorage.setItem('tetrisCumulativeHighScore', score.toString());
    }
  }
}

// Initialize RNG seed
export function initRNGSeed(): number {
  return Math.floor(Math.random() * 256) || 1;
}

// AI EVALUATION CLASS

export class TetrisAI {
  // Get column heights
  private static getColumnHeights(grid: number[][]): number[] {
    const heights: number[] = Array(GRID.WIDTH).fill(0);
    
    for (let x = 0; x < GRID.WIDTH; x++) {
      for (let y = 0; y < GRID.TOTAL_HEIGHT; y++) {
        if (grid[y][x] !== 0) {
          heights[x] = GRID.TOTAL_HEIGHT - y;
          break;
        }
      }
    }
    
    return heights;
  }

  // Count holes (empty cells with filled cells above)
  private static countHoles(grid: number[][]): number {
    let holes = 0;
    
    for (let x = 0; x < GRID.WIDTH; x++) {
      let foundBlock = false;
      for (let y = 0; y < GRID.TOTAL_HEIGHT; y++) {
        if (grid[y][x] !== 0) {
          foundBlock = true;
        } else if (foundBlock) {
          holes++;
        }
      }
    }
    
    return holes;
  }

  // Calculate bumpiness (sum of height differences between adjacent columns)
  private static calculateBumpiness(heights: number[]): number {
    let bumpiness = 0;
    for (let i = 0; i < heights.length - 1; i++) {
      bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    return bumpiness;
  }

  // Evaluate a potential piece placement
  private static evaluatePlacement(grid: number[][], piece: Tetromino, position: Position): number {
    // Create a test grid with the piece placed
    const testGrid = lockPiece(grid, piece, position);
    
    // Count lines that would be cleared
    const completedLines = findCompletedLines(testGrid);
    const linesCleared = completedLines.length;
    
    // Clear the lines for proper evaluation
    const clearedGrid = linesCleared > 0 ? clearLines(testGrid, completedLines) : testGrid;
    
    // Calculate metrics
    const heights = this.getColumnHeights(clearedGrid);
    const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
    const holes = this.countHoles(clearedGrid);
    const bumpiness = this.calculateBumpiness(heights);
    
    // Weighted scoring (tuned for reasonable play)
    const score = 
      (linesCleared * 100) +      // Prioritize clearing lines
      (aggregateHeight * -0.5) +  // Penalize height
      (holes * -35) +             // Strongly penalize holes
      (bumpiness * -0.2);         // Penalize uneven surface
    
    return score;
  }

  // Get all possible moves for current piece
  private static getAllPossibleMoves(grid: number[][], piece: Tetromino): Array<{ x: number; rotation: number; score: number }> {
    const moves: Array<{ x: number; rotation: number; score: number }> = [];
    
    // Try all rotations
    for (let rotation = 0; rotation < 4; rotation++) {
      const rotatedPiece = createTetromino(piece.type, rotation);
      
      // Try all x positions
      for (let x = 0; x < GRID.WIDTH; x++) {
        // Find the lowest valid position for this x
        let testPos = { x, y: 0 };
        
        // Drop until we hit something
        while (!checkCollision(grid, rotatedPiece, { x, y: testPos.y + 1 })) {
          testPos.y++;
        }
        
        // Check if this position is valid
        if (!checkCollision(grid, rotatedPiece, testPos)) {
          const score = this.evaluatePlacement(grid, rotatedPiece, testPos);
          moves.push({ x, rotation, score });
        }
      }
    }
    
    return moves;
  }

  // Find the best move for current piece
  static findBestMove(grid: number[][], piece: Tetromino): { x: number; rotation: number } | null {
    const moves = this.getAllPossibleMoves(grid, piece);
    
    if (moves.length === 0) {
      return null;
    }
    
    // Find move with highest score
    let bestMove = moves[0];
    for (const move of moves) {
      if (move.score > bestMove.score) {
        bestMove = move;
      }
    }
    
    return { x: bestMove.x, rotation: bestMove.rotation };
  }
}

