/** @jsxImportSource react */
import { useEffect, useRef, useState } from "react";

const TOP_LINKS = [
  { label: "Home", href: "/" },
  { label: "Posts", href: "/posts" },
];

const EXPANDED_LINKS = [
  { label: "Research", href: "/research" },
  { label: "Questions", href: "/questions" },
  { label: "Coding", href: "/coding" },
  { label: "Bookshelf", href: "/bookshelf" },
  { label: "Musings", href: "/musings" },
  { label: "Lexicon", href: "/lexicon" },
];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const REST_MAX_WIDTH = "40rem";
const SHRUNK_MAX_WIDTH = "22.625rem";

export default function NavbarReact() {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMdUp, setIsMdUp] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const openRef = useRef(false);

  const closeMenu = () => setIsOpen(false);
  const openTetris = () => {
    setIsOpen(false);
    window.dispatchEvent(new Event("open-tetris"));
  };

  const syncThemeFromDom = () => {
    const dark = document.documentElement.classList.contains("dark");
    setIsDark(dark);
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", nextDark ? "#121212" : "#f5f5f5");
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  useEffect(() => {
    openRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    syncThemeFromDom();
    setCurrentPath(window.location.pathname);
  }, []);

  useEffect(() => {
    const updateCurrentPath = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", updateCurrentPath);
    return () => {
      window.removeEventListener("popstate", updateCurrentPath);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncViewport = () => setIsMdUp(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    let prevY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - prevY;
      const absDelta = Math.abs(delta);

      setIsScrolled(y > 6);

      if (absDelta < 8) {
        prevY = y;
        ticking = false;
        return;
      }

      if (y < 100) {
        setVisible(true);
      } else if (delta > 0) {
        if (openRef.current) setIsOpen(false);
        setVisible(false);
      } else {
        setVisible(true);
      }

      prevY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const shellMaxWidth = isMdUp
    ? isScrolled && !isOpen
      ? SHRUNK_MAX_WIDTH
      : "42rem"
    : REST_MAX_WIDTH;
  const shellTransition = `max-width 600ms ${EASE}, border-color 300ms ${EASE}, background-color 300ms ${EASE}`;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ transition: `opacity 300ms ${EASE}` }}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <nav
        className="fixed top-4 left-1/2 z-50"
        style={{
          transform: visible
            ? "translate(-50%, 0)"
            : "translate(-50%, -120%)",
          opacity: visible ? 1 : 0,
          transition: `transform 400ms ${EASE}, opacity 400ms ${EASE}`,
        }}
      >
        <div
          className="w-[calc(100vw-2rem)] md:w-[100vw] rounded-2xl border border-shark-200/70 bg-ivory/70 text-shark-900 backdrop-blur-2xl saturate-[1.15] dark:border-shark-700/70 dark:bg-shark-950/70 dark:text-ivory"
          style={{
            maxWidth: shellMaxWidth,
            transition: shellTransition,
          }}
        >
          <div className="flex h-12 items-center justify-between px-4 font-mono text-sm">
            <div className="flex items-center gap-3 font-mono text-sm sm:gap-4">
              {TOP_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`no-underline transition-colors hover:text-shark-600 dark:hover:text-shark-300 ${isActive(link.href) ? "text-blue-700 dark:text-blue-300" : ""}`}
                >
                  [{link.label}]
                </a>
              ))}
              <button
                type="button"
                onClick={openTetris}
                className="cursor-pointer no-underline transition-colors hover:text-shark-600 dark:hover:text-shark-300"
                aria-label="Open Tetris"
              >
                <span
                  className="font-semibold bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--tetris-i) 0%, var(--tetris-o) 20%, var(--tetris-t) 40%, var(--tetris-j) 55%, var(--tetris-l) 70%, var(--tetris-s) 85%, var(--tetris-z) 100%)",
                  }}
                >
                  [Tetris]
                </span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative flex size-5 shrink-0 cursor-pointer items-center justify-center"
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="absolute size-5 fill-current"
                  aria-hidden="true"
                  style={{
                    transition: `opacity 300ms ${EASE}, transform 500ms ${EASE}`,
                    opacity: isOpen ? 0 : 1,
                    transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                  }}
                >
                  <path d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z" />
                </svg>
                <span
                  className="absolute text-xl leading-none"
                  style={{
                    transition: `opacity 300ms ${EASE}, transform 500ms ${EASE}`,
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "rotate(0)" : "rotate(-90deg)",
                  }}
                >
                  ×
                </span>
              </button>
            </div>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateRows: isOpen ? "1fr" : "0fr",
              transition: `grid-template-rows 600ms ${EASE}`,
            }}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className="px-4 pb-4 md:pt-0"
                style={{
                  opacity: isOpen ? 1 : 0,
                  transition: isOpen
                    ? `opacity 400ms ${EASE} 150ms`
                    : `opacity 200ms ${EASE}`,
                }}
              >
                <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
                  <div className="flex flex-col gap-4 md:gap-1.5 font-mono">
                    {EXPANDED_LINKS.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={`cursor-pointer text-sm tracking-tight no-underline transition-colors hover:text-shark-600 dark:hover:text-shark-300 ${isActive(link.href) ? "text-blue-700 dark:text-blue-300" : ""}`}
                      >
                        [{link.label}]
                      </a>
                    ))}
                  </div>

                  <div className="border-t border-shark-300/80 dark:border-shark-700/70 md:hidden" />

                  <div className="relative overflow-hidden">
                    <div className="mb-2 text-xs uppercase tracking-[0.14em] text-shark-500 dark:text-shark-400 font-mono">
                      Featured post
                    </div>
                    <a
                      href="/posts/and"
                      onClick={closeMenu}
                      className="group block rounded-xl border border-shark-300/70 bg-ivory/40 p-4 no-underline transition-colors hover:border-shark-400 hover:bg-ivory/60 dark:border-shark-700/70 dark:bg-shark-900/20 dark:hover:border-shark-500 dark:hover:bg-shark-900/40"
                    >
                      <div className="flex items-center gap-1.5 text-lg font-semibold tracking-tight text-shark-900 transition-colors group-hover:text-shark-600 dark:text-ivory dark:group-hover:text-shark-300">
                        <span>And</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          className="size-4 stroke-current"
                          fill="none"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 17 17 7" />
                          <path d="M8 7h9v9" />
                        </svg>
                      </div>
                      <p className="mt-2 !mb-0 text-sm leading-relaxed text-shark-600 dark:text-shark-300">
                        One quiet enemy of great work is our habit of treating things
                        as mutually exclusive.
                      </p>
                    </a>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-shark-600 dark:text-shark-300 font-serif">
                  <span className="italic">
                    Toward escape velocity {new Date().getFullYear()}
                  </span>
                  <button
                    id="themeToggle"
                    type="button"
                    role="switch"
                    aria-checked={isDark}
                    data-state={isDark ? "checked" : "unchecked"}
                    onClick={toggleTheme}
                    aria-label="Toggle dark mode"
                    className="relative inline-flex h-6 w-10 items-center rounded-full border border-shark-300/80 bg-ivory/80 px-[2px] transition-colors duration-300 dark:border-shark-600/80 dark:bg-shark-900 data-[state=checked]:border-shark-600 data-[state=checked]:bg-shark-950"
                  >
                    <span className="sr-only">Toggle dark mode</span>
                    <span
                      data-state={isDark ? "checked" : "unchecked"}
                      className="inline-block h-4 w-4 translate-x-0 rounded-full bg-shark-950 transition-transform duration-300 ease-in-out data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-ivory"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
