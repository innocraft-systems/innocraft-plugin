---
description: "Align component code to project's design system"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
---

# /ds-align - Align Component to Design System

Analyze a component and update it to match the project's design system.

## Usage

```bash
/ds-align <file>                # Align single component
/ds-align <folder>              # Align all components in folder
/ds-align <file> --fix          # Auto-fix (don't just report)
/ds-align <file> --strict       # Fail on any violation
```

## Instructions

1. **Load the project's design system:**
   ```
   docs/ux/design-system.json
   ```
   If it doesn't exist, prompt user to run `/ds-init` first.

2. **Read the component file(s)**

3. **Check for violations:**

   ### Colors
   - Hardcoded hex/rgb values → Should use design tokens
   - Colors not in design system → Flag as potential issue
   - Missing dark mode variants → Add `dark:` classes

   ### Typography
   - Generic fonts (Inter, Arial) → Replace with design system fonts
   - Sizes not in scale → Map to nearest scale value
   - Missing fluid typography → Suggest `clamp()` usage

   ### Spacing
   - Values not on 8-point grid → Round to nearest
   - Inconsistent padding/margin → Standardize

   ### Shadows
   - Single-layer shadows → Suggest 3-layer system
   - Pure black shadows → Tint with brand color

   ### Motion
   - Linear/ease animations → Suggest spring physics
   - Fixed durations → Note interruptibility concern

4. **Generate report:**
   ```markdown
   ## Alignment Report: ComponentName.tsx

   ### Violations Found: 5

   | Line | Issue | Current | Suggested |
   |------|-------|---------|-----------|
   | 12 | Hardcoded color | #2563eb | var(--color-primary-base) |
   | 18 | Off-grid spacing | 13px | 12px or 16px |
   | ...

   ### Auto-fixable: 4
   ### Manual review needed: 1
   ```

5. **If --fix flag:**
   - Apply all auto-fixable changes
   - Leave comments for manual review items

## Alignment Rules

### Color Mapping

```javascript
// Tailwind → Design System
'bg-blue-500' → 'bg-primary'
'text-gray-600' → 'text-neutral-600'

// Hex → CSS Variable
'#2563eb' → 'var(--color-primary-base)'
```

### Spacing Corrections

```javascript
// Round to 8-point grid
'13px' → '12px' (round down) or '16px' (round up)
'22px' → '24px'
'5px' → '4px' or '8px'
```

### Typography Fixes

```javascript
// Font replacements
'Inter' → design-system.typography.fonts.body
'Arial' → design-system.typography.fonts.body

// Size mapping
'14px' → 'text-sm' (0.875rem)
'18px' → 'text-lg' (1.125rem)
```
