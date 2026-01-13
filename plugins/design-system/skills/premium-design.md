---
name: premium-design
description: Create premium, distinctive UI that avoids generic "AI slop" aesthetics. Enforces per-project design systems with physics-based motion, perceptually uniform colors, optical alignment, and bold creative direction. Use when building any frontend, reviewing UI code, or when user requests "premium", "distinctive", "polished", or "not generic" interfaces.
---

# Premium Design System

Create interfaces that are both **distinctive** (avoiding generic AI aesthetics) and **premium** (physics-based fidelity). Every project must have a design system that enforces consistency.

## Core Philosophy

### Avoid the Two Traps

1. **AI Slop**: Generic patterns (Inter font, purple gradients, centered everything, predictable layouts)
2. **Digital Uncanny Valley**: Instant state changes, mathematical centering, pure black shadows, linear animations

### The Fix

**Commit to a bold aesthetic direction** and execute with **physics-based fidelity**.

## Design System First

Before writing ANY UI code, check for the project's design system:

```
docs/ux/design-system.json
```

If it doesn't exist, run `/ds-init` to create one. Never hardcode colors, fonts, or spacing—always reference the design system.

---

## Color Architecture

### Use Design Tokens, Never Raw Values

```css
/* ❌ Hardcoded - breaks consistency */
.button { background: #2563eb; }

/* ✅ Token reference */
.button { background: var(--color-primary-base); }
```

### Color Manipulation Rules

When creating hover/active states, don't just darken:

| Goal | Hue Shift | Saturation | Brightness |
|------|-----------|------------|------------|
| Hover | +5° | +10% | -10% |
| Active | +5° | +15% | -15% |
| Disabled | 0° | -40% | +20% |
| Subtle BG | 0° | -60% | +40% |

### Dark Mode: Elevation = Lightness

```css
/* Surfaces get LIGHTER as they elevate */
--surface-0: hsl(0 0% 7%);   /* Background */
--surface-1: hsl(0 0% 10%);  /* Cards */
--surface-2: hsl(0 0% 13%);  /* Modals */
--surface-3: hsl(0 0% 16%);  /* Dropdowns */
```

### Colored Greys

Never use pure grey. Mix 5-10% of brand hue:

```css
/* ❌ Dead grey */
color: #808080;

/* ✅ Warm grey with brand tint */
color: hsl(220 10% 50%);
```

---

## Typography

### Distinctive Font Choices

```css
/* ❌ Generic AI Slop */
font-family: Inter, Arial, sans-serif;

/* ✅ Distinctive Options */
font-family: 'Cabinet Grotesk', sans-serif;   /* Modern, characterful */
font-family: 'Space Mono', monospace;         /* Technical, precise */
font-family: 'Playfair Display', serif;       /* Editorial, elegant */
font-family: 'Instrument Serif', serif;       /* Refined, literary */
```

**Never use** Arial, Helvetica, Inter, or Roboto as primary fonts.

### Fluid Typography

```css
/* Smooth scaling without breakpoint jumps */
font-size: clamp(1rem, 1vw + 0.75rem, 1.5rem);
```

### Line Height on 4-Point Grid

```css
/* Typography line-heights: multiples of 4 */
line-height: 1.25;  /* 20px at 16px base */
line-height: 1.5;   /* 24px at 16px base */
```

---

## Motion: Springs, Not Timelines

### Why Springs?

- **Interruptible**: Respond to user input mid-animation
- **Natural**: Simulate real physics (momentum, resistance)
- **Consistent**: Same spring works at any distance

```javascript
/* ❌ Cheap: fixed duration, can't interrupt */
transition: transform 0.3s ease-in-out;

/* ✅ Premium: physics-based */
<motion.div
  animate={{ scale: 1 }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 25
  }}
/>
```

### Spring Configurations

| Context | Stiffness | Damping | Feel |
|---------|-----------|---------|------|
| Buttons/toggles | 400 | 30 | Snappy |
| Modals/sheets | 300 | 25 | Responsive |
| Page transitions | 200 | 25 | Smooth |
| Bouncy feedback | 300 | 15 | Playful |

### CSS Approximation

When React/Framer not available:

```css
/* Spring-like cubic-bezier */
transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Shadows: Three-Layer System

```css
/* ❌ Flat, cheap shadow */
box-shadow: 0 4px 12px rgba(0,0,0,0.2);

