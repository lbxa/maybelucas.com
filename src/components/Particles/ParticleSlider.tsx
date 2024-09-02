import { createMemo, createSignal } from "solid-js";
import "./particle-slider.css"

const MAX_VAL = 100000
const MIN_VAL = 10

export const ParticleSlider = () => {
  const [value, setValue] = createSignal(1000);
  const [visible, setVisible] = createSignal(true);
  
  const bg = createMemo(() => ({
    "bg-red-400/50 dark:bg-red-900/50": value() === MAX_VAL,
    "bg-ivory/50 dark:bg-shark-950/50": value() !== MAX_VAL
  }))

  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const currentValue = Number(target.value);
    const maxValue = Number(target.max);

    setVisible(true);
    setValue(currentValue); 

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
        min={MIN_VAL}
        max={MAX_VAL}
        value={value()}
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
        {value()}/{MAX_VAL}
      </div>}
    </div>
  )
}