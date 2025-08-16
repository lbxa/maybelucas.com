# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
- `bun dev` or `bun start` - Start development server
- `bun run build` - Type check with `astro check` then build for production
- `bun run preview` - Preview production build locally

### Cloudflare Deployment
- `bun run wranger:dev` - Build and serve with Wrangler locally
- `bun run wranger:deploy` - Build and deploy to Cloudflare Pages

## Architecture Overview

This is a personal website and blog built with **Astro 5** using:

### Core Technologies
- **Astro 5** - Static site generator with islands architecture
- **SolidJS** - Reactive components for interactive elements
- **TypeScript** - Strict type checking enabled
- **Tailwind CSS** - Utility-first styling with custom design tokens
- **MDX** - Blog posts with math support (KaTeX)
- **Cloudflare Pages** - Deployment platform

### Project Structure
- **Content Collections**: Blog posts in `src/content/blog/`, about pages in `src/content/about/`
- **Components**: Astro components in `src/components/`, SolidJS components use `.tsx` extension
- **Layouts**: `RootLayout.astro` (base layout), `ContentLayout.astro` (content pages)
- **Particle System**: Complex Three.js-based particle animation in `src/components/Particles/`

### Key Features
- **Dark Mode**: Persistent theme switching with no flash, uses Tailwind's `selector` strategy
- **3D Particles**: Interactive Three.js Möbius strip particle system with user controls
- **Math Rendering**: KaTeX integration for mathematical expressions in blog posts
- **View Transitions**: Astro's built-in page transitions for smooth navigation
- **Performance Optimized**: Font preloading, code splitting, CSS optimization

### Design System
- **Colors**: Custom `shark` palette (grays) and `ivory` (#f5f5f5)
- **Typography**: Neue Montreal (sans), Signifier (serif), ui-monospace (mono)
- **Spacing**: Custom scale (xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, 3xl: 48px)

### Database Integration
- **Cloudflare D1**: SQLite database for visitor tracking
- **Local Development**: Uses `local.db` (gitignored)

### Critical Implementation Notes
- **Path Aliases**: `@/*` → `src/*`, `@components/*` → `src/components/*`, `@layouts/*` → `src/layouts/*`
- **SSR Context**: SolidJS components check `typeof document !== 'undefined'` for browser-only code
- **Astro Islands**: Interactive components are selectively hydrated
- **Theme Persistence**: Dark mode state survives page transitions using `transition:persist`
- **Particle Performance**: Particle count is stored in nanostores and persisted across navigation

### Content Schema
Blog posts require: `title`, `author`, `date`, optional `description`. About pages have no schema requirements.

## Package Manager
Uses **Bun** (specified in package.json). Always use `bun` commands instead of npm/yarn.