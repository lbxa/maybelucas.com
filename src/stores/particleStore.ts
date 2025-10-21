import { atom } from 'nanostores';
import { $C } from '@/utils';

// Helper function to get initial particle count from localStorage or default
function getInitialParticleCount(): number {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tetrisParticleCount');
    if (stored) {
      const count = parseInt(stored, 10);
      // Validate the stored value is within bounds
      if (!isNaN(count) && count >= $C.MIN_PARTICLES && count <= $C.MAX_PARTICLES) {
        return count;
      }
    }
  }
  return $C.MIN_PARTICLES;
}

// Create an atom for particle count with initial value from localStorage
export const particleCount = atom<number>(getInitialParticleCount());

// Helper function to set particle count and persist to localStorage
export function setParticleCount(count: number) {
  // Validate bounds
  const clampedCount = Math.max($C.MIN_PARTICLES, Math.min($C.MAX_PARTICLES, count));
  particleCount.set(clampedCount);
  
  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('tetrisParticleCount', clampedCount.toString());
  }
}

// Helper function to get current particle count
export function getParticleCount(): number {
  return particleCount.get();
}

// Update particles based on cumulative high score
export function updateParticlesFromScore(cumulativeHighScore: number) {
  const baseCount = $C.MIN_PARTICLES;
  const scoreBasedCount = baseCount + Math.floor(cumulativeHighScore / 10);
  setParticleCount(scoreBasedCount);
} 