---
name: setup-auth-nextjs
description: Set up Neon Auth for a Next.js App Router application
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--with-middleware]"
---

# Setup Neon Auth for Next.js

Set up complete Neon Auth integration for a Next.js App Router application.

## Instructions

1. Verify this is a Next.js project with App Router:
   - Check for `next.config.js` or `next.config.mjs`
   - Check for `app/` directory

2. Install the Neon JS SDK:
   ```bash
   npm install @neondatabase/neon-js
   ```

3. Create the auth client at `lib/auth-client.ts`:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs-auth/auth-client.ts`

4. Create the API route handler at `app/api/auth/[...path]/route.ts`:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs-auth/route.ts`

5. Create the auth provider at `app/providers.tsx`:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs-auth/providers.tsx`
   - Ask user which OAuth providers they want (Google, GitHub, Microsoft)

6. Update the root layout at `app/layout.tsx`:
   - Add `import '@neondatabase/neon-js/ui/css'`
   - Wrap children with `<AuthProvider>`
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs-auth/layout.tsx`

7. Create auth pages at `app/auth/[path]/page.tsx`:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs-auth/auth-page.tsx`

8. If `--with-middleware` flag or user wants protected routes:
   - Create `middleware.ts` at project root
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/nextjs-auth/middleware.ts`
   - Ask which routes to protect

9. Update environment variables:
   - Add to `.env.local`:
     ```
     NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth
     NEXT_PUBLIC_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth
     ```
   - Add to `.env.example` as well

10. Print next steps:
    - Get Auth URL from Neon Console (Auth > Configuration)
    - Set environment variables
    - Configure OAuth providers in Neon Console if using social login
    - Navigate to /auth/sign-up to test

## Tips

- Neon Auth uses Better Auth under the hood
- Auth data lives in `neon_auth` schema in your database
- Auth branches with your database for preview environments
- Reference neon-auth skill for detailed documentation
