/**
 * Auth Page Component
 *
 * File: app/auth/[path]/page.tsx
 *
 * Handles: /auth/sign-in, /auth/sign-up, /auth/forgot-password, etc.
 */

import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

interface AuthPageProps {
  params: Promise<{ path: string }>;
}

export default async function AuthPage({ params }: AuthPageProps) {
  const { path } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthView path={path} />
    </main>
  );
}

// Generate static params for common auth routes
export function generateStaticParams() {
  return [
    { path: 'sign-in' },
    { path: 'sign-up' },
    { path: 'forgot-password' },
    { path: 'reset-password' },
    { path: 'verify-email' },
  ];
}
