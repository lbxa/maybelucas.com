# AGENTS.md

Source of truth for coding agents working in this repository. `CLAUDE.md` points here — put new guidance in this file, not there.

## Commands

Package manager is **bun** (`bun@1.2.19`), Node >= 22 (`.nvmrc`: 22.9.0). Bun is not provided by nvm — install separately (`curl -fsSL https://bun.sh/install | bash`).

```bash
bun dev                  # dev server on http://127.0.0.1:4321 (strict port, no env vars needed)
bun run build            # astro check (typecheck) THEN astro build -> dist/
bunx astro check         # typecheck only, without a full build
bun run preview          # serve the built dist/
bun run wrangler:dev     # astro build + wrangler dev (Cloudflare runtime locally)
bun run wrangler:deploy  # astro build + wrangler deploy
bun run gen-thumbhash <path-to-image>   # prints ThumbHash hex for <Image thumbhash={...}>
```

**There is no test framework, linter, or formatter configured.** `astro check` is the only automated gate — treat a clean typecheck as the verification step. It currently passes with 0 errors and 0 warnings (a handful of unused-variable hints are pre-existing). `bun run build` is the standard post-edit check (the `publish-problem-of-day` skill mandates it). Report pre-existing warnings separately from new errors.

## Architecture

Personal site/blog: **Astro 5** static site, content in MDX, interactive islands in **SolidJS / React / Svelte**, styled with **Tailwind**, deployed to **Cloudflare Workers static assets**.

### Static-only build — no adapter

`astro.config.ts` has **no `adapter` and no `output` key**, so Astro defaults to a fully static build. `@astrojs/cloudflare` is still a dependency but is not wired in (the adapter was removed in commit `0ed2706`). `wrangler.jsonc` serves `./dist` as static assets (`not_found_handling: "404-page"`) across three custom domains (`maybelucas.com`, `lucasbarbosa.net`, `lbxa.net`). Consequence: **SSR-only patterns do not work** — everything must resolve at build time. `public/.assetsignore` excludes `_worker.js` / `_routes.json` from asset upload.

Cloudflare Workers static assets reject any single file larger than **25 MiB**, which is a real constraint for the 3D models under `public/models/`.

### Framework selection is by filename — critical

| File pattern | Compiles as |
|---|---|
| `*.tsx` | **SolidJS** (default; `tsconfig.json` sets `jsxImportSource: "solid-js"`) |
| `*.solid.tsx` | SolidJS (explicit) |
| `*.react.tsx` | **React** — also needs a `/** @jsxImportSource react */` pragma at the top of the file |
| `*.svelte` | Svelte |

Configured via `include`/`exclude` on the `solidJs()` and `react()` integrations in `astro.config.ts`. A plain `.tsx` file using React hooks will fail in non-obvious ways. Most islands here are Solid (`ImageViewer`, `Tetris/*`, `MobiusStripRenderer`, `GitHubLineChanges`); `Navbar.react.tsx` is the lone React component; `NyuBudgetModel.svelte` is the lone Svelte one.

### Layout chain

`RootLayout.astro` → `ContentLayout.astro` → page. Nearly every page goes through `ContentLayout` (blurred fixed overlay + `max-w-screen-sm` prose column + `Footer`). `RootLayout` owns the `<html>` shell, `<Seo>`, JSON-LD, font preloads, CDN-loaded KaTeX CSS, and three persistent islands mounted once for the whole site:

- `Navbar.react` (`client:only="react"`), `TetrisLauncher` and `ImageViewer` (`client:load`) — all with `transition:persist`.

**Exception:** `src/pages/nyc.astro` deliberately bypasses both layouts with its own `<html>` document and inline `@tailwind` directives. Don't "fix" it to use `RootLayout`.

### View transitions change the rules for client-side JS

`<ClientRouter />` is enabled site-wide, so the document is swapped rather than reloaded:

- DOM enhancements must bind to **`astro:page-load`**, not `DOMContentLoaded` (see the code-block copy-button script in `RootLayout.astro`).
- Long-lived components must tear down on **`astro:before-swap`** or they leak across navigations — the 3D viewers dispose their WebGL context there.
- Theme state is carried across swaps by an `astro:before-swap` handler that re-applies `.dark` and `.is-mobile` to the incoming `<html>` and updates `<meta name="theme-color">`.
- Dark mode is set by a blocking `is:inline` script in `<head>` (reads `localStorage.theme`, falls back to `prefers-color-scheme`) specifically to avoid a flash — keep it inline and synchronous.

### Content collections

Defined in `src/content.config.ts` with glob loaders over `src/content/<name>`. Only **`blog`** (`title`, `author`, `description`, `date`) and **`problems`** (`title`, `description`, `date`, `source` URL, `topic`, `difficulty` 1–10, `estimatedTime`) have Zod schemas; `about`, `research`, `questions`, `bookshelf`, `coding` are schema-less.

