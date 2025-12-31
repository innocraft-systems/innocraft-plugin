---
name: add-docs
description: Add Neon best practices documentation to the project
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
argument-hint: "[claude.md | cursorrules | agents.md]"
---

# Add Neon Documentation

Add Neon best practices and AI rules files to the project.

## Instructions

1. Determine which documentation to add:
   - If argument is `claude.md` → Create CLAUDE.md only
   - If argument is `cursorrules` → Create .cursorrules only
   - If argument is `agents.md` → Create AGENTS.md only
   - If no argument → Ask user which files they want, or create all

2. Check for existing files and ask before overwriting.

3. Create CLAUDE.md at project root:
   ```markdown
   # CLAUDE.md - Neon Project Configuration

   ## Database Configuration
   - **Database**: Neon Serverless Postgres
   - **Project ID**: [Get from Neon Console]
   - **ORM**: [Drizzle/Prisma/None]

   ## Connection Setup
   - Driver: `@neondatabase/serverless`
   - Connection Pooling: Enabled (use -pooler hostname)

   ## Environment Variables
   ```
   DATABASE_URL=postgresql://...       # Pooled connection
   DATABASE_URL_UNPOOLED=postgresql://...  # Direct (migrations)
   ```

   ## Best Practices
   - Use branching for schema changes
   - Test migrations on dev branch first
   - Use connection pooling for serverless deployments
   - Leverage MCP server for database operations

   ## Neon MCP Commands
   - Branch creation: Use `create_branch` tool
   - Migrations: Use `prepare_database_migration` for safety
   - Query tuning: Use `explain_sql_statement` for analysis
   ```

4. Create .cursorrules at project root:
   ```markdown
   # Neon PostgreSQL Development Rules

   ## Database Connection
   - Always use `@neondatabase/serverless` driver
   - Use pooled connections by default (DATABASE_URL)
   - Use unpooled connections only for migrations

   ## Schema Changes
   - Never run migrations directly on production
   - Use Neon branching to test schema changes

   ## Query Patterns
   - Use parameterized queries
   - Prefer template literals: sql`SELECT * FROM users WHERE id = ${id}`
   - Use transactions for multi-step operations

   ## Neon Auth
   - Auth data in neon_auth schema
   - Use @neondatabase/neon-js for unified auth + data
   ```

5. Create AGENTS.md at project root:
   ```markdown
   # AGENTS.md - Neon Database Agent Instructions

   ## Database Operations
   1. **Creating Tables**: Include indexes on foreign keys
   2. **Migrations**: Use `prepare_database_migration` to test first
   3. **Queries**: Use `explain_sql_statement` for complex queries

   ## Branch Workflow
   1. Create branch from main
   2. Make changes on branch
   3. Test thoroughly
   4. Apply to main: `complete_database_migration`
   ```

6. Print confirmation of created files.

## Tips

- These files help AI assistants understand your Neon setup
- Customize the content based on your specific project structure
- Reference neon-mcp skill for MCP configuration details
