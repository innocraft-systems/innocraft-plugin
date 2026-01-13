---
description: "Run BMAD story with cross-context persistence"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-bmad-harness.sh:*)", "Read", "Edit", "Write", "Bash(npm:*)", "Bash(npx:*)", "Bash(git:*)"]
---

# /brun - BMAD Story Runner

Run a BMAD story with harness that persists across context windows.

## Usage

```bash
/brun <story-file>
/brun <story-file> --max 50
```

## Instructions

Run the setup script, then implement the story:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/setup-bmad-harness.sh $ARGUMENTS
```

Then read the story file and begin TDD implementation. Update task checkboxes as you complete them. Set Status to "done" when finished.

## Serena Integration (Recommended)

If Serena MCP is available, use semantic tools for better efficiency:

- **Before starting**: `find_symbol` to locate relevant code
- **During tasks**: `find_referencing_symbols` to understand impact
- **Context recovery**: Symbol-level inventory instead of re-reading files
- **Verification**: Check all references updated before marking complete

See `serena-integration` skill for full workflow.
