# components

Shared UI with no product logic.

- `ui/`: design-system primitives built on Radix and Tailwind: `Button`, `ColorPicker`, `Field`, `Panel`, `Segmented`, `Slider`, `Switch`, `Tooltip` / `InfoTip`. Build new controls from these so focus states and accessibility stay consistent. Import each from its folder, e.g. `@/components/ui/button`.
- `layout/`: page chrome: `Nav`, `Hero`, `ModeTabs`, `Footer`, `PreviewCard`, `MobileCTA`, `EmptyState`.
- `script-word/`: a word drawn inline in the app's own lettering (used in the hero headline).

Same folder convention as features: `index.ts(x)`, `Name.view.tsx`, `name.types.ts`, optional `name.constants.ts`. Colours come from the theme tokens in `src/index.css`; the UI is dark-only.
