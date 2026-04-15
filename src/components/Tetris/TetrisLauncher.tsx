import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Tetris } from './Tetris';

export default function TetrisLauncher() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isMobile, setIsMobile] = createSignal(false);
  const [animating, setAnimating] = createSignal(false);

  onMount(() => {
    setIsMobile('ontouchstart' in window);
  });

  createEffect(() => {
    if (typeof document === 'undefined') return;

    const shouldLockScroll = isOpen() && isMobile();
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    if (shouldLockScroll) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    }

    onCleanup(() => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    });
  });

  const open = () => {
    setIsOpen(true);
    requestAnimationFrame(() => setAnimating(true));
  };

  const close = () => {
    setAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  return (
    <>
      <button
        onClick={open}
        class="font-mono no-underline inline-flex items-center cursor-pointer"
        aria-label="Open Tetris"
      >
        <span
          class="font-semibold bg-clip-text text-transparent"
          style={{
            'background-image':
              'linear-gradient(90deg, #60a5fa 0%, #fbbf24 20%, #a78bfa 40%, #3b82f6 55%, #f97316 70%, #22c55e 85%, #ef4444 100%)',
          }}
        >
          [Tetris]
        </span>
      </button>

      <Show when={isOpen()}>
        <Portal>
          <Show
            when={isMobile()}
            fallback={<DesktopPlayer onClose={close} animating={animating()} />}
          >
            <MobilePlayer onClose={close} animating={animating()} />
          </Show>
        </Portal>
      </Show>
    </>
  );
}

function DesktopPlayer(props: { onClose: () => void; animating: boolean }) {
  return (
    <div
      class="fixed bottom-4 right-4 z-[9999] transition-all duration-300 ease-out"
      style={{
        transform: props.animating ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: props.animating ? '1' : '0',
      }}
    >
      <div class="relative rounded-xl overflow-hidden shadow-2xl border border-shark-950/10 dark:border-ivory/10 bg-ivory/90 dark:bg-shark-950/90 backdrop-blur-xl">
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-shark-950/10 dark:border-ivory/10">
          <span class="font-mono text-xs opacity-60">NES Tetris</span>
          <button
            onClick={props.onClose}
            class="font-mono text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer px-1"
            aria-label="Close Tetris"
          >
            x
          </button>
        </div>
        <div class="p-2">
          <Tetris />
        </div>
      </div>
    </div>
  );
}

function MobilePlayer(props: { onClose: () => void; animating: boolean }) {
  return (
    <div
      class="fixed inset-0 z-[9999] transition-all duration-300 ease-out"
      style={{
        transform: props.animating ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        opacity: props.animating ? '1' : '0',
      }}
    >
      <div class="h-dvh w-screen overflow-hidden border border-shark-950/10 dark:border-ivory/10 bg-ivory/90 dark:bg-shark-950/90 backdrop-blur-xl">
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-shark-950/10 dark:border-ivory/10">
          <span class="font-mono text-xs opacity-60">NES Tetris</span>
          <button
            onClick={props.onClose}
            class="font-mono text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer px-1"
            aria-label="Close Tetris"
          >
            x
          </button>
        </div>
        <div class="h-[calc(100dvh-31px)] flex items-center justify-center">
          <Tetris />
        </div>
      </div>
    </div>
  );
}
