---
description: Run Drizzle migrations on your Neon database. Supports generate, migrate, push, and studio commands with proper connection handling.
---

# Neon Migrate Command

Manage database migrations for Neon PostgreSQL using Drizzle Kit.

## Instructions

1. **Determine the requested operation**:
   - `generate` - Create migration files from schema changes
   - `migrate` - Apply pending migrations to database
   - `push` - Push schema directly (development only)
   - `studio` - Open Drizzle Studio visual browser

2. **Verify prerequisites**:
   - Check that `drizzle.config.ts` exists
   - Ensure `DATABASE_URL` environment variable is set
   - Confirm drizzle-kit is installed

3. **For generate**:
   ```bash
   npx drizzle-kit generate
   ```
   This creates migration SQL files in the `drizzle/` directory.

4. **For migrate**:
   ```bash
   npx drizzle-kit migrate
   ```
   This applies migrations using the **direct** connection (not pooled).

5. **For push** (dev only):
   ```bash
   npx drizzle-kit push
   ```
   Warn user this should only be used in development.

6. **For studio**:
   ```bash
   npx drizzle-kit studio
   ```
   Opens browser-based database explorer at https://local.drizzle.studio

## Important Notes

- **Migrations require direct connection**: Use the non-pooler endpoint
- **Always backup before migrate**: Neon has point-in-time recovery
- **Use branching for testing**: Create a branch to test migrations first

## Connection String Format

```
# Pooled (for app queries) - has "-pooler" in hostname
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb

# Direct (for migrations) - no "-pooler"
postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb
```

## Drizzle Config Reference

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Output

After operation completes:
- Show any generated migration files
- Confirm migration success/failure
- Display next steps if applicable
