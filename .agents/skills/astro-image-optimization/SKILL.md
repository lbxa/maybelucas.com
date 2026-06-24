---
name: astro-image-optimization
description: Optimize Astro image assets into web-ready WebP files and generate ThumbHash placeholders. Use when working with Astro images, src/assets image imports, WebP conversion, responsive image guidance, image metadata, or ThumbHash generation.
---

# Astro Image Optimization

## Purpose

Prepare local Astro image assets for the web:

1. Convert source images to WebP at practical quality.
2. Generate ThumbHash metadata for low-resolution placeholders.
3. Use Astro's image pipeline correctly in pages and components.

## Default Approach

Use Astro's built-in image tools for rendering:

```astro
---
import { Image } from "astro:assets";
import image from "@/assets/images/example.webp";
---

<Image src={image} alt="Describe the image" layout="constrained" />
```

Rules:

- Keep image files in `src/assets/images/` when they are imported by Astro components.
- Prefer `<Image />` from `astro:assets` for local images so Astro emits width, height, lazy loading, decoding, and optimized output.
- Use `layout="constrained"` or explicit `widths` and `sizes` for responsive content images.
- Keep `alt` accurate; use `alt=""` only for decorative images.
- Do not handwrite `img` tags for local content images unless the surrounding code already requires it.

## Asset Preparation

Use the bundled script when a source image needs conversion or ThumbHash metadata:

```bash
bun .cursor/skills/astro-image-optimization/scripts/optimize-image.ts src/assets/images/source.png
```

Common options:

```bash
bun .cursor/skills/astro-image-optimization/scripts/optimize-image.ts input.jpg --out src/assets/images/example.webp
bun .cursor/skills/astro-image-optimization/scripts/optimize-image.ts input.jpg --width 1200 --quality 82
bun .cursor/skills/astro-image-optimization/scripts/optimize-image.ts input.jpg --json
```

Defaults:

- Output format: WebP.
- Quality: `82`, a good baseline for photographic web images.
- Width: original width unless `--width` is provided; never upscales.
- ThumbHash source: the optimized WebP output, resized to fit within 100x100.
- Script dependencies: `sharp` and `thumbhash` must resolve in the project.

## Decision Rules

- Converting a new raster asset? Run the script and store the WebP in the appropriate `src/assets/images/` subdirectory.
- Only wiring an existing WebP into an Astro page? Import it and use `<Image />`.
- Need a placeholder value? Use the script's `thumbhashHex` output.
- Need several responsive sizes at build time? Let Astro generate them with `<Image />`, `getImage()`, `layout`, `widths`, and `sizes`.
- Need an already-small UI icon or vector? Prefer SVG; do not convert SVGs to WebP.

## Required Checks

Before finishing image work:

- Confirm the original source is not accidentally referenced after conversion.
- Confirm the optimized WebP is committed or available in `src/assets/images/`.
- Confirm the rendered Astro component has accurate `alt` text.
- Confirm ThumbHash metadata matches the final WebP, not an old source file.
- Run the narrowest available verification command for the files changed.
