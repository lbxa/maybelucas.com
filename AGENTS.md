# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Personal website and blog built with Astro 5, SolidJS, Tailwind CSS, and deployed to Cloudflare Pages. See `CLAUDE.md` for full architecture details and standard development commands.

### Running the Dev Server

- `bun dev` starts the Astro dev server on `http://localhost:4321/`
- The dev server works without any environment variables — the only feature that requires env vars is the `/api/visitor-count` endpoint (needs `TURSO_DB_URL` and `TURSO_DB_AUTH_TOKEN`)

### Building

- `bun run build` runs `astro check` (type checking) followed by `astro build`
- The build will fail without Turso env vars because `src/pages/api/visitor-count.ts` throws at module level if they are missing. To build locally without a real Turso database, set placeholder values: `TURSO_DB_URL="libsql://placeholder.turso.io" TURSO_DB_AUTH_TOKEN="placeholder" bun run build`
- Type checking alone passes cleanly (0 errors, only hints for unused variables)

### Linting / Testing

- No test framework is configured in this project
- Type checking is done via `astro check` (included in the build script)
- No ESLint or Prettier configuration exists

### Key Gotchas

- Bun must be installed separately — it is not provided by nvm. Install via `curl -fsSL https://bun.sh/install | bash`
- The project specifies `packageManager: "bun@1.2.19"` in `package.json`
- Node.js >= 22 is required (`.nvmrc` specifies `22.9.0`)
- The Cloudflare adapter warnings during dev/build are expected and harmless since the site is fully static
