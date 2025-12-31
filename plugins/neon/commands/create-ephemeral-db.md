---
name: create-ephemeral-db
description: Create an ephemeral Neon database for testing
allowed-tools:
  - Read
  - Bash
argument-hint: "[name]"
---

# Create Ephemeral Database

Create an isolated ephemeral Neon database for testing purposes.

## Instructions

1. Check that NEON_API_KEY environment variable is set:
   ```bash
   echo $NEON_API_KEY
   ```
   If not set, inform user they need to set it:
   - Get API key from Neon Console: Account settings > API keys
   - Set: `export NEON_API_KEY="your_key"`

2. Determine the database name:
   - If argument provided, use it as the name
   - Otherwise, generate: `ephemeral-{timestamp}`

3. Run the ephemeral database creation script:
   ```bash
   npx tsx ${CLAUDE_PLUGIN_ROOT}/scripts/create-ephemeral-db.ts [name]
   ```

4. Capture the output which includes:
   - Connection string (printed to stdout)
   - Project ID (for cleanup)

5. Display the results to the user:
   ```
   Ephemeral database created!

   Connection String:
   postgresql://...

   To use:
   export DATABASE_URL="<connection_string>"

   To cleanup when done:
   /neon:destroy-ephemeral-db <project-id>
   ```

6. Optionally, if the user wants to run migrations:
   - Ask if they want to apply current migrations
   - Run `npm run db:migrate` with the new DATABASE_URL

## Tips

- Ephemeral databases are perfect for CI/CD and testing
- Each ephemeral database is a full Neon project
- Remember to clean up after testing to avoid unused resources
- For branch-based testing with existing data, use Neon branching instead
- Reference neon-toolkit skill for detailed documentation
