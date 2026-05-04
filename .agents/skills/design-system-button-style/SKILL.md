---
name: design-system-button-style
description: Defines compact button styling rules for the Spectra app design system. Use when creating or updating button components, Tailwind button classes, UI density, spacing, or action rows in the extension popup.
---

# Design System Button Style

## Intent

Keep buttons compact and space-efficient for developer tooling interfaces.
Use minimal spacing by default, then increase spacing only when the UI becomes cluttered or hard to scan.

## Default Button Baseline

Use this baseline for secondary utility actions:

```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  className="h-7 px-2 text-[11px]"
>
  Close
</Button>
```

## Compactness Rules

1. Default to compact button density (`h-7`, tight horizontal padding, small text).
2. Prefer `size="sm"` unless the button is a primary CTA that needs stronger emphasis.
3. Keep action rows tight first; expand spacing only if adjacent controls feel visually merged.
4. Increase spacing in small increments (for example, `gap-1` -> `gap-1.5` -> `gap-2`), not large jumps.
5. Maintain consistency across sibling actions in the same surface.

## Tailwind Guidance

- Start with compact values: `h-7`, `px-2`, `text-[11px]`.
- Use larger values only with clear UX need (readability, touch target, or visual hierarchy).
- Match existing design language in nearby components before introducing a new button pattern.

## Apply This Skill When

- Adding a new `Button` in popup/library UI.
- Adjusting spacing between buttons or action controls.
- Refactoring component cards/modals/rails where density matters.
- Reviewing UI changes for compactness and consistency.

## Quick Review Checklist

- [ ] Button uses compact baseline unless there is a justified exception.
- [ ] Spacing is minimal but not crowded.
- [ ] Sibling actions look visually consistent.
- [ ] Any larger sizing choice is intentional and tied to hierarchy/usability.
