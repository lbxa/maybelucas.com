import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';
import type { PlaygroundColorTheme, PlaygroundSettings } from './MobiusStrip';

const PLAYGROUND_EVENT_NAME = 'mobius:playground-update';

type SliderKey =
  | 'roughness'
  | 'clearcoat'
  | 'iridescence'
  | 'envMapIntensity'
  | 'exposure'
  | 'shimmerAmplitude'
  | 'shimmerFrequency'
  | 'tintTemperature';

interface SliderConfig {
  key: SliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

const materialSliderConfigs: SliderConfig[] = [
  { key: 'roughness', label: 'Roughness', min: 0.02, max: 0.8, step: 0.01 },
  { key: 'clearcoat', label: 'Clearcoat', min: 0, max: 1, step: 0.01 },
  { key: 'iridescence', label: 'Iridescence', min: 0, max: 1, step: 0.01 },
];

const themeSwatches: Array<{ id: PlaygroundColorTheme; label: string; swatchClass: string }> = [
  { id: 'default', label: 'Default', swatchClass: 'bg-gradient-to-br from-slate-300 to-slate-500' },
  { id: 'cool', label: 'Cool', swatchClass: 'bg-gradient-to-br from-blue-300 to-cyan-500' },
  { id: 'violet', label: 'Violet', swatchClass: 'bg-gradient-to-br from-violet-300 to-fuchsia-500' },
];

const defaultPlaygroundValues = {
  roughness: 0.2,
  clearcoat: 0.66,
  iridescence: 0.5,
  envMapIntensity: 1.25,
  exposure: 1.06,
  shimmerAmplitude: 0.085,
  shimmerFrequency: 0.55,
  tintTemperature: 0,
  colorTheme: 'default' as PlaygroundColorTheme,
  highContrast: false,
};

const lightingSliderConfigs: SliderConfig[] = [
  { key: 'exposure', label: 'Exposure', min: 0.55, max: 1.8, step: 0.01 },
  { key: 'envMapIntensity', label: 'Env Intensity', min: 0.4, max: 2.4, step: 0.01 },
  { key: 'shimmerAmplitude', label: 'Shimmer Amount', min: 0, max: 0.25, step: 0.005 },
  { key: 'shimmerFrequency', label: 'Shimmer Speed', min: 0.15, max: 2.2, step: 0.01 },
  { key: 'tintTemperature', label: 'Temperature', min: -1, max: 1, step: 0.01 },
];

export const MobiusPlaygroundControls = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [roughness, setRoughness] = createSignal(defaultPlaygroundValues.roughness);
  const [clearcoat, setClearcoat] = createSignal(defaultPlaygroundValues.clearcoat);
  const [envMapIntensity, setEnvMapIntensity] = createSignal(defaultPlaygroundValues.envMapIntensity);
  const [iridescence, setIridescence] = createSignal(defaultPlaygroundValues.iridescence);
  const [colorTheme, setColorTheme] = createSignal<PlaygroundColorTheme>(defaultPlaygroundValues.colorTheme);
  const [exposure, setExposure] = createSignal(defaultPlaygroundValues.exposure);
  const [shimmerAmplitude, setShimmerAmplitude] = createSignal(defaultPlaygroundValues.shimmerAmplitude);
  const [shimmerFrequency, setShimmerFrequency] = createSignal(defaultPlaygroundValues.shimmerFrequency);
  const [tintTemperature, setTintTemperature] = createSignal(defaultPlaygroundValues.tintTemperature);
  const [highContrast, setHighContrast] = createSignal(defaultPlaygroundValues.highContrast);

  let pendingSettings: PlaygroundSettings | null = null;
  let dispatchFrame = 0;

  const applyDefaults = () => {
    if (dispatchFrame !== 0) {
      window.cancelAnimationFrame(dispatchFrame);
      dispatchFrame = 0;
    }
    pendingSettings = null;

    setRoughness(defaultPlaygroundValues.roughness);
    setClearcoat(defaultPlaygroundValues.clearcoat);
    setIridescence(defaultPlaygroundValues.iridescence);
    setEnvMapIntensity(defaultPlaygroundValues.envMapIntensity);
    setExposure(defaultPlaygroundValues.exposure);
    setShimmerAmplitude(defaultPlaygroundValues.shimmerAmplitude);
    setShimmerFrequency(defaultPlaygroundValues.shimmerFrequency);
    setTintTemperature(defaultPlaygroundValues.tintTemperature);
    setColorTheme(defaultPlaygroundValues.colorTheme);
    setHighContrast(defaultPlaygroundValues.highContrast);

    scheduleDispatch(defaultPlaygroundValues);
  };

