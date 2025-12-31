---
name: setup-drizzle
description: Set up Drizzle ORM with Neon serverless PostgreSQL
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--http | --ws]"
---

# Setup Drizzle ORM with Neon

Set up a complete Drizzle ORM configuration for Neon serverless PostgreSQL.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the adapter type:
   - If `--http` flag: Use HTTP adapter (for serverless/edge)
   - If `--ws` flag: Use WebSocket adapter (for transactions)
   - Otherwise: Ask the user which adapter they prefer

3. Install required dependencies:
   ```bash
   npm install drizzle-orm @neondatabase/serverless dotenv
   npm install -D drizzle-kit tsx
   ```

4. For WebSocket adapter, also install:
   ```bash
   npm install ws bufferutil
   npm install -D @types/ws
   ```

5. Create the directory structure:
   - `src/db/schema.ts` - Schema definitions
   - `src/db/index.ts` - Database client
   - `drizzle.config.ts` - Drizzle Kit configuration

6. Use templates from `${CLAUDE_PLUGIN_ROOT}/templates/drizzle/`:
   - Copy and adapt `drizzle.config.ts`
   - Copy and adapt `schema.ts` as a starting point

7. Add scripts to package.json:
   ```json
   {
     "scripts": {
       "db:generate": "drizzle-kit generate",
       "db:migrate": "drizzle-kit migrate",
       "db:push": "drizzle-kit push",
       "db:studio": "drizzle-kit studio"
     }
   }
   ```

8. Create or update `.env.example` with required variables:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

9. Add `.env` to `.gitignore` if not already present.

10. Print next steps:
    - Set DATABASE_URL in .env
    - Define schema in src/db/schema.ts
    - Run `npm run db:generate` to create migrations
    - Run `npm run db:migrate` to apply migrations

## Tips

- Recommend HTTP adapter for Vercel Edge, Cloudflare Workers, or simple queries
- Recommend WebSocket adapter for interactive transactions or long-running servers
- Reference the neon-drizzle skill for detailed documentation
