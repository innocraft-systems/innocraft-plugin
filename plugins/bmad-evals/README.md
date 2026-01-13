# BMAD-Evals Plugin

A hybrid Claude Code plugin combining **BMAD methodology** structured test creation with **Ralph-wiggum** iterative execution for comprehensive AI agent evaluation.

## Overview

This plugin bridges three powerful concepts:

1. **BMAD Method** - Structured, test-driven development with clear acceptance criteria
2. **Ralph-Wiggum** - Self-referential execution loops that iterate until completion
3. **Agent Evals** - Anthropic's evaluation framework with graders and metrics

The result: automated, structured evaluation of AI agent work with comprehensive grading and reporting.

## Installation

```bash
# Clone or copy the plugin to your Claude Code plugins directory
cp -r bmad-evals-plugin ~/.claude/plugins/bmad-evals

# Or for project-specific installation
cp -r bmad-evals-plugin .claude/plugins/bmad-evals
```

## Quick Start

### BMAD Story Execution (Ralph-ish)

```bash
/brun docs/stories/story-1.1.md
```

### Eval Mode (Grading)

```bash
# Initialize the eval infrastructure
/eval-init

# Add an eval task
/eval-task-add auth-fix "Fix the authentication bypass vulnerability"

# Run the eval with iteration loop
/eval-run --task auth-fix --max-iterations 20 --completion-promise "ALL TESTS PASS"

# View the report
/eval-report

# Cancel if needed
/eval-cancel
```

## Commands

| Command | Description |
|---------|-------------|
| `/brun` | Run BMAD story with cross-context persistence |
| `/bstop` | Stop BMAD story harness |
| `/eval-init` | Initialize eval suite |
| `/eval-run` | Start eval loop with grading |
| `/eval-task-add` | Add eval task |
| `/eval-report` | Generate report |
| `/eval-cancel` | Cancel eval loop |

## How It Works

### BMAD Story Harness (Ralph-ish Execution)

The plugin makes BMAD story execution "Ralph-ish" - enabling cross-context persistence for long-running tasks.

```
┌─────────────────────────────────────────────────────┐
│  /brun path/to/story.md                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Setup BMAD Harness                                 │
│  - Create state file with story prompt              │
│  - Parse story tasks and acceptance criteria        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  DEV Agent Executes Story                           │
│  - Reads story file                                 │
│  - Implements with TDD (red-green-refactor)         │
│  - Updates task checkboxes [x]                      │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
   Context Exhausted          All Tasks Done
           │                       │
           ▼                       ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  Stop Hook Triggers  │  │  Story marked DONE       │
│  - Git checkpoint    │  │  Harness exits           │
│  - Re-feed prompt    │  └──────────────────────────┘
│  - Add progress ctx  │
└──────────────────────┘
           │
           ▼
      Next Context Window
           │
           └───────→ (continues where left off)
```

**Key Features:**
- **Git Checkpoints** - Commits progress on each context switch
- **Progress Tracking** - Parses story file for completed tasks
- **Smart Continuation** - Re-feeds prompt with remaining tasks
- **Multiple Exit Conditions** - Status field, checkboxes, or promise

### Eval Execution Loop

```
┌─────────────────────────────────────────────────┐
│  /eval-run --task my-task                       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Claude works on task                            │
│  - Reads requirements                            │
│  - Implements solution                           │
│  - Writes tests                                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  Stop Hook Intercepts Exit                       │
│  - Runs configured graders                       │
│  - Captures transcript                           │
│  - Records iteration result                      │
└──────────────────────┬──────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
     Graders PASS            Graders FAIL
           │                       │
           ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  Generate Report │    │  Feed feedback back  │
│  End Loop        │    │  Continue iteration  │
└──────────────────┘    └──────────────────────┘
```

### Grader Types

#### Deterministic (Code-Based)
- **deterministic_tests**: Run test suites (npm test, pytest, etc.)
- **static_analysis**: Linting, type checking, security scans
- **state_check**: Verify files exist, contain patterns
- **tool_calls**: Verify specific tools were used

#### Model-Based
- **llm_rubric**: LLM evaluates against criteria
- **string_match**: Regex pattern matching

## Configuration

### Task Definition

```json
{
  "id": "auth-bypass-fix",
  "prompt": "Fix the authentication bypass vulnerability...",
  "graders": [
    {
      "type": "deterministic_tests",
      "name": "security-tests",
      "command": "npm test -- --grep 'auth'"
    },
    {
      "type": "state_check",
      "name": "fix-applied",
      "expect": {
        "files": ["src/auth.ts"],
        "contains": {"src/auth.ts": "validatePassword"}
      }
    }
  ],
  "max_iterations": 20,
  "completion_promise": "SECURITY FIX COMPLETE"
}
```

### Grader Templates