  const scheduleDispatch = (settingsPatch: PlaygroundSettings) => {
    pendingSettings = { ...(pendingSettings ?? {}), ...settingsPatch };
    if (dispatchFrame !== 0) {
      return;
    }

    dispatchFrame = window.requestAnimationFrame(() => {
      dispatchFrame = 0;
      if (!pendingSettings) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent<PlaygroundSettings>(PLAYGROUND_EVENT_NAME, {
          detail: pendingSettings,
        }),
      );
      pendingSettings = null;
    });
  };

  onMount(() => {
    const pendingFrames: number[] = [];
    const pendingTimeouts: number[] = [];
    setIsOpen(window.innerWidth >= 768);
    applyDefaults();
    pendingFrames.push(window.requestAnimationFrame(() => {
      applyDefaults();
      pendingFrames.push(window.requestAnimationFrame(() => applyDefaults()));
    }));
    pendingTimeouts.push(window.setTimeout(() => applyDefaults(), 300));
    pendingTimeouts.push(window.setTimeout(() => applyDefaults(), 700));

    const handlePageShow = () => {
      applyDefaults();
    };
    window.addEventListener('pageshow', handlePageShow);

    onCleanup(() => {
      for (const frame of pendingFrames) {
        window.cancelAnimationFrame(frame);
      }
      for (const timeoutId of pendingTimeouts) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('pageshow', handlePageShow);
    });
  });

  onCleanup(() => {
    if (dispatchFrame !== 0) {
      window.cancelAnimationFrame(dispatchFrame);
    }
  });

  const sliderValues = () => ({
    roughness: roughness(),
    clearcoat: clearcoat(),
    envMapIntensity: envMapIntensity(),
    iridescence: iridescence(),
    exposure: exposure(),
    shimmerAmplitude: shimmerAmplitude(),
    shimmerFrequency: shimmerFrequency(),
    tintTemperature: tintTemperature(),
  });

  const updateSlider = (key: SliderKey) => (
    event: InputEvent & { currentTarget: HTMLInputElement },
  ) => {
    const nextValue = Number(event.currentTarget.value);
    if (key === 'roughness') setRoughness(nextValue);
    if (key === 'clearcoat') setClearcoat(nextValue);
    if (key === 'envMapIntensity') setEnvMapIntensity(nextValue);
    if (key === 'iridescence') setIridescence(nextValue);
    if (key === 'exposure') setExposure(nextValue);
    if (key === 'shimmerAmplitude') setShimmerAmplitude(nextValue);
    if (key === 'shimmerFrequency') setShimmerFrequency(nextValue);
    if (key === 'tintTemperature') setTintTemperature(nextValue);
    scheduleDispatch({ [key]: nextValue });
  };

  const selectTheme = (theme: PlaygroundColorTheme) => {
    setColorTheme(theme);
    scheduleDispatch({ colorTheme: theme });
  };

  const toggleHighContrast = () => {
    const nextValue = !highContrast();
    setHighContrast(nextValue);
    scheduleDispatch({ highContrast: nextValue });
  };

  return (
    <aside class="pointer-events-none fixed left-1/2 top-20 z-30 flex w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-end sm:top-24 md:w-[100vw] md:max-w-[42rem]">
      <button
        type="button"
        class="pointer-events-auto mb-2 inline-flex items-center gap-2 rounded-full border border-shark-950/10 bg-ivory/75 px-3 py-1.5 text-xs font-medium text-shark-800 shadow-sm backdrop-blur-md transition-colors hover:bg-ivory/85 dark:border-ivory/15 dark:bg-shark-950/75 dark:text-ivory dark:hover:bg-shark-950/85"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen()}
        aria-controls="mobius-playground-panel"
      >
        Playground
      </button>

      <Show when={isOpen()}>
        <section
          id="mobius-playground-panel"
          class="pointer-events-auto w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100dvh-7.5rem)] overflow-y-auto rounded-2xl border border-shark-950/10 bg-ivory/70 p-3 shadow-lg backdrop-blur-md dark:border-ivory/10 dark:bg-shark-950/70 sm:max-h-none sm:overflow-visible"
        >
          <div class="mb-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-shark-700/85 dark:text-shark-200/85">
              Material shine
            </p>
            <div class="mt-2 space-y-2.5">
              <For each={materialSliderConfigs}>
                {(slider) => (
                  <label class="block">
                    <span class="mb-1 block text-xs text-shark-700 dark:text-shark-200">{slider.label}</span>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={sliderValues()[slider.key]}
                      onInput={updateSlider(slider.key)}
                      class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-shark-950/15 accent-shark-900 dark:bg-ivory/15 dark:accent-ivory"
                    />
                  </label>
                )}
              </For>
            </div>
          </div>

          <div class="mb-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-shark-700/85 dark:text-shark-200/85">
              Lighting
            </p>
            <div class="mt-2 space-y-2.5">
              <For each={lightingSliderConfigs}>
                {(slider) => (
                  <label class="block">
                    <span class="mb-1 block text-xs text-shark-700 dark:text-shark-200">{slider.label}</span>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={sliderValues()[slider.key]}
                      onInput={updateSlider(slider.key)}
                      class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-shark-950/15 accent-shark-900 dark:bg-ivory/15 dark:accent-ivory"
                    />
                  </label>
                )}
              </For>
            </div>
            <button
              type="button"
              onClick={toggleHighContrast}
              class={`mt-3 w-full rounded-md border px-2 py-1.5 text-xs transition-colors ${
                highContrast()
                  ? 'border-shark-950/70 bg-shark-950/10 text-shark-900 dark:border-ivory/70 dark:bg-ivory/15 dark:text-ivory'
                  : 'border-shark-950/15 bg-ivory/50 text-shark-700 dark:border-ivory/20 dark:bg-shark-950/50 dark:text-shark-200'
              }`}
              aria-pressed={highContrast()}
            >
              High Contrast {highContrast() ? 'On' : 'Off'}
            </button>
          </div>

          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-shark-700/85 dark:text-shark-200/85">
              Color theme
            </p>
            <div class="mt-2 grid grid-cols-3 gap-2">
              <For each={themeSwatches}>
                {(theme) => (
                  <button
                    type="button"
                    onClick={() => selectTheme(theme.id)}
                    class={`rounded-md border p-2 transition-colors ${
                      colorTheme() === theme.id
                        ? 'border-shark-950/70 dark:border-ivory/70'
                        : 'border-shark-950/15 dark:border-ivory/20'
                    }`}
                    aria-label={`Set ${theme.label} theme`}
                  >
                    <span class={`block h-6 rounded ${theme.swatchClass}`}></span>
                    <span class="mt-1 block text-[10px] text-shark-700 dark:text-shark-200">{theme.label}</span>
                  </button>
                )}
              </For>
            </div>
          </div>
        </section>
      </Show>
    </aside>
  );
};
