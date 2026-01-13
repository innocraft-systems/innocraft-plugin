---
description: "Capture design system from inspiration site using Firecrawl"
allowed-tools: ["Read", "Write", "Glob", "mcp__firecrawl__firecrawl_scrape", "mcp__firecrawl__firecrawl_map", "Bash(mkdir:*)"]
---

# /ds-capture - Capture Inspiration Site

Use Firecrawl to extract design tokens and component patterns from an inspiration site.

## Usage

```bash
/ds-capture <url>                    # Capture site's design system
/ds-capture <url> --components       # Also extract component patterns
/ds-capture <url> --merge            # Merge into current design system
```

## Instructions

1. **Scrape the site using Firecrawl with branding format:**
   ```
   mcp__firecrawl__firecrawl_scrape with formats: ["branding", "markdown"]
   ```

2. **Extract design tokens from the branding data:**
   - Colors (primary, secondary, accent, neutrals)
   - Typography (fonts, sizes, weights)
   - Spacing patterns
   - Border radii
   - Shadow styles

3. **If --components flag, also extract:**
   - Button styles and variants
   - Card patterns
   - Navigation patterns
   - Form elements
   - Layout structures

4. **Save to inspiration folder:**
   ```
   docs/ux/inspiration/<site-name>-tokens.json
   docs/ux/inspiration/<site-name>-components.md  (if --components)
   ```

5. **If --merge flag:**
   - Load current design-system.json
   - Show diff between current and captured
   - Ask which tokens to merge
   - Update design-system.json

6. **Output summary:**
   - Colors found
   - Fonts detected
   - Key patterns identified
   - Suggestions for applying to current project

## Output Format

```json
{
  "source": "https://example.com",
  "captured_at": "2024-01-11T12:00:00Z",
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "accent": "#...",
    "neutrals": ["#...", "#..."]
  },
  "typography": {
    "fonts": ["Font Name", "..."],
    "scale": ["14px", "16px", "..."]
  },
  "patterns": {
    "buttons": "description...",
    "cards": "description...",
    "navigation": "description..."
  }
}
```
