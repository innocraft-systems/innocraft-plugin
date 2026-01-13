---
name: serena-integration
description: Use this skill when BMAD story execution can benefit from semantic code analysis. Triggers on "semantic analysis", "find symbol", "code impact", "reference tracking", or when working on complex multi-file changes in BMAD stories.
---

# BMAD + Serena Integration

When Serena MCP server is available, BMAD story execution becomes significantly more effective through semantic code understanding.

## Prerequisites

Serena must be configured in your MCP settings:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--project-root", "${workspaceFolder}"]
    }
  }
}
```

## Enhanced BMAD Workflows

### 1. Story Initialization

Before starting a story, use Serena to understand the codebase:

```
# Instead of grep-based exploration:
serena.find_symbol("UserService")           # Find the class
serena.find_referencing_symbols("UserService")  # Who uses it?
serena.get_symbol_definition("authenticate")    # Get implementation
```

### 2. Task Execution

For each task in the story:

```
# Locate where changes are needed
serena.find_symbol("handlePayment")

# Understand impact before editing
serena.find_referencing_symbols("handlePayment")

# Make precise edits at symbol level
serena.insert_after_symbol("PaymentService.validate", code)
serena.replace_symbol_body("handlePayment", newImplementation)
```

### 3. Context Recovery (Cross-Window)

When resuming after context window transition:

```
# Quick semantic inventory
serena.find_symbols_in_file("src/services/payment.ts")

# Check what was modified vs what's pending
serena.get_symbol_definition("processRefund")  # Is this done?

# Find incomplete work
serena.find_referencing_symbols("OldPaymentMethod")  # Still references?
```

### 4. Task Completion Verification

Before marking a task complete:

```
# Verify all references updated
serena.find_referencing_symbols("deprecatedFunction")  # Should be empty

# Verify new implementations exist
serena.find_symbol("NewFeature")  # Should find it

# Check test coverage
serena.find_symbols_matching("test*Payment*")
```

## Serena Tools Reference

| Tool | Use Case |
|------|----------|
| `find_symbol` | Locate class/function/variable by name |
| `find_referencing_symbols` | Find all code that uses a symbol |
| `get_symbol_definition` | Get full implementation of a symbol |
| `find_symbols_in_file` | List all symbols in a file |
| `find_symbols_matching` | Regex search for symbols |
| `insert_after_symbol` | Add code after a symbol |
| `replace_symbol_body` | Replace a function/method body |
| `rename_symbol` | Rename with all references |

## BMAD Story Template with Serena

```markdown
## Story: Implement Payment Refunds

### Pre-Analysis (Serena)
- [ ] `find_symbol("PaymentService")` - Locate main service
- [ ] `find_referencing_symbols("processPayment")` - Understand impact
- [ ] `find_symbols_matching("*Refund*")` - Check existing refund code

### Tasks
1. [ ] Add RefundService class
   - Verify: `find_symbol("RefundService")` returns result

2. [ ] Update PaymentService to call RefundService
   - Verify: `find_referencing_symbols("RefundService")` includes PaymentService

3. [ ] Add refund endpoint
   - Verify: `find_symbol("refundEndpoint")` exists

### Post-Verification (Serena)
- [ ] No references to deprecated patterns
- [ ] All new symbols properly connected
- [ ] Tests reference new implementations
```

## Benefits

1. **Faster Context Recovery** - Symbol-level understanding vs re-reading files
2. **Precise Edits** - Edit at function level, not string replacement
3. **Impact Awareness** - Know what breaks before changing
4. **Better Verification** - Semantic checks vs checkbox counting
5. **Token Efficiency** - Read symbols, not entire files
