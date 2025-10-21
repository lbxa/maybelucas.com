import { createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import type { GameState, InputState } from './tetris-types';
import { GameStatus, GRID, TIMING, KEY_MAPPINGS, getGravity } from './tetris-types';
import {
  createEmptyGrid,
  nextPiece,
  getPieceType,
  createTetromino,
  checkCollision,
  rotatePiece,
  lockPiece,
  findCompletedLines,
  clearLines,
  calculateScore,
  calculateLevel,
  getSpawnPosition,
  processDAS,
  getGhostPosition,
  loadHighScore,
  saveHighScore,
  initRNGSeed,
  loadGameState,
  saveGameState,
  loadCumulativeHighScore,
  saveCumulativeHighScore,
  TetrisAI
} from './tetris-engine';
import { updateParticlesFromScore } from '@/stores/particleStore';

// Figma-style key cap component
function KeyCap(props: { children: string }) {
  return (
    <span class="inline-flex items-center justify-center px-2 py-1 min-w-[24px] text-[10px] font-mono font-medium bg-ivory dark:bg-shark-900 border border-shark-950/20 dark:border-ivory/20 rounded shadow-sm">
      {props.children}
    </span>
  );
}

// Keyboard shortcut row component
function ShortcutRow(props: { label: string; keys: string[][] }) {
  return (
    <div class="flex items-center justify-between gap-4 text-xs">
      <span class="opacity-60 min-w-[60px] text-left">{props.label}</span>
      <div class="flex items-center gap-2">
        {props.keys.map((keyGroup, i) => (
          <>
            {i > 0 && <span class="opacity-40 text-[10px]">or</span>}
            <div class="flex gap-1">
              {keyGroup.map(key => <KeyCap>{key}</KeyCap>)}
            </div>
          </>
        ))}
      </div>
    </div>
  );
}

export const TetrisGame = () => {
  const [gameState, setGameState] = createSignal<GameState>(initializeGame());
  const [inputState, setInputState] = createSignal<InputState>(initializeInput());
  const [isMobile, setIsMobile] = createSignal(false);
  
  let canvasRef: HTMLCanvasElement | undefined;
  let animationFrameId: number | null = null;
  let lastFrameTime = 0;
  
  function initializeGame(): GameState {
    const seed = initRNGSeed();
    const { piece: firstPiece, newSeed } = nextPiece(-1, seed);
    const { piece: secondPiece, newSeed: finalSeed } = nextPiece(firstPiece, newSeed);
    
    // Initialize with default values to avoid hydration mismatch
    // localStorage data will be loaded in onMount()
    return {
      grid: createEmptyGrid(),
      currentPiece: createTetromino(getPieceType(firstPiece)),
      currentPosition: getSpawnPosition(),
      nextPiece: getPieceType(secondPiece),
      status: GameStatus.IDLE,
      score: 0,
      lines: 0,
      level: 0,
      startLevel: 0,
      highScore: 0,
      showNextPiece: true,
      rngSeed: finalSeed,
      prevPieceType: firstPiece,
      frameCount: 0,
      gravityCounter: 0,
      softDropping: false,
      softDropScore: 0,
      aiEnabled: false,
      aiTarget: null
    };
  }
  
  function initializeInput(): InputState {
    return {
      left: false,
      right: false,
      down: false,
      rotateLeft: false,
      rotateRight: false,
      pause: false,
      restart: false,
      toggleNext: false,
      leftFrames: 0,
      rightFrames: 0,
      dasCharged: false,
      dasDirection: null,
      dasCounter: 0
    };
  }
  
  function startGame() {
    const state = gameState();
    if (state.status === GameStatus.IDLE || state.status === GameStatus.GAME_OVER) {
      setGameState(initializeGame());
      // Disable AI when player takes control (desktop only)
      const mobile = isMobile();
      setGameState(prev => ({ 
        ...prev, 
        status: GameStatus.PLAYING,
        aiEnabled: mobile // Keep AI enabled on mobile, disable on desktop
      }));
      // Reset input state to clear any AI actions (e.g., soft drop)
      setInputState(initializeInput());
    }
  }
  
  function togglePause() {
    const state = gameState();
    if (state.status === GameStatus.PLAYING) {
      setGameState(prev => ({ ...prev, status: GameStatus.PAUSED }));
    } else if (state.status === GameStatus.PAUSED) {
      setGameState(prev => ({ ...prev, status: GameStatus.PLAYING }));
      // Reset input state when resuming to clear any lingering input
      setInputState(initializeInput());
    }
  }
  
  function restartGame() {
    // Reload saved state instead of resetting to 0
    const mobile = isMobile();
    setGameState(initializeGame());
    setGameState(prev => ({ 
      ...prev, 
      status: mobile ? GameStatus.PLAYING : GameStatus.IDLE,
      aiEnabled: true // Always enable AI on restart for demo
    }));
  }
  
  function spawnNewPiece(state: GameState): GameState {
    if (!state.nextPiece) return state;
    
    const newPiece = createTetromino(state.nextPiece);
    const spawnPos = getSpawnPosition();
    
    // Check if we can spawn (game over check)
    if (checkCollision(state.grid, newPiece, spawnPos)) {
      const newHighScore = Math.max(state.score, state.highScore);
      saveHighScore(newHighScore);
      
      // Update cumulative high score and particles
      saveCumulativeHighScore(state.score);
      const cumulativeHighScore = loadCumulativeHighScore();
      updateParticlesFromScore(cumulativeHighScore);
      
      // Save game state
      saveGameState(state.score, state.level, state.lines);
      
      return { ...state, status: GameStatus.GAME_OVER, highScore: newHighScore };
    }
    
    // Generate next piece
    const { piece: nextPieceNum, newSeed } = nextPiece(
      ['I', 'O', 'T', 'J', 'L', 'S', 'Z'].indexOf(state.nextPiece),
      state.rngSeed
    );
    
    return {
      ...state,
      currentPiece: newPiece,
      currentPosition: spawnPos,
      nextPiece: getPieceType(nextPieceNum),
      rngSeed: newSeed,
      prevPieceType: nextPieceNum,
      softDropScore: 0,
      aiTarget: null
    };
  }
  
  function gameLoop(timestamp: number) {
    const state = gameState();
    const input = inputState();
    
    // Allow game loop to run for IDLE state with AI enabled (background demo play)
    if (state.status !== GameStatus.PLAYING && !(state.status === GameStatus.IDLE && state.aiEnabled)) {
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Frame rate limiting to 60.098 FPS
    const frameTime = 1000 / TIMING.FPS;
    if (timestamp - lastFrameTime < frameTime) {
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    lastFrameTime = timestamp;
    
    let newState = { ...state };
    newState.frameCount++;
    
    if (!newState.currentPiece) {
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }
    
    // AI Controller (runs every ~15 frames for watchable speed)
    if (newState.aiEnabled && newState.frameCount % 15 === 0) {
      if (!newState.aiTarget) {
        // Calculate new target
        const bestMove = TetrisAI.findBestMove(newState.grid, newState.currentPiece);
        if (bestMove) {
          newState.aiTarget = bestMove;
        }
      }
      
      // Execute moves toward target
      if (newState.aiTarget) {
        const currentRot = newState.currentPiece.rotation;
        const targetRot = newState.aiTarget.rotation;
        
        // Rotate if needed
        if (currentRot !== targetRot) {
          const rotated = rotatePiece(newState.grid, newState.currentPiece, newState.currentPosition, true);
          if (rotated) {
            newState.currentPiece = rotated;
          }
        }
        
        // Move horizontally if needed
        const currentX = newState.currentPosition.x;
        const targetX = newState.aiTarget.x;
        if (currentX < targetX) {
          const testPos = { x: currentX + 1, y: newState.currentPosition.y };
          if (!checkCollision(newState.grid, newState.currentPiece, testPos)) {
            newState.currentPosition = testPos;
          }
        } else if (currentX > targetX) {
          const testPos = { x: currentX - 1, y: newState.currentPosition.y };
          if (!checkCollision(newState.grid, newState.currentPiece, testPos)) {
            newState.currentPosition = testPos;
          }
        }
        
        // Soft drop when aligned
        if (currentX === targetX && currentRot === targetRot) {
          setInputState(prev => ({ ...prev, down: true }));
        }
      }
    }
    
    // Update input frame counters
    if (input.left) {
      setInputState(prev => ({ ...prev, leftFrames: prev.leftFrames + 1 }));
    }
    if (input.right) {
      setInputState(prev => ({ ...prev, rightFrames: prev.rightFrames + 1 }));
    }
    
    // Handle rotation
    if (input.rotateLeft) {
      const rotated = rotatePiece(newState.grid, newState.currentPiece, newState.currentPosition, false);
      if (rotated) {
        newState.currentPiece = rotated;
      }
      setInputState(prev => ({ ...prev, rotateLeft: false }));
    }
    
    if (input.rotateRight) {
      const rotated = rotatePiece(newState.grid, newState.currentPiece, newState.currentPosition, true);
      if (rotated) {
        newState.currentPiece = rotated;
      }
      setInputState(prev => ({ ...prev, rotateRight: false }));
    }
    
    // Handle horizontal movement with DAS
    const newPosition = processDAS(input, newState.grid, newState.currentPiece, newState.currentPosition);
    newState.currentPosition = newPosition;
    
    // Handle gravity and soft drop
    const gravity = getGravity(newState.level);
    const dropSpeed = input.down ? Math.floor(gravity * TIMING.SOFT_DROP_MULTIPLIER) : gravity;
    
    newState.gravityCounter++;
    
    if (newState.gravityCounter >= dropSpeed) {
      newState.gravityCounter = 0;
      
      const downPos = { x: newState.currentPosition.x, y: newState.currentPosition.y + 1 };
      
      if (!checkCollision(newState.grid, newState.currentPiece, downPos)) {
        newState.currentPosition = downPos;
        
        // Add soft drop score
        if (input.down) {
          newState.softDropScore++;
        }
      } else {
        // Lock piece
        const lockedGrid = lockPiece(newState.grid, newState.currentPiece, newState.currentPosition);
        
        // Check for lines
        const completedLines = findCompletedLines(lockedGrid);
        const clearedGrid = completedLines.length > 0 ? clearLines(lockedGrid, completedLines) : lockedGrid;
        
        // Calculate score
        const earnedScore = calculateScore(completedLines.length, newState.level, newState.softDropScore);
        const newScore = newState.score + earnedScore;
        const newLines = newState.lines + completedLines.length;
        const newLevel = calculateLevel(newState.startLevel, newLines);
        
        newState.grid = clearedGrid;
        newState.score = newScore;
        newState.lines = newLines;
        newState.level = newLevel;
        
        // Save game state and update particles based on cumulative high score
        saveGameState(newScore, newLevel, newLines);
        saveCumulativeHighScore(newScore);
        const cumulativeHighScore = loadCumulativeHighScore();
        updateParticlesFromScore(cumulativeHighScore);
        
        // Spawn new piece
        newState = spawnNewPiece(newState);
      }
    }
    
    setGameState(newState);
    renderGame(newState);
    
    animationFrameId = requestAnimationFrame(gameLoop);
  }
  
  function darkenColor(hex: string, amount: number = 0.3): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const darkR = Math.floor(r * (1 - amount));
    const darkG = Math.floor(g * (1 - amount));
    const darkB = Math.floor(b * (1 - amount));
    
    return `rgb(${darkR}, ${darkG}, ${darkB})`;
  }
  
  function renderGame(state: GameState) {
    const canvas = canvasRef;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cellSize = canvas.width / GRID.WIDTH;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get computed colors based on theme
    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? 'rgba(18, 18, 18, 0.6)' : 'rgba(245, 245, 245, 0.6)';
    const gridColor = isDark ? 'rgba(245, 245, 245, 0.05)' : 'rgba(18, 18, 18, 0.05)';
    const ghostBorderColor = isDark ? 'rgba(245, 245, 245, 0.2)' : 'rgba(18, 18, 18, 0.2)';
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    for (let y = 0; y < GRID.HEIGHT; y++) {
      for (let x = 0; x < GRID.WIDTH; x++) {
        const gridY = y + GRID.HIDDEN_ROWS;
        const cellValue = state.grid[gridY][x];
        
        if (cellValue > 0) {
          // Draw locked piece
          const colors = ['#60a5fa', '#fbbf24', '#a78bfa', '#3b82f6', '#f97316', '#22c55e', '#ef4444'];
          const color = colors[cellValue - 1];
          ctx.fillStyle = color;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = darkenColor(color, 0.4);
          ctx.lineWidth = 2;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
          // Draw empty cell
          ctx.strokeStyle = gridColor;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Draw ghost piece
    if (state.currentPiece) {
      const ghostPos = getGhostPosition(state.grid, state.currentPiece, state.currentPosition);
      ctx.fillStyle = isDark ? 'rgba(245, 245, 245, 0.1)' : 'rgba(18, 18, 18, 0.1)';
      
      for (let y = 0; y < state.currentPiece.shape.length; y++) {
        for (let x = 0; x < state.currentPiece.shape[y].length; x++) {
          if (state.currentPiece.shape[y][x]) {
            const drawY = ghostPos.y + y - GRID.HIDDEN_ROWS;
            if (drawY >= 0) {
              ctx.fillRect(
                (ghostPos.x + x) * cellSize,
                drawY * cellSize,
                cellSize,
                cellSize
              );
              ctx.strokeStyle = ghostBorderColor;
              ctx.lineWidth = 1;
              ctx.strokeRect(
                (ghostPos.x + x) * cellSize,
                drawY * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
      }
    }
    
    // Draw current piece
    if (state.currentPiece) {
      const pieceColor = state.currentPiece.color;
      ctx.fillStyle = pieceColor;
      
      for (let y = 0; y < state.currentPiece.shape.length; y++) {
        for (let x = 0; x < state.currentPiece.shape[y].length; x++) {
          if (state.currentPiece.shape[y][x]) {
            const drawY = state.currentPosition.y + y - GRID.HIDDEN_ROWS;
            if (drawY >= 0) {
              ctx.fillRect(
                (state.currentPosition.x + x) * cellSize,
                drawY * cellSize,
                cellSize,
                cellSize
              );
              ctx.strokeStyle = darkenColor(pieceColor, 0.4);
              ctx.lineWidth = 2;
              ctx.strokeRect(
                (state.currentPosition.x + x) * cellSize,
                drawY * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
      }
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    const state = gameState();
    const key = e.key;
    
    // Start game
    if ((KEY_MAPPINGS.PAUSE as readonly string[]).includes(key) && state.status === GameStatus.IDLE) {
      e.preventDefault();
      startGame();
      return;
    }
    
    // Pause/unpause
    if ((KEY_MAPPINGS.PAUSE as readonly string[]).includes(key) && (state.status === GameStatus.PLAYING || state.status === GameStatus.PAUSED)) {
      e.preventDefault();
      togglePause();
      return;
    }
    
    // Restart
    if ((KEY_MAPPINGS.RESTART as readonly string[]).includes(key)) {
      e.preventDefault();
      restartGame();
      return;
    }
    
    // Toggle next piece preview
    if ((KEY_MAPPINGS.TOGGLE_NEXT as readonly string[]).includes(key)) {
      e.preventDefault();
      setGameState(prev => ({ ...prev, showNextPiece: !prev.showNextPiece }));
      return;
    }
    
    if (state.status !== GameStatus.PLAYING) return;
    
    // Movement and rotation
    if ((KEY_MAPPINGS.LEFT as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => {
        if (!prev.left) {
          return { ...prev, left: true, leftFrames: 1 };
        }
        return prev;
      });
    }
    
    if ((KEY_MAPPINGS.RIGHT as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => {
        if (!prev.right) {
          return { ...prev, right: true, rightFrames: 1 };
        }
        return prev;
      });
    }
    
    if ((KEY_MAPPINGS.DOWN as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => ({ ...prev, down: true }));
    }
    
    if ((KEY_MAPPINGS.ROTATE_CW as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => ({ ...prev, rotateRight: true }));
    }
    
    if ((KEY_MAPPINGS.ROTATE_CCW as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => ({ ...prev, rotateLeft: true }));
    }
  }
  
  function handleKeyUp(e: KeyboardEvent) {
    const key = e.key;
    
    if ((KEY_MAPPINGS.LEFT as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => ({ ...prev, left: false, leftFrames: 0 }));
    }
    
    if ((KEY_MAPPINGS.RIGHT as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => ({ ...prev, right: false, rightFrames: 0 }));
    }
    
    if ((KEY_MAPPINGS.DOWN as readonly string[]).includes(key)) {
      e.preventDefault();
      setInputState(prev => ({ ...prev, down: false }));
    }
  }
  
  onMount(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Check if mobile
    const mobile = 'ontouchstart' in window;
    setIsMobile(mobile);
    
    // Load localStorage data after hydration to prevent mismatch
    const savedState = loadGameState();
    const savedHighScore = loadHighScore();
    setGameState(prev => ({
      ...prev,
      score: savedState.score,
      lines: savedState.lines,
      level: savedState.level,
      startLevel: savedState.level,
      highScore: savedHighScore
    }));
    
    // Enable AI for demo play
    if (mobile) {
      // Mobile: AI plays, status PLAYING
      setGameState(prev => ({ ...prev, aiEnabled: true, status: GameStatus.PLAYING }));
    } else {
      // Desktop: AI plays in background, status IDLE (shows overlay)
      setGameState(prev => ({ ...prev, aiEnabled: true, status: GameStatus.IDLE }));
    }
    
    // Add keyboard listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start game loop
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Initial render
    const state = gameState();
    if (canvasRef) {
      renderGame(state);
    }
  });
  
  onCleanup(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    }
    
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  });
  
  const state = () => gameState();
  const mobile = () => isMobile();
  
  return (
    <div 
      class="flex flex-col items-center justify-center"
      style={mobile() ? { height: '100dvh', overflow: 'hidden' } : { 'padding-top': '1rem' }}
    >
      {/* Main game container */}
      <div class="relative" style={mobile() ? { height: 'calc(100dvh)', display: 'flex', 'align-items': 'center', 'justify-content': 'center' } : {}}>
        {/* Canvas for game rendering */}
        <canvas
          ref={canvasRef}
          width={300}
          height={600}
          class="border border-shark-950/10 dark:border-ivory/10 bg-ivory/30 dark:bg-shark-950/30 backdrop-blur-md"
          style={mobile() ? { width: '100vw', height: 'auto', 'max-height': 'calc(100dvh)' } : {}}
        />
        
        {/* Mobile AI overlay */}
        {mobile() && (state().status === GameStatus.PLAYING || state().status === GameStatus.IDLE) && (
          <div class="absolute inset-0 flex items-center justify-center bg-ivory/50 dark:bg-shark-950/50 backdrop-blur-sm border border-shark-950/10 dark:border-ivory/10 pointer-events-none">
            <div class="text-center px-8">
              <p class="font-serif text-xl font-light uppercase tracking-wide opacity-80">
                Keyboard Required to Play
              </p>
              <p class="font-mono text-xs opacity-60 mt-2">
                Watching AI play...
              </p>
            </div>
          </div>
        )}
        
        {/* Idle state overlay (desktop only) - semi-transparent to see AI */}
        {!mobile() && state().status === GameStatus.IDLE && (
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-ivory/60 dark:bg-shark-950/60 backdrop-blur-sm border border-shark-950/10 dark:border-ivory/10 transition-opacity duration-300">
            <div class="text-center px-8">
              <h1 class="font-serif text-4xl font-black uppercase tracking-wider mb-6 relative">
                NES Tetris<sup class="absolute top-0 right-md text-xs opacity-50">®</sup>
              </h1>
              <p class="font-mono text-sm opacity-70 mb-4">
                Press ENTER to start
              </p>
              
              {/* Continue from */}
              {(state().score > 0 || state().lines > 0 || state().level > 0) && (
                <div class="font-mono text-xs opacity-70 mb-4">
                  <div>Continue from:</div>
                  <div>Score: {state().score.toLocaleString()}</div>
                  <div>Level: {state().level} | Lines: {state().lines}</div>
                </div>
              )}

              {/* High score */}
              {state().highScore > 0 && (
                <div class="font-mono text-xs opacity-50 mb-4">
                  High Score: {state().highScore.toLocaleString()}
                </div>
              )} 

              {/* Keyboard shortcuts */}
              <div class="inline-block text-left mb-6 rounded-lg p-4">
                <div class="flex flex-col gap-2">
                  <ShortcutRow label="Move" keys={[['←', '→', '↓'], ['A', 'S', 'D']]} />
                  <ShortcutRow label="Rotate" keys={[['J', 'K'], ['Z', 'X']]} />
                  <ShortcutRow label="Pause" keys={[['Enter']]} />
                  <ShortcutRow label="Restart" keys={[['R']]} />
                  <ShortcutRow label="Toggle Next" keys={[['N']]} />
                </div>
              </div>
              
            </div>
          </div>
        )}
        
        {/* Paused overlay */}
        {state().status === GameStatus.PAUSED && (
          <div class="absolute inset-0 flex items-center justify-center bg-ivory/80 dark:bg-shark-950/80 backdrop-blur-md transition-opacity duration-300">
            <div class="text-center">
              <p class="font-serif text-2xl font-light uppercase tracking-wide mb-2">
                Paused
              </p>
              <p class="font-mono text-xs opacity-70">
                Press ENTER to resume
              </p>
            </div>
          </div>
        )}
        
        {/* Game over overlay */}
        {state().status === GameStatus.GAME_OVER && (
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-ivory/80 dark:bg-shark-950/80 backdrop-blur-md transition-opacity duration-300">
            <div class="text-center px-8">
              <p class="font-serif text-2xl font-light uppercase tracking-wide mb-4">
                Game Over
              </p>
              <div class="font-mono text-sm mb-4">
                <div>Score: {state().score.toLocaleString()}</div>
                <div class="opacity-70">Lines: {state().lines}</div>
              </div>
              {!mobile() && (
                <p class="font-mono text-xs opacity-70">
                  Press R to restart
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Game stats and next piece preview - desktop only */}
      {!mobile() && state().status === GameStatus.PLAYING && (
        <div class="flex gap-4 items-stretch mt-4">
          {/* Game stats */}
          <div class="flex gap-6 font-mono text-xs bg-ivory/30 dark:bg-shark-950/30 backdrop-blur-md rounded-lg border border-shark-950/10 dark:border-ivory/10 p-4 min-h-[100px]">
            <div class="text-center flex flex-col justify-center">
              <div class="opacity-70 mb-1">Score</div>
              <div class="font-medium text-lg">{state().score.toLocaleString()}</div>
            </div>
            <div class="text-center flex flex-col justify-center">
              <div class="opacity-70 mb-1">Lines</div>
              <div class="font-medium text-lg">{state().lines}</div>
            </div>
            <div class="text-center flex flex-col justify-center">
              <div class="opacity-70 mb-1">Level</div>
              <div class="font-medium text-lg">{state().level}</div>
            </div>
          </div>
          
          {/* Next piece preview */}
          {state().nextPiece && (
            <div 
              class="bg-ivory/30 dark:bg-shark-950/30 backdrop-blur-md rounded-lg border border-shark-950/10 dark:border-ivory/10 p-4 flex flex-col justify-center items-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                opacity: state().showNextPiece ? '1' : '0',
                transform: state().showNextPiece ? 'scale(1) translateX(0)' : 'scale(0.8) translateX(-20px)',
                'pointer-events': state().showNextPiece ? 'auto' : 'none',
                width: state().showNextPiece ? 'auto' : '0',
                padding: state().showNextPiece ? '1rem' : '0',
                'border-width': state().showNextPiece ? '1px' : '0',
                overflow: 'hidden'
              }}
            >
              <div 
                class="font-mono text-xs opacity-70 mb-2 text-center transition-opacity duration-300 delay-100"
                style={{ opacity: state().showNextPiece ? '0.7' : '0' }}
              >
                Next
              </div>
              <div
                class="transition-all duration-400 delay-75"
                style={{
                  transform: state().showNextPiece ? 'scale(1)' : 'scale(0.5)',
                  opacity: state().showNextPiece ? '1' : '0'
                }}
              >
                <NextPiecePreview pieceType={state().nextPiece!} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mini component for next piece preview
function NextPiecePreview(props: { pieceType: string }) {
  const cellSize = 12;
  const gridSize = 4;
  
  const piece = () => createTetromino(props.pieceType as any);
  
  // Calculate bounding box of the piece to center it
  const getBounds = (shape: number[][]) => {
    let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
  };
  
  const bounds = () => getBounds(piece().shape);
  const offsetX = () => Math.floor((gridSize - bounds().width) / 2) - bounds().minX;
  const offsetY = () => Math.floor((gridSize - bounds().height) / 2) - bounds().minY;
  
  return (
    <div class="relative" style={{ width: `${cellSize * gridSize}px`, height: `${cellSize * gridSize}px` }}>
      {piece().shape.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          return (
            <div
              style={{
                position: 'absolute',
                left: `${(x + offsetX()) * cellSize}px`,
                top: `${(y + offsetY()) * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                'background-color': piece().color,
                border: '1px solid rgba(0, 0, 0, 0.2)',
                'border-radius': '1px'
              }}
            />
          );
        })
      )}
    </div>
  );
}

