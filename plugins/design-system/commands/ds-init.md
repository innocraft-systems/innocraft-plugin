---
description: "Initialize design system for project"
allowed-tools: ["Read", "Write", "Glob", "Bash(mkdir:*)"]
---

# /ds-init - Initialize Design System

Create a design system for this project, stored in BMAD UX files.

## Usage

```bash
/ds-init                    # Interactive setup
/ds-init --minimal          # Quick setup with defaults
/ds-init --from <url>       # Start from inspiration site
```

## Instructions

1. **Check if design system already exists:**
   ```
   docs/ux/design-system.json
   ```
   If it exists, ask if user wants to reset or update it.

2. **Create the UX docs structure if needed:**
   ```bash
   mkdir -p docs/ux/inspiration
   ```

3. **Gather design direction from user:**
   - What aesthetic direction? (modern-minimal, brutalist, neo-retro, dark-academia, etc.)
   - What personality? (playful, serious, technical, warm, etc.)
   - Primary brand color?
   - Any inspiration sites to reference?

4. **Generate design-system.json** based on user input, using the template at:
   ```
   ${CLAUDE_PLUGIN_ROOT}/data/templates/design-system.json
   ```

5. **Create component-library.md** for documenting components:
   ```markdown
   # Component Library

   Design system: docs/ux/design-system.json

   ## Components

   (Add components as they are built)
   ```

6. **Output summary** of what was created and next steps.

## Design System Location

Store at: `docs/ux/design-system.json`

This integrates with BMAD UX agent workflows.
