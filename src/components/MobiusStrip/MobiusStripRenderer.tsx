import { onMount, onCleanup } from 'solid-js';
import { MobiusStrip } from './MobiusStrip';
import type { PlaygroundSettings } from './MobiusStrip';

const PLAYGROUND_EVENT_NAME = 'mobius:playground-update';

interface MobiusStripRendererProps {
  interactive?: boolean;
}

const isPlaygroundSettings = (value: unknown): value is PlaygroundSettings => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return true;
};

let mobiusStrip: MobiusStrip | null = null;

export const MobiusStripRenderer = (props: MobiusStripRendererProps) => {
  onMount(() => {
    if (typeof document === 'undefined') return;

    const handlePlaygroundUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const detail: unknown = event.detail;
      if (!mobiusStrip || !isPlaygroundSettings(detail)) {
        return;
      }

      mobiusStrip.applyPlaygroundSettings(detail);
    };

    window.addEventListener(PLAYGROUND_EVENT_NAME, handlePlaygroundUpdate);

    const canvas = document.querySelector<HTMLCanvasElement>('#webgl');
    if (canvas) {
      mobiusStrip = new MobiusStrip(canvas, { interactive: props.interactive ?? false });
    }

    onCleanup(() => {
      window.removeEventListener(PLAYGROUND_EVENT_NAME, handlePlaygroundUpdate);

      if (mobiusStrip) {
        mobiusStrip.dispose();
        mobiusStrip = null;
      }
    });
  });

  return null;
};