The plugin includes templates for common scenarios:
- `coding-task.json` - General coding tasks
- `security-fix.json` - Security vulnerability fixes
- `bug-fix.json` - Bug fix evaluations
- `feature-implementation.json` - New feature development

## Metrics

### pass@k
Probability of at least one success in k attempts.
- Higher k = higher pass@k
- Use when one success is sufficient

### pass^k
Probability of all k attempts succeeding.
- Higher k = lower pass^k
- Measures consistency and reliability

## Integration with BMAD

### Two Execution Modes

**1. BMAD Story Harness (`/brun`)**
- For implementing BMAD stories
- Cross-context persistence via git checkpoints
- Progress tracked by story file checkboxes
- Best for: Long development tasks, complex stories

**2. Eval Mode (`/eval-run`)**
- For evaluating agent performance
- Automated grading with pass/fail metrics
- Multiple grader types (tests, lint, LLM)
- Best for: Testing, benchmarking, quality assurance

### Workflow Examples

```bash
# Implement a story with harness (Ralph-ish execution)
/brun docs/stories/story-1.1-user-auth.md

# Evaluate the implementation after story is complete
/eval-init --from-bmad docs/stories/
/eval-run --task story-1.1 --max-iterations 10

# View metrics
/eval-report
```

### When to Use Each

| Use Case | Mode | Why |
|----------|------|-----|
| Implementing a story | `/brun` | Persistence across context windows |
| Running test suites | `/eval-run` | Grading and metrics |
| Quality assurance | `/eval-run` | Automated pass/fail |
| Long feature work | `/brun` | Git checkpoints |
| Benchmarking agents | `/eval-run` | pass@k metrics |

## File Structure

```
.claude/
├── bmad-harness/               # BMAD story harness state
│   └── story-loop.state.md     # Active story prompt + progress
└── bmad-evals/                 # Eval infrastructure
    ├── eval-loop.state.json    # Active eval loop state
    ├── eval-tasks.json         # Task definitions
    ├── graders/                # Grader configurations
    ├── results/                # Iteration results
    │   ├── iteration-1.json
    │   └── ...
    ├── tool-events.jsonl       # Captured tool calls
    └── eval-report.md          # Generated report
```

## Agents

The plugin includes specialized subagents:

- **eval-grader**: LLM-based grading with rubrics
- **eval-orchestrator**: Multi-task suite management
- **eval-analyst**: Result analysis and recommendations

## Best Practices

### Task Design
1. Clear, unambiguous success criteria
2. Reference solutions for calibration
3. Balanced positive/negative test cases
4. Incremental goals for complex tasks

### Grader Selection
- Use deterministic graders where possible
- Reserve LLM graders for subjective quality
- Combine grader types for comprehensive coverage

### Iteration Limits
- Set reasonable max_iterations (20-50 for most tasks)
- Use completion promises for clear completion signals
- Monitor for eval saturation (consistent 100% pass)

## Troubleshooting

### BMAD Harness Won't Stop
```bash
# Force cancel
/bstop

# Or manually remove state file
rm .claude/bmad-harness/story-loop.state.md
```

**Common causes:**
- Story Status not updated to "done"
- Task checkboxes not being updated
- Completion promise not matching exactly

### Eval Loop Won't Stop
```bash
# Force cancel
/eval-cancel

# Or manually remove state file
rm .claude/bmad-evals/eval-loop.state.json
```

### Graders Always Fail
- Verify grader commands work standalone
- Check file paths in state_check
- Review grader output in results/

### No Results Generated
- Ensure hooks are registered
- Check .claude/bmad-evals/ directory exists
- Verify transcript capture is working

### Progress Not Persisting
- Ensure git is initialized in project
- Check that changes are being saved to files
- Verify story file path is correct in state

## License

MIT License - See LICENSE file for details.

## Serena Integration (Recommended)

BMAD works significantly better with [Serena](https://github.com/oraios/serena) MCP server for semantic code analysis.

### Benefits
- **Faster context recovery** - Symbol-level understanding vs re-reading files
- **Precise edits** - Edit at function level, not string replacement
- **Impact awareness** - Know what breaks before changing
- **Better verification** - Semantic checks vs checkbox counting

### Setup

The plugin includes `.mcp.json` with Serena configuration. Ensure you have `uv` installed:

```bash
# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Serena will auto-start via MCP config
```

### Usage with BMAD

```bash
# During story execution, use Serena tools:
serena.find_symbol("UserService")           # Locate code
serena.find_referencing_symbols("handleAuth")  # Understand impact
serena.insert_after_symbol("validate", code)   # Precise edits
```

See `serena-integration` skill for complete workflow.

## Acknowledgments

- Anthropic's "Demystifying Evals for AI Agents"
- BMAD Method by BMad Code
- Ralph Wiggum technique by Geoffrey Huntley
- Serena by Oraios AI
