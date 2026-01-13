---
description: "Extract design system from prototype UI code or screenshot"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# /ds-extract - Extract Design System from Prototype

Analyze prototype code or screenshots to extract design patterns and generate/update design system.

## Usage

```bash
/ds-extract <file>              # Extract from component file
/ds-extract <folder>            # Extract from folder of components
/ds-extract --screenshot        # Extract from screenshot (provide path)
```

## Instructions

### For Code Files:

1. **Read the file(s) and extract:**
   - CSS variables / Tailwind classes
   - Color values (hex, rgb, hsl)
   - Font families and sizes
   - Spacing values
   - Border radii
   - Shadow definitions
   - Animation/transition values

2. **Identify patterns:**
   - Repeated color combinations
   - Consistent spacing units
   - Typography scale
   - Component structures

3. **Generate design-system.json** or **diff against existing**

### For Screenshots:

1. **Analyze the image visually:**
   - Dominant colors
   - Typography style (serif, sans-serif, mono)
   - Layout patterns (grid, asymmetric, centered)
   - Component styles (rounded, sharp, minimal)
   - Spacing density (tight, comfortable, spacious)

2. **Suggest design tokens** based on visual analysis

3. **Recommend fonts** that match the style

### Output:

1. **If no design-system.json exists:**
   - Create new design-system.json from extracted values

2. **If design-system.json exists:**
   - Show diff between current and extracted
   - Highlight inconsistencies in the prototype
   - Suggest updates to either design system or prototype

## Extraction Patterns

### Tailwind Classes → Tokens

```
bg-blue-500 → colors.primary.base: "#3b82f6"
text-gray-600 → colors.neutral.600: "#4b5563"
rounded-lg → radii.lg: "0.5rem"
shadow-md → shadows.md: "..."
```

### CSS Variables → Tokens

```css
--color-primary: #2563eb;   → colors.primary.base
--font-heading: 'Cabinet';  → typography.fonts.heading
--spacing-4: 1rem;          → spacing.scale.4
```

### Hardcoded Values → Warnings

Flag any hardcoded values that should be tokens:
- `color: #333` → Should use neutral token
- `font-size: 14px` → Should use typography scale
- `padding: 13px` → Should follow 8-point grid
