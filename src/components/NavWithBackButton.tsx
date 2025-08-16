import { createSignal, onMount, onCleanup } from "solid-js";

export default function NavWithBackButton() {
  const [isScrolled, setIsScrolled] = createSignal(false);

  onMount(() => {
    if (typeof document === 'undefined') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);

    onCleanup(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  });

  const handleBack = () => {
    window.history.back();
  };

  return (
    <nav class="flex gap-md items-center relative">
      <div class={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center transition-all duration-300 ease-out transform ${isScrolled() ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} pointer-events-${isScrolled() ? 'auto' : 'none'}`}>
        <button
          onClick={handleBack}
          class="font-mono text-sm text-gray-700 dark:text-gray-400 hover:underline"
          aria-label="Go back"
        >
          ← Back
        </button>
        <span class="mx-md">|</span>
      </div>
      <div class={`flex gap-md transition-all duration-300 ${isScrolled() ? 'ml-20' : 'ml-0'}`}>
        <a href="/" class="font-mono hover:underline no-underline">Home</a>
        <a href="/posts" class="font-mono hover:underline underline">Posts</a>
        <a href="/about" class="font-mono hover:underline no-underline">About</a>
      </div>
    </nav>
  );
}