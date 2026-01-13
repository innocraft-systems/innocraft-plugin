---
name: neon-js
description: This skill covers the Neon JS SDK (@neondatabase/neon-js) which provides a unified client for authentication and database operations. Use when the user asks about "Neon JS SDK", "unified Neon client", "auth and data client", "PostgREST-style queries", "Supabase-like API with Neon", "type-safe database queries", or needs a combined auth + data solution.
---

# Neon JS SDK

The `@neondatabase/neon-js` package is the unified SDK combining authentication and database operations with a Supabase-compatible API.

## Installation

```bash
npm install @neondatabase/neon-js
```

## Environment Variables

```env
# Next.js
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/dbname/auth
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/dbname/auth
NEON_DATA_API_URL=https://ep-xxx.apirest.us-east-2.aws.neon.build/dbname/rest/v1

# Vite/React
VITE_NEON_AUTH_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/dbname/auth
VITE_NEON_DATA_API_URL=https://ep-xxx.apirest.us-east-2.aws.neon.build/dbname/rest/v1
```

## Client Setup

```typescript
import { createClient } from '@neondatabase/neon-js';
import type { Database } from './types/database';

const client = createClient<Database>({
  auth: {
    url: import.meta.env.VITE_NEON_AUTH_URL,
  },
  dataApi: {
    url: import.meta.env.VITE_NEON_DATA_API_URL,
  },
});

export { client };
```

## Database Queries

### Select

```typescript
// Basic select
const { data, error } = await client.from('users').select('*');

// With filters
const { data } = await client
  .from('users')
  .select('id, name, email')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Insert

```typescript
const { data, error } = await client
  .from('todos')
  .insert({ title: 'Buy groceries', completed: false })
  .select();
```

### Update

```typescript
const { data, error } = await client
  .from('todos')
  .update({ completed: true })
  .eq('id', 1)
  .select();
```

### Delete

```typescript
const { error } = await client
  .from('todos')
  .delete()
  .eq('id', 1);
```

## Filter Methods

```typescript
// Equality
.eq('column', value)
.neq('column', value)

// Comparison
.gt('column', value)      // greater than
.gte('column', value)     // greater than or equal
.lt('column', value)      // less than
.lte('column', value)     // less than or equal

// Pattern matching
.like('column', '%pattern%')
.ilike('column', '%pattern%')  // case insensitive

// Arrays
.in('column', [1, 2, 3])

// Null checks
.is('column', null)

// Combining
.or('status.eq.active,status.eq.pending')
```

## TypeScript Types

Generate types from your database:

```bash
npx @neondatabase/neon-js gen-types \
  --db-url "postgresql://user:pass@host/db" \
  --output src/types/database.ts
```

Use generated types:

```typescript
import type { Database } from './types/database';
import { createClient } from '@neondatabase/neon-js';

const client = createClient<Database>({...});

// Fully typed queries with autocomplete
const { data } = await client
  .from('users')
  .select('id, name, email')
  .eq('status', 'active');
```

## Auth + Data Integration

JWTs from Neon Auth are automatically included in database queries:

```typescript
// Sign in
await client.auth.signIn.email({
  email: 'user@example.com',
  password: 'password',
});

// Query with automatic authentication
// JWT automatically injected - RLS policies applied
const { data } = await client.from('todos').select('*');
```

## React Hooks

```typescript
import { useSession, useUser } from '@neondatabase/neon-js/auth/react';

function Profile() {
  const { data: session, isPending } = useSession();
  const user = useUser();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Welcome, {user?.name}</div>;
}
```

## RPC (Stored Procedures)

```typescript
const { data, error } = await client.rpc('get_user_stats', {
  user_id: 123,
  start_date: '2024-01-01',
});
```

## Related Packages

| Package | Purpose |
|---------|---------|
| `@neondatabase/neon-js` | Unified SDK |
| `@neondatabase/neon-js/auth` | Auth client |
| `@neondatabase/neon-js/auth/react` | React hooks |
| `@neondatabase/neon-js/auth/react/ui` | Pre-built UI |
| `@neondatabase/neon-js/auth/next` | Next.js integration |
| `@neondatabase/neon-js/ui/css` | CSS styles |
