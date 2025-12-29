---
name: setup-serverless
description: Set up Neon serverless driver for edge functions and serverless environments
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[vercel-edge | cloudflare | lambda]"
---

# Setup Neon Serverless Driver

Set up the Neon serverless driver for edge and serverless environments.

## Instructions

1. Install the serverless driver:
   ```bash
   npm install @neondatabase/serverless
   ```

2. Determine the target environment from argument or ask user:
   - `vercel-edge` - Vercel Edge Functions
   - `cloudflare` - Cloudflare Workers
   - `lambda` - AWS Lambda
   - Generic serverless (default)

3. Create a database client file based on environment:

   For Vercel Edge (`lib/db.ts`):
   ```typescript
   import { neon } from '@neondatabase/serverless';

   export const sql = neon(process.env.DATABASE_URL!);

   // For queries:
   // const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
   ```

   For Cloudflare Workers (`src/db.ts`):
   ```typescript
   import { Client } from '@neondatabase/serverless';

   export function createClient(databaseUrl: string) {
     return new Client(databaseUrl);
   }
   ```

   For Lambda or generic (`lib/db.ts`):
   ```typescript
   import { Pool, neonConfig } from '@neondatabase/serverless';
   import ws from 'ws';

   neonConfig.webSocketConstructor = ws;

   export const pool = new Pool({
     connectionString: process.env.DATABASE_URL!,
   });
   ```

4. Create an example API route appropriate for the platform:
   - Vercel: `app/api/example/route.ts` or `pages/api/example.ts`
   - Cloudflare: `src/index.ts` worker
   - Lambda: `handler.ts`

5. Update environment configuration:
   - Add DATABASE_URL to `.env.example`
   - For Vercel: mention adding to Vercel project settings
   - For Cloudflare: mention wrangler.toml secrets
   - For Lambda: mention AWS Secrets Manager or env vars

6. Print next steps and recommendations:
   - Use HTTP adapter for single queries (lowest latency)
   - Use WebSocket/Pool for transactions
   - Use connection pooling (-pooler endpoint) for high concurrency

## Tips

- HTTP connections are stateless and ideal for edge
- WebSocket connections support interactive transactions
- Always use parameterized queries to prevent SQL injection
- Reference neon-serverless skill for detailed documentation
