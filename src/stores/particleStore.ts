import { atom } from 'nanostores';
import { $C } from '@/utils';

// Create an atom for particle count with default value
export const particleCount = atom<number>($C.MIN_PARTICLES);

// Helper function to set particle count
export function setParticleCount(count: number) {
  particleCount.set(count);
}

// Helper function to get current particle count
export function getParticleCount(): number {
  return particleCount.get();
} 