- `problems` uses pattern `**/[^_]*.{md,mdx}` so `_template.mdx` is excluded — underscore-prefixed files are drafts/templates.
- The entry `id` (filename slug) drives routing: `writing/[slug].astro` and `problems/[slug].astro` use `getStaticPaths()` + `getEntry()`. The writing pages read the `blog` collection; `public/_redirects` permanently redirects legacy `/posts` URLs to `/writing` on Cloudflare Workers static assets.
- Singleton pages pull specific entries by id, e.g. `index.astro` renders the `about`/`bio-intro` and `about`/`publications` entries. Editing site copy usually means editing MDX in `src/content/about/`, not the `.astro` page. **The homepage body — including which 3D models appear and in what order — lives in `src/content/about/bio-intro.mdx`.**

### MDX pipeline

Configured on the `mdx()` integration: `remark-math` + `rehype-katex` for LaTeX, plus a **custom local plugin** `src/lib/rehypeNoOrphanMathPunctuation.ts` (prevents punctuation from wrapping away from inline math). `remark-toc` generates a table of contents from a heading literally named **`contents`** (maxDepth 3, unordered, tight). `rehype-external-links` forces `target="_blank"` + `noopener noreferrer`. Syntax highlighting is Shiki with paired `light-plus`/`dark-plus` themes.

### Styling

Tailwind with `darkMode: "selector"` (driven by `html.dark`). `tailwind.config.ts` extends:

- Colors: `shark` (50–950 greys, `950` = `#121212`) and `ivory` (`#f5f5f5`) — the site's light/dark base pair.
- **Named spacing steps `xs`/`sm`/`md`/`lg`/`xl`/`2xl`/`3xl` (0.25rem → 3rem)** added alongside Tailwind's numeric scale. `px-lg` is `1rem` — don't read these as t-shirt sizes from the default scale.
- Fonts: `sans` → Helvetica/Neue Montreal, `serif` → Signifier, both self-hosted from `public/fonts/` as OTF and preloaded in `RootLayout`.

`src/styles/global.css` (imported once by `RootLayout`) holds the reset, `@font-face` rules, print styles, the Tetris tetromino CSS variables, and — importantly — the `.blog-content` / `.content` / `.post-content` / `.problem-content` classes that style rendered MDX output. Prose typography lives there, so changes to how posts read usually belong in that file rather than in per-page classes.

### Images

Use `src/components/Image.astro` rather than `astro:assets` directly. It wraps `<Image>` with optional **ThumbHash** placeholder decoding (`src/lib/thumbhashPlaceholder.ts`), caption/source rendering, and the `data-image-viewer-*` attributes that the global `ImageViewer` island keys off — the lightbox is wired by data attributes, not props, so images inside MDX get it for free. Generate the hex with `bun run gen-thumbhash <image>`.

Images imported from `src/assets/` go through Astro's optimizer; anything under `public/` is served verbatim and is not optimized.

### 3D models (Three.js)

`three` is used by `GladiatorModel.astro`, `LadyJusticeModel.astro`, and `MobiusStrip/MobiusStrip.ts`. `astro.config.ts` pins it into its own Rollup manual chunk (alongside a `solid` chunk) and sets `ssr.noExternal: ["three"]`.

The convention for a glTF sculpture is **one self-contained `.astro` component per model** — scoped `<style>` plus an inline `<script>` — rather than a shared parameterised component. `LadyJusticeModel.astro` mirrors `GladiatorModel.astro` closely; use it as the template when adding another. Each viewer:

- Lives under `public/models/<name>/` (a `.glb`, or `scene.gltf` + `scene.bin` + optional `textures/`, plus the Sketchfab `license.txt`).
- Lazy-loads via `IntersectionObserver` with a scroll-settle delay, dynamically importing `three` and its loaders only when near the viewport.
- Shares the environment map asset `public/textures/studio_small_03_1k.hdr`. That asset, and the component structure itself, are the only things the viewers actually have in common — see the calibration note below.
- Recenters and frames generically from a `Box3`, so **model scale and centring need no hand-tuning**: a 0.003-scaled Sketchfab export frames as readily as a unit-scaled one. What this does *not* determine is how much of the frame the model fills — that depends on the model's proportions against the canvas aspect, which is why mobile canvas size is per-model too.
- Keys off a unique root data attribute (`data-gladiator-model`, `data-lady-justice-model`) and initialises on `astro:page-load`, disposing on `astro:before-swap`.

**Lighting, material and sizing constants are per-model and are meant to diverge.** Do not "restore consistency" by copying one viewer's values onto another: each set is calibrated against that scan's albedo and proportions. The gladiator's rig applied to the pale Lady Justice scan blows it out to pure white, and hers applied to his bronze leaves it murky. Current divergence:

