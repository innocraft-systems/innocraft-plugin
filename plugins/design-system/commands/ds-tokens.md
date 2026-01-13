---
description: "View or regenerate design tokens"
allowed-tools: ["Read", "Write", "Glob"]
---

# /ds-tokens - View Design Tokens

Display the project's design system tokens or regenerate them.

## Usage

```bash
/ds-tokens                      # Show all tokens
/ds-tokens colors               # Show only colors
/ds-tokens typography           # Show only typography
/ds-tokens --css                # Generate CSS variables
/ds-tokens --tailwind           # Generate Tailwind config
/ds-tokens --json               # Output raw JSON
```

## Instructions

1. **Load the design system:**
   ```
   docs/ux/design-system.json
   ```

2. **Display tokens** based on arguments:

### All Tokens (default)

Show a formatted summary:

```markdown
## Design System: Project Name

### Colors
- Primary: #2563eb (hover: #1d4ed8, active: #1e40af)
- Secondary: #64748b
- Accent: #f97316
- Neutrals: 50-950 scale

### Typography
- Heading: Cabinet Grotesk
- Body: Inter
- Mono: JetBrains Mono
- Scale: xs (0.75rem) → 5xl (3rem)

### Spacing
- Unit: 8px
- Scale: 0, 4, 8, 12, 16, 24, 32, 48, 64

### Motion
- Snappy: stiffness 400, damping 30
- Smooth: stiffness 200, damping 25
```

### CSS Variables (--css)

Generate:

```css
:root {
  /* Colors */
  --color-primary-base: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-active: #1e40af;
  ...

  /* Typography */
  --font-heading: 'Cabinet Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  ...

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  ...

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  ...
}
```

### Tailwind Config (--tailwind)

Generate extend configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          active: '#1e40af',
        },
        // ...
      },
      fontFamily: {
        heading: ['Cabinet Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      // ...
    }
  }
}
```

3. **Output to file if requested:**
   - `docs/ux/tokens.css`
   - `docs/ux/tailwind-extend.js`
