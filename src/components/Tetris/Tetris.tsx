/**
 * NES Tetris Implementation
 * 
 * This is a faithful recreation of NES Tetris (1989) with QWERTY keyboard controls.
 * 
 * ## Core Mechanics (NES-Accurate)
 * 
 * ### Rotation System
 * - Uses NRS (Nintendo Rotation System) - no wall kicks
 * - 4 rotation states per piece (clockwise only in original, both directions here)
 * - Rotation fails if collision detected, piece stays in current orientation
 * 
 * ### RNG System
 * - 7-value LFSR (Linear Feedback Shift Register) matching NES hardware
 * - Reroll protection: prevents same piece twice in a row
 * - Produces same distribution patterns as original game
 * 
 * ### Gravity System
 * - Level-based drop speed from NES gravity table (48 frames at level 0 → 1 frame at level 29+)
 * - Runs at 60.098 FPS (NTSC timing)
 * - Piece locks immediately on collision (no lock delay)
 * 
 * ### DAS (Delayed Auto Shift)
 * - 16-frame initial delay before auto-repeat begins
 * - 6-frame repeat rate when charged
 * - Instant movement on initial key press
 * - DAS charge preserved during line clears and piece spawns
 * 
 * ### Scoring
 * - Single: 40 × (level + 1)
 * - Double: 100 × (level + 1)
 * - Triple: 300 × (level + 1)
 * - Tetris: 1200 × (level + 1)
 * - Soft drop: +1 per cell dropped
 * 
 * ### Level Progression
 * - Standard: Level up every 10 lines after (start_level × 10 + 10) threshold
 * - High starts (≥10): Level up every 10 lines after max(100, start_level × 10 - 50) threshold
 * 
 * ## QWERTY Modifications
 * 
 * ### Controls (Multiple Keys Per Action)
 * - **Move Left**: Arrow Left, A
 * - **Move Right**: Arrow Right, D
 * - **Soft Drop**: Arrow Down, S (0.1× gravity speed, 10× faster)
 * - **Rotate CW**: K, X
 * - **Rotate CCW**: J, Z (added feature, not in NES)
 * - **Pause**: Enter, P
 * - **Restart**: R
 * - **Toggle Next Preview**: N (added feature)
 * 
 * ### Deviations from NES
 * - Counter-clockwise rotation added (J/Z keys)
 * - Next piece preview can be toggled (NES always shows it)
 * - Soft drop significantly faster (0.1× vs 0.5× gravity) for better UX
 * - Keyboard-optimized for QWERTY layout vs NES D-pad + A/B buttons
 * - Canvas rendering instead of sprite-based (maintains visual accuracy)
 * 
 * ## Visual Features
 * - 10×20 visible playfield (2 hidden spawn rows above)
 * - Ghost piece shows drop location
 * - Color-matched borders (40% darker than piece color)
 * - Glass morphism aesthetic matching site design
 * - Dark/light mode support
 * 
 * ## Particle Integration
 * - Particle count increases with score: baseCount + floor(score / 10)
 * - Creates visual chaos effect as gameplay intensifies
 * - Particles persist across game restarts
 */

import { TetrisGame } from './TetrisGame';

export const Tetris = () => {
  return (
    <div class="tetris-container">
      <TetrisGame />
    </div>
  );
};

