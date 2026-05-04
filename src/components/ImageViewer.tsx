import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface ViewerState {
  src: string;
  alt: string;
  caption?: string;
}

const TRIGGER_SELECTOR = "img[data-image-viewer-trigger='true']";
const MIN_SCALE = 0.75;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

const controlButtonClass =
  "cursor-pointer rounded-md border border-shark-950/15 px-2 py-1 text-shark-700 transition-colors hover:bg-shark-950/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-ivory/15 dark:text-shark-200 dark:hover:bg-ivory/10";

function clampScale(nextScale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(nextScale.toFixed(2))));
}

function getTriggerFromTarget(target: EventTarget | null): HTMLImageElement | null {
  if (!(target instanceof Element)) return null;

  const trigger = target.closest(TRIGGER_SELECTOR);
  return trigger instanceof HTMLImageElement ? trigger : null;
}

function getTriggerFromActiveElement(): HTMLImageElement | null {
  if (typeof document === "undefined") return null;
  return getTriggerFromTarget(document.activeElement);
}

function extractViewerState(image: HTMLImageElement): ViewerState | null {
  const src = image.currentSrc || image.src;
  if (!src) return null;

  const alt = image.dataset.imageViewerAlt ?? image.alt ?? "";
  const caption = image.dataset.imageViewerCaption?.trim() || undefined;

  return { src, alt, caption };
}

export default function ImageViewer() {
  const [viewerState, setViewerState] = createSignal<ViewerState | null>(null);
  const [isOpen, setIsOpen] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);
  const [zoom, setZoom] = createSignal(1);

  let openerRef: HTMLElement | null = null;
  let closeButtonRef: HTMLButtonElement | undefined;
  let closeTimeoutId: number | undefined;

  const clearCloseTimeout = () => {
    if (closeTimeoutId === undefined) return;
    window.clearTimeout(closeTimeoutId);
    closeTimeoutId = undefined;
  };

  const openFromImage = (image: HTMLImageElement) => {
    const nextState = extractViewerState(image);
    if (!nextState) return;

    openerRef = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    clearCloseTimeout();
    setViewerState(nextState);
    setZoom(1);
    setIsOpen(true);
    requestAnimationFrame(() => setIsVisible(true));
  };

  const closeViewer = () => {
    if (!isOpen()) return;

    setIsVisible(false);
    clearCloseTimeout();
    closeTimeoutId = window.setTimeout(() => {
      setIsOpen(false);
      setViewerState(null);
      setZoom(1);
      openerRef?.focus();
      openerRef = null;
      closeTimeoutId = undefined;
    }, 200);
  };

  const increaseZoom = () => {
    setZoom((current) => clampScale(current + SCALE_STEP));
  };

  const decreaseZoom = () => {
    setZoom((current) => clampScale(current - SCALE_STEP));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const zoomPercent = () => `${Math.round(zoom() * 100)}%`;

  onMount(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const trigger = getTriggerFromTarget(event.target);
      if (!trigger) return;

      event.preventDefault();
      openFromImage(trigger);
    };

    const handleDocumentKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen()) {
        event.preventDefault();
        closeViewer();
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") return;

      const trigger = getTriggerFromActiveElement();
      if (!trigger) return;

      event.preventDefault();
      openFromImage(trigger);
    };

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);

    onCleanup(() => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
      clearCloseTimeout();
    });
  });

  createEffect(() => {
    if (typeof document === "undefined") return;
    if (!isOpen()) return;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    onCleanup(() => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    });
  });

  createEffect(() => {
    if (!isOpen()) return;
    requestAnimationFrame(() => closeButtonRef?.focus());
  });

  return (
    <Show when={isOpen()}>
      <Show when={viewerState()}>
        {(state) => (
          <Portal>
            <div
              class="fixed inset-0 z-[10000] transition-opacity duration-200 ease-out"
              style={{ opacity: isVisible() ? "1" : "0" }}
              role="dialog"
              aria-modal="true"
              aria-label="Image viewer"
            >
              <button
                type="button"
                class="absolute inset-0 h-full w-full cursor-default bg-shark-950/75 backdrop-blur-md"
                aria-label="Close image viewer"
                onClick={closeViewer}
              />
              <div class="pointer-events-none relative z-10 flex h-dvh w-full items-center justify-center p-md md:p-xl">
                <section class="pointer-events-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-shark-950/10 bg-ivory/90 shadow-2xl backdrop-blur-xl dark:border-ivory/10 dark:bg-shark-950/90">
                  <header class="border-b border-shark-950/10 px-md py-sm dark:border-ivory/10 md:px-lg">
                    <div class="flex justify-end gap-xs font-mono text-xs">
                      <button
                        type="button"
                        class={controlButtonClass}
                        onClick={decreaseZoom}
                        disabled={zoom() <= MIN_SCALE}
                        aria-label="Zoom out"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        class={controlButtonClass}
                        onClick={resetZoom}
                        aria-label="Reset zoom"
                      >
                        {zoomPercent()}
                      </button>
                      <button
                        type="button"
                        class={controlButtonClass}
                        onClick={increaseZoom}
                        disabled={zoom() >= MAX_SCALE}
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                      <button
                        ref={(element) => {
                          closeButtonRef = element;
                        }}
                        type="button"
                        class={controlButtonClass}
                        onClick={closeViewer}
                        aria-label="Close image viewer"
                      >
                        x
                      </button>
                    </div>
                  </header>

                  <div class="relative flex-1 overflow-auto bg-ivory/70 p-md dark:bg-shark-950/70 md:p-xl">
                    <div class="flex min-h-full items-center justify-center">
                      <img
                        src={state().src}
                        alt={state().alt}
                        class="max-h-full max-w-full select-none rounded-lg object-contain shadow-xl transition-transform duration-150 ease-out"
                        style={{
                          transform: `scale(${zoom()})`,
                          "transform-origin": "center center",
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>
                  <Show when={state().caption}>
                    <p class="border-t border-shark-950/10 px-md pt-md text-sm leading-snug break-words text-shark-700 dark:border-ivory/10 dark:text-shark-200 md:px-lg">
                      {state().caption}
                    </p>
                  </Show>
                </section>
              </div>
            </div>
          </Portal>
        )}
      </Show>
    </Show>
  );
}
