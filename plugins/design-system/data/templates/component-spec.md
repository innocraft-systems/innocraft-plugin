# Component: [Component Name]

## Overview

Brief description of the component's purpose.

## Design Tokens

Reference design system: `docs/ux/design-system.json`

### Colors
- Background: `--color-[token]`
- Text: `--color-[token]`
- Border: `--color-[token]`
- Hover: `--color-[token]`

### Typography
- Font: `--font-[heading|body|mono]`
- Size: `--text-[scale]`
- Weight: `--font-weight-[weight]`

### Spacing
- Padding: `--spacing-[n]`
- Margin: `--spacing-[n]`
- Gap: `--spacing-[n]`

## States

### Default
- Background: ...
- Border: ...
- Shadow: ...

### Hover
- Background: shifts per color matrix (+5° hue, +10% sat, -10% brightness)
- Shadow: elevate one level
- Transition: spring (stiffness: 400, damping: 30)

### Active/Pressed
- Background: shifts per color matrix (+5° hue, +15% sat, -15% brightness)
- Transform: scale(0.98)

### Disabled
- Background: shifts per color matrix (0° hue, -40% sat, +20% brightness)
- Opacity: 0.6
- Cursor: not-allowed

### Focus
- Outline: 2px solid primary
- Outline-offset: 2px

## Variants

### Size

| Size | Padding | Font Size | Border Radius |
|------|---------|-----------|---------------|
| sm | spacing-2 spacing-3 | text-sm | radii-sm |
| md | spacing-3 spacing-4 | text-base | radii-base |
| lg | spacing-4 spacing-6 | text-lg | radii-md |

### Style

| Style | Background | Border | Shadow |
|-------|------------|--------|--------|
| solid | primary | none | shadow-sm |
| outline | transparent | primary | none |
| ghost | transparent | none | none |

## Motion

### Hover Transition
```javascript
transition: {
  type: "spring",
  stiffness: 400,
  damping: 30
}
```

### Press Feedback
```javascript
whileTap: { scale: 0.98 }
```

## Accessibility

- [ ] Role: `button` / `link` / etc.
- [ ] Keyboard: Enter/Space activates
- [ ] Focus visible: 2px outline
- [ ] Color contrast: 4.5:1 minimum
- [ ] Screen reader: Descriptive label

## Usage Example

```tsx
<Button
  variant="solid"
  size="md"
  onClick={handleClick}
>
  Click me
</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'solid' \| 'outline' \| 'ghost' | 'solid' | Visual style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Component size |
| disabled | boolean | false | Disabled state |
| loading | boolean | false | Loading state |
