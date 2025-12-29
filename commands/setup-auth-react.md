---
name: setup-auth-react
description: Set up Neon Auth for a React SPA (Vite)
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: ""
---

# Setup Neon Auth for React SPA

Set up complete Neon Auth integration for a React SPA using Vite.

## Instructions

1. Verify this is a Vite React project:
   - Check for `vite.config.ts` or `vite.config.js`
   - Check for React in package.json dependencies

2. Install required dependencies:
   ```bash
   npm install @neondatabase/neon-js react-router-dom
   ```

3. Create the auth client at `src/auth.ts`:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/react-spa-auth/auth.ts`

4. Update `src/main.tsx`:
   - Add NeonAuthUIProvider wrapper
   - Add BrowserRouter for routing
   - Import CSS: `import '@neondatabase/neon-js/ui/css'`
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/react-spa-auth/main.tsx`
   - Ask user which OAuth providers they want (Google, GitHub, Microsoft)

5. Update or create `src/App.tsx`:
   - Add auth routes (/auth/:pathname, /account/:pathname)
   - Add protected route examples
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/react-spa-auth/App.tsx`

6. Update environment variables:
   - Create or update `.env`:
     ```
     VITE_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth
     ```
   - Add to `.env.example` as well

7. Print next steps:
    - Get Auth URL from Neon Console (Auth > Configuration)
    - Set VITE_NEON_AUTH_URL in .env
    - Configure OAuth providers in Neon Console if using social login
    - Run `npm run dev` and navigate to /auth/sign-up to test

## Tips

- React SPA uses client-side routing with react-router-dom
- Use SignedIn/SignedOut components for conditional rendering
- Use RedirectToSignIn for automatic redirects
- Reference neon-auth skill for detailed documentation