/* ✅ Premium layered shadows */
box-shadow:
  0 0 40px rgba(var(--brand-rgb), 0.04),    /* Ambient: atmosphere */
  0 12px 24px rgba(var(--brand-rgb), 0.08), /* Directional: light source */
  0 2px 4px rgba(var(--brand-rgb), 0.12);   /* Contact: grounding */
```

### Never Pure Black

Use dark, desaturated brand color for shadows. Pure black shadows look artificial.

### Elevation Scale

| Level | Use Case | Shadow |
|-------|----------|--------|
| 0 | Background | None |
| 1 | Cards | shadow-sm |
| 2 | Dropdowns | shadow-md |
| 3 | Modals | shadow-lg |
| 4 | Tooltips | shadow-xl |

---

## Layout: 8-Point Grid + Optical Alignment

### Spacing

All spacing must be multiples of 8: `8, 16, 24, 32, 40, 48, 56, 64...`

```css
/* ❌ Random spacing */
padding: 13px 22px;

/* ✅ 8-point grid */
padding: 16px 24px;
```

### Optical Corrections

**Never trust mathematical centering.**

| Element | Fix |
|---------|-----|
| Play icon (triangle) | Nudge right ~10% of width |
| Circles next to squares | Increase circle 5-10% |
| Text next to icons | Reduce icon size or lighten color |
| Vertical text centering | Nudge up 1-2px (ascenders vs descenders) |

---

## Backgrounds: Atmosphere Over Solids

```css
/* ❌ Flat, lifeless */
background: #ffffff;

/* ✅ Atmospheric depth */
background:
  radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 50%),
  radial-gradient(ellipse at bottom, rgba(236, 72, 153, 0.1), transparent 50%),
  #0a0a0a;
```

---

## Glass Effects

```css
/* ❌ Washed out */
backdrop-filter: blur(20px);

/* ✅ Vibrant glass */
backdrop-filter: blur(20px) saturate(180%);
background: rgba(255, 255, 255, 0.1);
```

Add 1-2% opacity SVG noise to prevent color banding.

---

## Anti-Patterns Checklist

Before shipping, verify NONE of these exist:

| Pattern | Problem | Fix |
|---------|---------|-----|
| Inter/Roboto/Arial font | Generic | Use distinctive font |
| Purple gradient on white | AI slop cliché | Commit to real color story |
| Perfect symmetry | Predictable | Intentional asymmetry |
| Centered everything | Safe, boring | Align to edges, use overlap |
| Pure black shadows | Artificial | Use tinted shadows |
| Linear animations | Robotic | Spring physics |
| Hardcoded colors | Inconsistent | Use design tokens |
| Mathematical centering | Optically wrong | Apply corrections |

---

## Implementation Checklist

Before marking UI complete:

- [ ] Design system exists (`docs/ux/design-system.json`)
- [ ] All colors reference design tokens
- [ ] Typography uses distinctive fonts (not Inter/Arial)
- [ ] Spacing follows 8-point grid
- [ ] Animations use spring physics (or spring-like bezier)
- [ ] Shadows use 3-layer system with tinted colors
- [ ] Icons optically centered (not mathematically)
- [ ] Dark mode surfaces elevate by lightening
- [ ] No pure black or pure grey
- [ ] Backgrounds have atmosphere (gradients, patterns)

---

## Quick Reference Tables

### Color Adjustment Matrix

| Variation | Hue | Saturation | Brightness |
|-----------|-----|------------|------------|
| Hover | +5° | +10% | -10% |
| Active/Pressed | +5° | +15% | -15% |
| Disabled | 0° | -40% | +20% |
| Subtle Background | 0° | -60% | +40% |
| Dark Mode Invert | +180° | adjust | invert |

### Spring Presets

| Name | Stiffness | Damping | Use |
|------|-----------|---------|-----|
| Snappy | 400 | 30 | Buttons, toggles |
| Responsive | 300 | 25 | Modals, menus |
| Smooth | 200 | 25 | Page transitions |
| Bouncy | 300 | 15 | Playful feedback |

### Shadow Layers

| Layer | Offset | Blur | Opacity | Purpose |
|-------|--------|------|---------|---------|
| Ambient | 0 0 | 40px | 4% | Atmosphere |
| Directional | 0 12px | 24px | 8% | Light source |
| Contact | 0 2px | 4px | 12% | Grounding |

---

## Handoff Notes

When handing off to implementation:

1. **Design system JSON** must exist
2. **Component specs** define props, states, variants
3. **Motion specs** define which springs to use
4. **Accessibility** WCAG AA minimum (4.5:1 text, 3:1 UI)
