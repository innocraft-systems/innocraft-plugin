---
name: setup-neon-js
description: Set up the unified Neon JS SDK with auth and data API
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--generate-types]"
---

# Setup Neon JS SDK

Set up the unified Neon JS SDK for combined authentication and database operations.

## Instructions

1. Install the Neon JS SDK:
   ```bash
   npm install @neondatabase/neon-js
   ```

2. Determine if this is Next.js or Vite/React:
   - Check for `next.config.js` → Next.js
   - Check for `vite.config.ts` → Vite

3. Create the client configuration:

   For Next.js (`lib/neon-client.ts`):
   ```typescript
   import { createClient } from '@neondatabase/neon-js';

   export const client = createClient({
     auth: {
       url: process.env.NEXT_PUBLIC_NEON_AUTH_URL!,
     },
     dataApi: {
       url: process.env.NEON_DATA_API_URL!,
     },
   });
   ```

   For Vite (`src/neon-client.ts`):
   ```typescript
   import { createClient } from '@neondatabase/neon-js';

   export const client = createClient({
     auth: {
       url: import.meta.env.VITE_NEON_AUTH_URL,
     },
     dataApi: {
       url: import.meta.env.VITE_NEON_DATA_API_URL,
     },
   });
   ```

4. Update environment variables:

   For Next.js (`.env.local`):
   ```
   NEXT_PUBLIC_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/dbname/auth
   NEON_DATA_API_URL=https://ep-xxx.apirest.us-east-2.aws.neon.build/dbname/rest/v1
   ```

   For Vite (`.env`):
   ```
   VITE_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/dbname/auth
   VITE_NEON_DATA_API_URL=https://ep-xxx.apirest.us-east-2.aws.neon.build/dbname/rest/v1
   ```

5. If `--generate-types` flag, generate TypeScript types:
   ```bash
   npx @neondatabase/neon-js gen-types \
     --db-url "$DATABASE_URL" \
     --output src/types/database.ts
   ```

   Then update the client to use types:
   ```typescript
   import type { Database } from './types/database';
   const client = createClient<Database>({...});
   ```

6. Create example usage file showing common operations:
   - Select queries with filters
   - Insert with returning
   - Update and delete
   - Using with auth (JWT auto-injection)

7. Print next steps:
   - Get Auth URL and Data API URL from Neon Console
   - Set environment variables
   - Use `client.from('table').select()` for queries
   - Auth is automatically handled when user signs in

## Tips

- The Neon JS SDK provides a Supabase-compatible API
- JWTs from auth are automatically included in database requests
- Use gen-types for full TypeScript autocomplete
- Reference neon-js skill for detailed documentation
