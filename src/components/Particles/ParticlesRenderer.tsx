import { onMount, onCleanup } from 'solid-js';
import { MobiusStrip } from './MobiusStrip';

let mobiusStrip: MobiusStrip | null = null;

export const ParticlesRenderer = () => {
  onMount(() => {
    if (typeof document === 'undefined') return;

    const canvas = document.querySelector('#webgl') as HTMLCanvasElement;
    if (canvas) {
      mobiusStrip = new MobiusStrip(canvas);
    }
  });

  onCleanup(() => {
    if (mobiusStrip) {
      mobiusStrip.dispose();
      mobiusStrip = null;
    }
  });

  return null;
};
