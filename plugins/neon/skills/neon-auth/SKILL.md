---
name: neon-auth
description: This skill covers Neon Auth, the authentication system built on Better Auth. Use when the user asks about "Neon authentication", "Neon Auth setup", "Better Auth with Neon", "user authentication", "social login with Neon", "OAuth with Neon", "row-level security", "RLS policies", or needs to add authentication to a Next.js or React application using Neon.
---

# Neon Auth (Better Auth Foundation)

Neon Auth provides authentication built on Better Auth, with auth data stored directly in your database's `neon_auth` schema.

## Key Features

- **Auth branches with database**: Test full auth flows in preview environments
- **Query users with SQL**: All auth data in `neon_auth` schema
- **Single source of truth**: Your Neon database

## Installation

```bash
npm install @neondatabase/neon-js
```

## Environment Variables

```env
# Next.js
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth

# Vite/React
VITE_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth
```

Find your Auth URL in Neon Console under **Auth > Configuration**.

## Next.js App Router Setup

### 1. Create Auth Client

```typescript
// lib/auth-client.ts
"use client"
import { createAuthClient } from '@neondatabase/neon-js/auth';

export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_NEON_AUTH_URL!
);
```

### 2. Create API Route Handler

```typescript
// app/api/auth/[...path]/route.ts
import { authApiHandler } from '@neondatabase/neon-js/auth/next';

export const { GET, POST } = authApiHandler();
```

### 3. Create Auth Provider

```typescript
// app/providers.tsx
"use client"
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      Link={Link}
      onSessionChange={() => router.refresh()}
      social={{ providers: ['google', 'github'] }}
      redirectTo="/dashboard"
      credentials={{ forgotPassword: true }}
      emailOTP
    >
      {children}
    </NeonAuthUIProvider>
  );
}
```

### 4. Setup Root Layout

```typescript
// app/layout.tsx
import '@neondatabase/neon-js/ui/css';
import { AuthProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### 5. Create Auth Pages

```typescript
// app/auth/[path]/page.tsx
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center">
      <AuthView path={path} />
    </main>
  );
}
```

### 6. Add Middleware (Optional)

```typescript
// middleware.ts
import { neonAuthMiddleware } from '@neondatabase/neon-js/auth/next';

export default neonAuthMiddleware({
  loginUrl: '/auth/sign-in',
});

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
```

## Row-Level Security with Drizzle

```typescript
import { sql } from 'drizzle-orm';
import { pgTable, text, boolean, bigint, timestamp } from 'drizzle-orm/pg-core';
import { authenticatedRole, authUid, crudPolicy } from 'drizzle-orm/neon';

export const todos = pgTable(
  'todos',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: text('user_id').notNull().default(sql`(auth.user_id())`),
    task: text('task').notNull(),
    isComplete: boolean('is_complete').notNull().default(false),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);
```

## Authentication Methods

```typescript
// Sign up
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'securepassword',
  name: 'New User',
});

// Sign in
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password',
});

// OAuth
await authClient.signIn.social({
  provider: 'github',
  callbackURL: '/auth/callback',
});

// Get session
const { data: session } = await authClient.getSession();

// Sign out
await authClient.signOut();
```

## Templates

Reference templates at `${CLAUDE_PLUGIN_ROOT}/templates/`:
- `nextjs-auth/` - Complete Next.js App Router setup
- `react-spa-auth/` - React SPA with Vite setup

## OAuth Providers

Pre-configured: **Google**, **GitHub**, **Microsoft**

Configure in Neon Console under **Auth > Configuration > OAuth**.
