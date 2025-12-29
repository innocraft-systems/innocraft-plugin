---
name: neon-mcp
description: This skill covers Neon MCP (Model Context Protocol) server integration for AI assistants. Use when the user asks about "Neon MCP server", "AI database integration", "Claude with Neon", "Cursor with Neon database", "MCP configuration", "CLAUDE.md for Neon", "AI rules files", or needs to set up AI tools to work with Neon databases.
---

# Neon MCP Server & AI Integration

Neon provides MCP (Model Context Protocol) servers for AI assistant integration, enabling AI tools to interact with your database.

## Quick Setup

The fastest way to configure AI tools with Neon:

```bash
npx neonctl@latest init
```

This command:
- Authenticates via OAuth
- Creates a Neon API key
- Configures Cursor, VS Code, and Claude Code CLI

## Manual MCP Configuration

### Claude Code CLI

Add to `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon", "start", "${NEON_API_KEY}"]
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.neon.tech/mcp"]
    }
  }
}
```

### Claude Desktop

Location varies by OS:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List Neon projects |
| `create_project` | Create new project |
| `create_branch` | Create isolated branch |
| `get_database_tables` | List tables |
| `run_sql` | Execute SQL queries |
| `prepare_database_migration` | Create temp branch for schema changes |
| `complete_database_migration` | Apply migration to main |
| `list_slow_queries` | Surface performance issues |
| `explain_sql_statement` | Analyze query plans |
| `provision_neon_auth` | Set up Neon Auth |

## AI Rules Files

### CLAUDE.md

Create in your project root:

```markdown
# CLAUDE.md - Neon Project Configuration

## Database Configuration
- **Database**: Neon Serverless Postgres
- **Project ID**: [your-project-id]
- **ORM**: Drizzle

## Connection Setup
- Driver: `@neondatabase/serverless`
- Connection Pooling: Enabled

## Environment Variables
DATABASE_URL=postgresql://...       # Pooled connection
DATABASE_URL_UNPOOLED=postgresql://...  # Direct (migrations)

## Best Practices
- Use branching for schema changes
- Test migrations on dev branch first
- Use connection pooling for serverless
- Leverage MCP server for database operations

## Neon MCP Commands
- Branch creation: Use `create_branch` tool
- Migrations: Use `prepare_database_migration` for safety
- Query tuning: Use `explain_sql_statement` for analysis
```

### .cursorrules

```markdown
# Neon PostgreSQL Development Rules

## Database Connection
- Always use `@neondatabase/serverless` driver
- Use pooled connections by default
- Use unpooled only for migrations

## Schema Changes
- Never run migrations directly on production
- Use Neon branching to test schema changes

## Query Patterns
- Use parameterized queries
- Prefer template literals: sql`SELECT * FROM users WHERE id = ${id}`

## Neon Auth
- Auth data in neon_auth schema
- Use @neondatabase/neon-js for unified auth + data
```

## Example AI Prompts

```
"Create a new Neon branch called 'feature-auth' from main"

"Show me the tables in my database"

"Run this SQL: SELECT COUNT(*) FROM users"

"Explain this query's performance: SELECT * FROM orders JOIN users ON ..."

"Set up Neon Auth for my project"
```

## Plugin MCP Configuration

This plugin includes MCP configuration at `${CLAUDE_PLUGIN_ROOT}/.mcp.json`:

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon", "start", "${NEON_API_KEY}"]
    }
  }
}
```

Set `NEON_API_KEY` environment variable to enable.