| | Gladiator (dark bronze, textured) | Lady Justice (pale stone, vertex colours only) |
|---|---|---|
| Exposure light / dark | 1.38 / 1.12 | 1.0 / 0.85 |
| Env intensity light / dark | 1.8 / 1.15 | 0.25 / 0.18 |
| Hemisphere / key / fill | 3 / 4.2 / 2.2 | 0.55 / 2.1 / 0.45 |
| Material | glTF values as authored | overridden: metalness 0, roughness 0.72, limestone tint |
| Mobile canvas width | `clamp(13rem, 58vw, 14rem)` | `clamp(16rem, 72vw, 18rem)` |
| `INITIAL_ROTATION_Y` | 1.35 | 0 |

Two rules of thumb behind those numbers. Environment intensity is the strongest single knob: the studio HDR is broad omnidirectional light, so raising it flattens carved form and lifts the surface toward white — pale models want it low. And Sketchfab's default material values are frequently unphysical for the subject (a stone statue exported at metalness 0.22), so check them against what the thing actually is before trusting them.

**Raw Sketchfab exports cannot be committed as-is.** They routinely run to hundreds of MB, which breaks two hard limits: GitHub rejects any file over 100 MiB on push, and Cloudflare rejects static assets over 25 MiB. They are also far more geometry than the ~350–500px render target can resolve. Decimate and compress before committing:

```bash
bunx @gltf-transform/cli@latest weld     in.gltf  weld.glb
bunx @gltf-transform/cli@latest simplify weld.glb simp.glb --ratio 0.1 --error 0.002
bunx @gltf-transform/cli@latest meshopt  simp.glb scene.glb
```

Lady Justice went 144.8 MiB → 3.9 MiB this way with no visible difference at display size. Two things to check afterwards: that `COLOR_0` survived (`gltf-transform inspect`) when the model has no textures, since it is then the only colour source; and that the component calls `.setMeshoptDecoder(MeshoptDecoder)` on the loader, because `EXT_meshopt_compression` is a *required* extension and the load throws without it. `KHR_mesh_quantization` needs no setup.

Sketchfab models are CC-BY-4.0 and **must** be credited. The caption convention is `“Title” by Author.` in a `<figcaption>`, linking both the model page and the author profile.

### Path aliases

`@/*` → `src/*`, `@components/*`, `@layouts/*` (defined in `tsconfig.json`).

### SEO

`Seo.astro` centralizes meta/OG/Twitter tags with a `prism.webp` fallback OG image. `sitemap.xml.ts` 301-redirects to `/sitemap-index.xml` (generated by `@astrojs/sitemap`); `robots.txt.ts` advertises both URLs. Per-page structured data is emitted inline (`BlogPosting` on posts, `WebSite`/`Person` in `RootLayout`).

## Conventions from `.cursor/rules/`

- Avoid `as` casts. If unavoidable, leave a `TODO` comment explaining why.
- React 19 semantics: **do not** reach for `useMemo`/`useCallback` unless genuinely necessary.
- When two designs are equally viable, pick the simpler one.

## Project skills (`.agents/skills/`)

Committed to the repo. The two that encode real conventions for this site:

- **`publish-problem-of-day`** — the exact workflow for adding `src/content/problems/*.mdx` entries (start from `_template.mdx`, import `Toggle.astro` once, order the solution as proof → derivation → implementation → answer → full solution in a `Toggle`, then run `bun run build`).
- **`astro-image-optimization`** — WebP conversion + ThumbHash generation workflow for `src/assets` images.

## Writing voice

When drafting or editing first-person blog posts, preserve Lucas's established voice:

- Open with the concrete idea, observation or result. Avoid scene-setting, throat-clearing and generic summaries.
- Prefer short paragraphs and plain, conversational sentences. Use occasional fragments, rhetorical questions and one-line paragraphs to control pace.
- Explain technical ideas through a small concrete example before zooming out to the broader claim. Keep enough implementation detail to make the argument credible, but do not turn the post into documentation.
- Write with curiosity and conviction in the first person. It is fine to be playful, mildly irreverent or self-deprecating; a restrained punchline is better than corporate polish.
- Use Australian/British spelling where natural (`labour`, `realised`, `optimised`) and typographic apostrophes in prose.
- Keep short posts genuinely short. End on the sharpest implication, question or callback rather than appending a recap or a generic call to action.
- Do not invent biographical or project details to make a story smoother. Check dates, links and technical claims against repository history or the primary project first.

## Cursor Cloud specific instructions

- The dev server runs without any environment variables.
- Bun must be installed separately — it is not provided by nvm.
- Cloudflare warnings during dev/build are harmless; the site is fully static.
