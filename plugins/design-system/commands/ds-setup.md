---
description: "Guided design system setup - analyzes project and walks through the full workflow"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash(mkdir:*)", "mcp__firecrawl__firecrawl_scrape", "mcp__firecrawl__firecrawl_map", "Edit"]
---

# /ds-setup - Guided Design System Setup

Analyzes your project state and guides you through the complete design system workflow.

## Usage

```bash
/ds-setup                    # Full guided setup
/ds-setup --status           # Just show current status
/ds-setup --from <url>       # Start with inspiration site
```

## Instructions

Follow the orchestration workflow:

### 1. Detect Project State

Check for existing design system:
```
docs/ux/design-system.json
```

Check for UI components:
```
src/components/**/*.{tsx,jsx,vue,svelte}
components/**/*.{tsx,jsx,vue,svelte}
app/**/*.{tsx,jsx,vue,svelte}
```

Check for inspiration captures:
```
docs/ux/inspiration/*.json
```

### 2. Determine Current Phase

| Has Design System | Has Components | Has Inspiration | Phase |
|-------------------|----------------|-----------------|-------|
| No | No | No | INITIALIZE |
| No | Yes | No | EXTRACT |
| Yes | No | No | READY |
| Yes | No | Yes | READY |
| Yes | Yes | * | ALIGN |

### 3. Execute Appropriate Flow

#### Phase: INITIALIZE
1. Ask about aesthetic direction
2. Ask about brand personality
3. Ask for primary brand color
4. Ask for inspiration URLs (optional)
5. If URL provided → capture with Firecrawl
6. Generate design-system.json
7. Create docs/ux/ structure

#### Phase: EXTRACT
1. Scan existing components for patterns
2. Extract colors, fonts, spacing
3. Show what was found
4. Generate design-system.json from findings
5. Flag inconsistencies for review

#### Phase: READY
1. Display token summary
2. Show available commands
3. Remind about premium-design principles

#### Phase: ALIGN
1. Run compliance check on all components
2. Generate report with violations
3. Offer to auto-fix
4. Show final compliance score

### 4. Status Report

Always end with a status summary:

```markdown
## Design System Status

**Phase:** [INITIALIZE | EXTRACT | READY | ALIGN | COMPLETE]

**Design System:** [Missing | Created | Updated]
- Colors: N defined
- Fonts: N defined
- Spacing: 8-point grid

**Components:** N found
- Compliant: X/N
- Violations: Y

**Next Steps:**
1. [Primary action]
2. [Secondary action]
```

### 5. --status Flag

If `--status` flag is provided, skip the workflow and just report:

1. Load design-system.json (or note missing)
2. Count components
3. Run quick compliance scan
4. Output status report only

### 6. --from Flag

If `--from <url>` is provided:

1. Skip aesthetic questions
2. Immediately capture from URL
3. Use captured tokens as base
4. Ask for any overrides
5. Generate design-system.json
