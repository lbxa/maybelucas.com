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

// AI EVALUATION CLASSES

export class TetrisAIv1 {
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

// AI V2 - ADVANCED EVALUATION WITH 2-PIECE LOOKAHEAD

export class TetrisAIv2 {
  // Enhanced heuristic weights (tuned for near-perfect play)
  private static readonly WEIGHTS = {
    LINES_CLEARED: 100,
    AGGREGATE_HEIGHT: -0.51,
    HOLES: -35,
    BUMPINESS: -0.18,
    ROW_TRANSITIONS: -1.0,
    COLUMN_TRANSITIONS: -1.0,
    WELLS: -5.0,
    COVERED_HOLES: -50,
    HEIGHT_VARIANCE: -0.5,
    TETRIS_BONUS: 200,
    DEATH_HEIGHT_PENALTY: -100,
    MAX_HEIGHT_PENALTY: -10
  };

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

  // Count all holes (empty cells with filled cells above)
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

  // Count covered holes (holes with multiple blocks above)
  private static countCoveredHoles(grid: number[][]): number {
    let coveredHoles = 0;
    
    for (let x = 0; x < GRID.WIDTH; x++) {
      let blocksAbove = 0;
      for (let y = 0; y < GRID.TOTAL_HEIGHT; y++) {
        if (grid[y][x] !== 0) {
          blocksAbove++;
        } else if (blocksAbove > 1) {
          coveredHoles++;
        }
      }
    }
    
    return coveredHoles;
  }

  // Calculate bumpiness (sum of height differences between adjacent columns)
  private static calculateBumpiness(heights: number[]): number {
    let bumpiness = 0;
    for (let i = 0; i < heights.length - 1; i++) {
      bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    return bumpiness;
  }

  // Calculate height variance (prefer flat surfaces)
  private static calculateHeightVariance(heights: number[]): number {
    const mean = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / heights.length;
    return Math.sqrt(variance);
  }

  // Count row transitions (changes from filled to empty in rows)
  private static countRowTransitions(grid: number[][]): number {
    let transitions = 0;
    
    for (let y = 0; y < GRID.TOTAL_HEIGHT; y++) {
      for (let x = 0; x < GRID.WIDTH - 1; x++) {
        if ((grid[y][x] !== 0) !== (grid[y][x + 1] !== 0)) {
          transitions++;
        }
      }
      // Count edges as transitions
      if (grid[y][0] === 0) transitions++;
      if (grid[y][GRID.WIDTH - 1] === 0) transitions++;
    }
    
    return transitions;
  }

  // Count column transitions (changes from filled to empty in columns)
  private static countColumnTransitions(grid: number[][]): number {
    let transitions = 0;
    
    for (let x = 0; x < GRID.WIDTH; x++) {
      for (let y = 0; y < GRID.TOTAL_HEIGHT - 1; y++) {
        if ((grid[y][x] !== 0) !== (grid[y + 1][x] !== 0)) {
          transitions++;
        }
      }
      // Count bottom as transition if empty
      if (grid[GRID.TOTAL_HEIGHT - 1][x] === 0) transitions++;
    }
    
    return transitions;
  }

  // Detect wells (deep vertical gaps good for I-pieces)
  private static countWells(heights: number[]): number {
    let wellDepth = 0;
    
    for (let x = 0; x < heights.length; x++) {
      const leftHeight = x > 0 ? heights[x - 1] : GRID.TOTAL_HEIGHT;
      const rightHeight = x < heights.length - 1 ? heights[x + 1] : GRID.TOTAL_HEIGHT;
      const currentHeight = heights[x];
      
      const depth = Math.min(leftHeight, rightHeight) - currentHeight;
      if (depth > 0) {
        // Penalize deep wells more (quadratic)
        wellDepth += depth * depth;
      }
    }
    
    return wellDepth;
  }

  // Check if board is ready for Tetris (has a clean I-piece well)
  private static checkTetrisReadiness(heights: number[]): number {
    for (let x = 0; x < heights.length; x++) {
      const leftHeight = x > 0 ? heights[x - 1] : 0;
      const rightHeight = x < heights.length - 1 ? heights[x + 1] : 0;
      const currentHeight = heights[x];
      
      // Look for a column that's 3-4 blocks lower than neighbors
      if (leftHeight >= currentHeight + 3 && rightHeight >= currentHeight + 3) {
        return 1;
      }
    }
    return 0;
  }

  // Calculate penalty for pieces near death (top of board)
  private static calculateDeathHeightPenalty(heights: number[]): number {
    const maxHeight = Math.max(...heights);
    const dangerZone = GRID.TOTAL_HEIGHT - GRID.HIDDEN_ROWS - 4; // Top 4 visible rows
    
    if (maxHeight > dangerZone) {
      return (maxHeight - dangerZone) * 10;
    }
    return 0;
  }

  // Evaluate a potential piece placement with enhanced heuristics
  private static evaluatePlacement(grid: number[][], piece: Tetromino, position: Position): number {
    // Create a test grid with the piece placed
    const testGrid = lockPiece(grid, piece, position);
    
    // Count lines that would be cleared
    const completedLines = findCompletedLines(testGrid);
    const linesCleared = completedLines.length;
    
    // Clear the lines for proper evaluation
    const clearedGrid = linesCleared > 0 ? clearLines(testGrid, completedLines) : testGrid;
    
    // Calculate all metrics
    const heights = this.getColumnHeights(clearedGrid);
    const aggregateHeight = heights.reduce((sum, h) => sum + h, 0);
    const holes = this.countHoles(clearedGrid);
    const coveredHoles = this.countCoveredHoles(clearedGrid);
    const bumpiness = this.calculateBumpiness(heights);
    const heightVariance = this.calculateHeightVariance(heights);
    const rowTransitions = this.countRowTransitions(clearedGrid);
    const columnTransitions = this.countColumnTransitions(clearedGrid);
    const wells = this.countWells(heights);
    const tetrisReady = this.checkTetrisReadiness(heights);
    const deathHeight = this.calculateDeathHeightPenalty(heights);
    const maxHeight = Math.max(...heights);
    
    // Calculate line score with exponential bonus for Tetris
    let lineScore = linesCleared * this.WEIGHTS.LINES_CLEARED;
    if (linesCleared === 4) {
      lineScore += this.WEIGHTS.TETRIS_BONUS; // Extra bonus for Tetris
    }
    
    // Weighted scoring
    const score = 
      lineScore +
      (aggregateHeight * this.WEIGHTS.AGGREGATE_HEIGHT) +
      (holes * this.WEIGHTS.HOLES) +
      (coveredHoles * this.WEIGHTS.COVERED_HOLES) +
      (bumpiness * this.WEIGHTS.BUMPINESS) +
      (heightVariance * this.WEIGHTS.HEIGHT_VARIANCE) +
      (rowTransitions * this.WEIGHTS.ROW_TRANSITIONS) +
      (columnTransitions * this.WEIGHTS.COLUMN_TRANSITIONS) +
      (wells * this.WEIGHTS.WELLS) +
      (tetrisReady * 50) + // Bonus for Tetris setup
      (deathHeight * this.WEIGHTS.DEATH_HEIGHT_PENALTY) +
      (maxHeight > GRID.TOTAL_HEIGHT - GRID.HIDDEN_ROWS - 2 ? this.WEIGHTS.MAX_HEIGHT_PENALTY * 10 : 0);
    
    return score;
  }

  // Get all possible moves for a piece
  private static getAllPossibleMoves(
    grid: number[][], 
    piece: Tetromino
  ): Array<{ x: number; rotation: number; score: number; grid: number[][] }> {
    const moves: Array<{ x: number; rotation: number; score: number; grid: number[][] }> = [];
    
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
          const resultGrid = lockPiece(grid, rotatedPiece, testPos);
          const completedLines = findCompletedLines(resultGrid);
          const clearedGrid = completedLines.length > 0 ? clearLines(resultGrid, completedLines) : resultGrid;
          
          moves.push({ x, rotation, score, grid: clearedGrid });
        }
      }
    }
    
