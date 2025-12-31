---
name: setup-mcp
description: Set up Neon MCP server for AI assistant integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[cursor | claude-desktop | claude-code]"
---

# Setup Neon MCP Server

Configure the Neon MCP server for AI assistant integration.

## Instructions

1. Determine the target platform:
   - `cursor` → Configure for Cursor IDE
   - `claude-desktop` → Configure for Claude Desktop app
   - `claude-code` → Configure for Claude Code CLI
   - No argument → Ask user which platform(s) they use

2. Check if NEON_API_KEY is available:
   - If not set, guide user to get one from Neon Console
   - Account settings > API keys > Generate new API key

3. For **Cursor**:
   - Create `.cursor/mcp.json`:
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

4. For **Claude Desktop**:
   - Detect OS and locate config file:
     - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
     - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Add or merge configuration:
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

5. For **Claude Code CLI**:
   - Create or update `.mcp.json` at project root:
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
   - Remind user to set NEON_API_KEY environment variable

6. Alternatively, offer quick setup option:
   ```bash
   npx neonctl@latest init
   ```
   This automatically:
   - Authenticates via OAuth
   - Creates API key
   - Configures all supported tools

7. List available MCP tools for reference:
   - `list_projects` - List Neon projects
   - `create_project` - Create new project
   - `create_branch` - Create isolated branch
   - `run_sql` - Execute SQL queries
   - `get_database_tables` - List tables
   - `prepare_database_migration` - Safe migration workflow
   - `explain_sql_statement` - Query analysis

8. Print confirmation and next steps:
   - Restart the AI tool to load MCP configuration
   - Test with: "List my Neon projects"
   - Reference neon-mcp skill for available commands

## Tips

- The hosted MCP at mcp.neon.tech uses OAuth authentication
- For local MCP server, you need NEON_API_KEY
- MCP allows AI assistants to directly interact with your database
- Reference neon-mcp skill for detailed documentation
