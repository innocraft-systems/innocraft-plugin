/**
 * Neon Auth API Route Handler
 *
 * File: app/api/auth/[...path]/route.ts
 *
 * This handles all auth-related API requests
 */

import { authApiHandler } from '@neondatabase/neon-js/auth/next';

export const { GET, POST } = authApiHandler();
