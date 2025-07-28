import { createMemo, createResource, createSignal } from "solid-js";
import { useStore } from "@nanostores/solid";
import { fetchVisitorCount } from "./fetch-visitor-count";
import { $C } from "@/utils";
import { particleCount, setParticleCount } from "@/stores/particleStore";
import "./particle-slider.css"

export const ParticleSlider = () => {
  const [visitorCount] = createResource(fetchVisitorCount);
  
  // Use the Nano Store for particle count
  const count = useStore(particleCount);
  const [visible, setVisible] = createSignal(true);
  
  createMemo(() => {
    const currentCount = visitorCount();
    if (currentCount !== undefined && !visitorCount.error) {
      setParticleCount(currentCount);
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