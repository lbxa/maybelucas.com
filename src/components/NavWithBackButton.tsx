import { createSignal, onMount, onCleanup } from "solid-js";

export default function NavWithBackButton() {
  const [isScrolled, setIsScrolled] = createSignal(false);
  const [currentPath, setCurrentPath] = createSignal("");

  onMount(() => {
    if (typeof document === 'undefined') return;

    setCurrentPath(window.location.pathname);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);

    onCleanup(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  });

  const isActive = (href: string) => {
    const path = currentPath();
    return path === href || path.startsWith(href + "/");
  };

  type MiniNavLinkProps = { href: string; label: string };

  function MiniNavLink(props: MiniNavLinkProps) {
    const isExternal = props.href.startsWith("http") || props.href.startsWith("https");
    
    return (
      <a
        href={props.href}
        target={isExternal ? "_blank" : undefined}
        class={`font-mono no-underline inline-flex items-center ${isActive(props.href) ? 'text-blue-700 dark:text-blue-300 transition-colors duration-200' : ''}`}
      >
        {"["}<span>{props.label}</span>
        {isExternal && (
          <svg
            class="h-3 w-3 inline-block ml-1 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        )}
        {"]"}
      </a>
    );
  }

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
        <MiniNavLink href="/" label="Home" />
        <MiniNavLink href="/posts" label="Posts" />
        <div class="hidden md:block">
          <MiniNavLink href="https://vla.lbxa.net" label="VLA-RLX" />
        </div>
        <MiniNavLink href="/about" label="About" />
      </div>
    </nav>
  );
}