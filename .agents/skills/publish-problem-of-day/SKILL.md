---
name: publish-problem-of-day
description: Publish new Problem of the Day entries for maybelucas.com. Use when adding or updating daily problem MDX files in src/content/problems, especially tasks involving source links, problem metadata/frontmatter, mathematical proofs, KaTeX-compatible math, implementation snippets, final answers, and the full CP-grade solution Toggle.
---

# Publish Problem Of Day

## Overview

Add one self-contained MDX entry to `src/content/problems` that matches the website's existing Problem of the Day collection and renders through Astro, MDX, remark-math, and rehype-katex.

## Workflow

1. Inspect the current shape before editing:
   - `src/content/problems/_template.mdx`
   - the newest existing entry in `src/content/problems`
   - `src/content.config.ts` if the frontmatter schema is unclear
2. Create a hyphen-case slug file at `src/content/problems/<slug>.mdx`.
3. Use the user's provided source URL and metadata when available. If metadata is missing, infer conservative values from the problem and make the description original, not copied problem text.
4. Import the toggle exactly once after frontmatter:

```mdx
import Toggle from '../../components/Toggle.astro';
```

5. Write the solution in this order unless the user asks for a different structure:
   - mathematical setup and proof
   - recurrence or algorithm derivation
   - concise implementation snippet
   - final answer when applicable
   - full CP-grade solution inside `Toggle`
6. Run `bun run build` after edits. Report any pre-existing warnings separately from new errors.

## Frontmatter

Use the collection schema exactly:

```yaml
---
title: "Problem Title"
description: "Short original description of the solution idea."
date: YYYY-MM-DD
source: "https://..."
topic: "Dynamic Programming / Probability"
difficulty: 5
estimatedTime: 35
---
```

For "today", use the current local date from the environment. Keep `source` as an absolute URL because the schema requires `z.string().url()`.

## Math And MDX

- Convert LaTeX delimiters to Markdown math delimiters: `$...$` for inline math and `$$...$$` for display math.
- Do not leave `\(...\)` or `\[...\]` delimiters in the MDX.
- Prefer KaTeX-supported commands such as `\Pr`, `\text{}`, `\texttt{}`, `\left\lfloor`, `\right\rfloor`, `\sum`, `\frac`, and `aligned`.
- Keep code identifiers outside math as backticks when normal prose is clearer; use `\texttt{...}` only inside math.
- Keep punctuation outside display math unless the punctuation belongs to the mathematical expression.
- If the user gives a final numeric answer, place it in a plain code block:

````md
```text
2269
```
````

## Code Sections

Use fenced code blocks with language tags:

````md
```cpp
// concise implementation snippet
```
````

The full copy-pastable solution belongs in the toggle:

````mdx
<Toggle>
<span slot="summary">Full CP-grade code</span>

```cpp
// full solution, including includes and main()
```
</Toggle>
````

Preserve the user's CP-grade code style unless it fails to build as MDX. It is fine for snippets to omit includes when the full toggle has the complete program.

## Validation

- `bun run build` is the required check for content schema, Astro type checking, MDX parsing, and KaTeX rendering.
- If the build fails on math, inspect the exact expression and convert unsupported LaTeX to KaTeX-compatible syntax.
- If the user has a dev server or browser open, mention the final route as `/problems/<slug>/` after the build passes.
