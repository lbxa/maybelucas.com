import { onMount, onCleanup } from 'solid-js';
import type { MobiusStrip, PlaygroundSettings } from './MobiusStrip';

const PLAYGROUND_EVENT_NAME = 'mobius:playground-update';

interface MobiusStripRendererProps {
  canvasId: string;
  interactive?: boolean;
  inline?: boolean;
}

const isPlaygroundSettings = (value: unknown): value is PlaygroundSettings => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return true;
};

export const MobiusStripRenderer = (props: MobiusStripRendererProps) => {
  onMount(() => {
    if (typeof document === 'undefined') return;

    const canvas = document.getElementById(props.canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const root = canvas.closest<HTMLElement>('[data-mobius-root]');
    const status = root?.querySelector<HTMLElement>('[data-mobius-status]');
    let mobiusStrip: MobiusStrip | null = null;
    let viewportObserver: IntersectionObserver | null = null;
    let isDisposed = false;
    let loadPromise: Promise<void> | null = null;

    const setState = (state: 'loading' | 'ready' | 'error', message: string) => {
      if (root) root.dataset.state = state;
      if (status) status.textContent = message;
    };

    const load = (): Promise<void> => {
      if (loadPromise) return loadPromise;

      setState('loading', 'Loading Möbius strip…');
      loadPromise = import('./MobiusStrip')
        .then(({ MobiusStrip: MobiusStripClass }) => {
          if (isDisposed) return;

          mobiusStrip = new MobiusStripClass(canvas, {
            interactive: props.interactive ?? false,
            inline: props.inline ?? false,
          });
          setState('ready', 'Möbius strip ready');
        })
        .catch((error: unknown) => {
          if (isDisposed) return;
          console.error('Unable to load the Möbius strip', error);
          setState('error', 'The Möbius strip could not be loaded.');
        });

      return loadPromise;
    };

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

    if (props.inline && 'IntersectionObserver' in window) {
      viewportObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          viewportObserver?.disconnect();
          viewportObserver = null;
          void load();
        },
        { rootMargin: '160px 0px' },
      );
      viewportObserver.observe(canvas);
    } else {
      void load();
    }

    onCleanup(() => {
      isDisposed = true;
      window.removeEventListener(PLAYGROUND_EVENT_NAME, handlePlaygroundUpdate);
      viewportObserver?.disconnect();

      if (mobiusStrip) {
        mobiusStrip.dispose();
        mobiusStrip = null;
      }
    });
  });

  return null;
};
