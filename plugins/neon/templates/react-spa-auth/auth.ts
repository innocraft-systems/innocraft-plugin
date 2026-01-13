/**
 * Neon Auth Client for React SPA
 *
 * File: src/auth.ts
 */

import { createAuthClient } from '@neondatabase/neon-js/auth';

if (!import.meta.env.VITE_NEON_AUTH_URL) {
  throw new Error('VITE_NEON_AUTH_URL environment variable is required');
}

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);