    return moves;
  }

  // 2-piece lookahead: evaluate current move considering next piece
  private static evaluateWithLookahead(
    grid: number[][],
    currentPiece: Tetromino,
    nextPieceType: TetrominoType | null
  ): Array<{ x: number; rotation: number; score: number }> {
    const currentMoves = this.getAllPossibleMoves(grid, currentPiece);
    
    if (!nextPieceType) {
      // No lookahead available, return current evaluations
      return currentMoves.map(m => ({ x: m.x, rotation: m.rotation, score: m.score }));
    }
    
    const results: Array<{ x: number; rotation: number; score: number }> = [];
    
    // For each possible current move
    for (const currentMove of currentMoves) {
      // Create the next piece
      const nextPiece = createTetromino(nextPieceType);
      
      // Get all possible moves for next piece on the resulting grid
      const nextMoves = this.getAllPossibleMoves(currentMove.grid, nextPiece);
      
      if (nextMoves.length === 0) {
        // If no valid moves for next piece, heavily penalize this current move
        results.push({ 
          x: currentMove.x, 
          rotation: currentMove.rotation, 
          score: currentMove.score - 10000 
        });
        continue;
      }
      
      // Use average of top 3 next moves (more robust than just best/worst)
      const sortedNextMoves = nextMoves.sort((a, b) => b.score - a.score);
      const topMoves = sortedNextMoves.slice(0, Math.min(3, sortedNextMoves.length));
      const avgNextScore = topMoves.reduce((sum, m) => sum + m.score, 0) / topMoves.length;
      
      // Combined score: 70% current move, 30% expected next move value
      const combinedScore = currentMove.score * 0.7 + avgNextScore * 0.3;
      
      results.push({
        x: currentMove.x,
        rotation: currentMove.rotation,
        score: combinedScore
      });
    }
    
    return results;
  }

  // Find the best move with 2-piece lookahead
  static findBestMove(
    grid: number[][], 
    piece: Tetromino, 
    nextPieceType: TetrominoType | null = null
  ): { x: number; rotation: number } | null {
    const moves = this.evaluateWithLookahead(grid, piece, nextPieceType);
    
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

