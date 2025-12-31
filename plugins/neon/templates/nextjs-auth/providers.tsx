/**
 * Neon Auth Provider for Next.js
 *
 * File: app/providers.tsx
 */
"use client"

import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}

      // Navigation integration
      navigate={router.push}
      replace={router.replace}
      Link={Link}

      // Session handling
      onSessionChange={() => router.refresh()}

      // OAuth providers (customize as needed)
      social={{ providers: ['google', 'github'] }}

      // Redirect after auth
      redirectTo="/dashboard"

      // Enable password reset
      credentials={{ forgotPassword: true }}

      // Enable email OTP verification
      emailOTP
    >
      {children}
    </NeonAuthUIProvider>
  );
}
