/**
 * Neon Auth Client for Next.js
 *
 * File: lib/auth-client.ts
 */
"use client"

import { createAuthClient } from '@neondatabase/neon-js/auth';

if (!process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
  throw new Error('NEXT_PUBLIC_NEON_AUTH_URL environment variable is required');
}

export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_NEON_AUTH_URL
);
