import { createMemo, createResource, createSignal, createEffect, onMount } from "solid-js";
import { useStore } from "@nanostores/solid";
import { fetchVisitorCount } from "./fetch-visitor-count";
import { $C } from "@/utils";
import { particleCount, setParticleCount, initializeWithVisitorCount } from "@/stores/particleStore";
import "./particle-slider.css"

export const ParticleSlider = () => {
  const [visitorCount] = createResource(fetchVisitorCount);
  
  // Use the Nano Store for particle count
  const count = useStore(particleCount);
  const [visible, setVisible] = createSignal(true);
  
  // Initialize with visitor count only if no user preference exists
  createMemo(() => {
    const currentCount = visitorCount();
    if (currentCount !== undefined && !visitorCount.error) {
      initializeWithVisitorCount(currentCount);
    }
  });

  // Ensure slider input stays in sync with store after navigation
  createEffect(() => {
    if (typeof document !== 'undefined') {
      const slider = document.getElementById('particle-density-slider') as HTMLInputElement;
      if (slider && slider.value !== count().toString()) {
        slider.value = count().toString();
      }
    }
  });

  // Force sync on mount to handle ViewTransitions navigation
  onMount(() => {
    if (typeof document !== 'undefined') {
      const syncSlider = () => {
        const slider = document.getElementById('particle-density-slider') as HTMLInputElement;
        if (slider) {
          slider.value = count().toString();
        }
      };
      
      // Sync immediately
      syncSlider();
      
      // Also sync on ViewTransitions navigation
      document.addEventListener('astro:page-load', syncSlider);
      
      // Cleanup
      return () => {
        document.removeEventListener('astro:page-load', syncSlider);
      };
    }
  });

  const bg = createMemo(() => ({
    "bg-red-400/50 dark:bg-red-900/50": count() === $C.MAX_PARTICLES,
    "bg-ivory/50 dark:bg-shark-950/50": count() !== $C.MAX_PARTICLES
  }))

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const currentValue = Number(target.value);
    const maxValue = Number(target.max);

    setVisible(true);
    setParticleCount(currentValue); 

    if (currentValue === maxValue) {
      target?.classList.add("animate-shake");

      target?.addEventListener("animationend", () => {
          target?.classList.remove("animate-shake");
      }, { once: true });
    }
  };
  
  return (
    <div 
      class="z-50 fixed flex items-center w-3/4 max-w-[300px] backdrop-blur-sm py-md px-lg 
             rounded-full bottom-xl left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      classList={bg()}
    >
      <input 
        class="m-auto w-full h-full"
        type="range" 
        id="particle-density-slider" 
        name="volume" 
        min={$C.MIN_PARTICLES}
        max={$C.MAX_PARTICLES}
        value={count()}
        onInput={handleInput}
        onBlur={() => setVisible(false)}
        aria-label="Particle density slider"
      />
      {visible() && 
      <div 
        class="fixed py-md px-lg rounded-full bottom-2xl left-1/2 transform -translate-x-1/2 -translate-y-1/2
               backdrop-blur-sm font-mono"
        classList={bg()}
      >
        {count()}/{$C.MAX_PARTICLES}
      </div>}
    </div>
  )
}