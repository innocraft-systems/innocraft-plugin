/**
 * Neon Auth Middleware for Next.js
 *
 * File: middleware.ts (in project root)
 *
 * Protects routes at the edge, redirecting unauthenticated users
 */

import { neonAuthMiddleware } from '@neondatabase/neon-js/auth/next';

export default neonAuthMiddleware({
  // Redirect unauthenticated users to this URL
  loginUrl: '/auth/sign-in',
});

export const config = {
  // Protect these routes (customize as needed)
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/account/:path*',
    '/api/protected/:path*',
  ],
};
