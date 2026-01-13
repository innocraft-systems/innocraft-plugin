---
name: neon-serverless
description: This skill covers the Neon serverless driver (@neondatabase/serverless) for connecting to Neon PostgreSQL. Use when the user asks about "serverless driver", "Neon HTTP connection", "WebSocket connection", "edge function database", "Vercel Edge with Neon", "Cloudflare Workers database", or needs help choosing between HTTP and WebSocket adapters.
---

# Neon Serverless Driver

The `@neondatabase/serverless` package provides HTTP and WebSocket connection modes optimized for serverless environments.

## Installation

```bash
npm install @neondatabase/serverless
```

## HTTP Connections (Single Queries)

Fastest option for stateless, one-shot queries in edge runtimes:

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Template literal syntax (parameterized, safe)
const userId = 1;
const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

### Configuration Options

```typescript
const sql = neon(process.env.DATABASE_URL!, {
  arrayMode: true,      // Returns arrays instead of objects
  fullResults: true,    // Includes metadata (rowCount, command)
});
```

### HTTP Transactions (Non-Interactive)

```typescript
const sql = neon(process.env.DATABASE_URL!);

const [posts, tags] = await sql.transaction([
  sql`SELECT * FROM posts ORDER BY created_at DESC LIMIT 10`,
  sql`SELECT * FROM tags`
], {
  isolationLevel: 'RepeatableRead',
  readOnly: true,
});
```

## WebSocket Connections (Transactions)

Use for interactive transactions and full `node-postgres` compatibility:

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws; // Required for Node.js

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [1]);

await pool.end();
```

### Interactive Transactions

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');

  const { rows: [{ id }] } = await client.query(
    'INSERT INTO posts (title) VALUES ($1) RETURNING id',
    ['My Post']
  );

  await client.query(
    'INSERT INTO comments (post_id, text) VALUES ($1, $2)',
    [id, 'First comment']
  );

  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

## Edge Function Examples

### Vercel Edge

```typescript
import { Pool } from '@neondatabase/serverless';

export default async (req: Request, ctx: any) => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query('SELECT * FROM posts');
    return new Response(JSON.stringify(rows), {
      headers: { 'content-type': 'application/json' }
    });
  } finally {
    ctx.waitUntil(pool.end());
  }
};

export const config = { runtime: 'edge' };
```

### Cloudflare Workers

```typescript
import { Client } from '@neondatabase/serverless';

export default {
  async fetch(request: Request, env: any) {
    const client = new Client(env.DATABASE_URL);
    await client.connect();

    const { rows } = await client.query('SELECT * FROM users');

    return new Response(JSON.stringify(rows));
  },
};
```

## When to Use Each Mode

| Mode | Best For | Latency | Features |
|------|----------|---------|----------|
| HTTP | Single queries, edge functions | Lowest | Template literals, non-interactive transactions |
| WebSocket | Interactive transactions, sessions | Higher | Full pg compatibility, prepared statements |

## Connection String Format

```
postgresql://[user]:[password]@[endpoint]/[dbname]?sslmode=require
```

**Pooled (serverless, up to 10k connections):**
```
postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb
```

**Direct (migrations/admin):**
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
```

## See Also

- [references/serverless-detailed.md](references/serverless-detailed.md) for advanced patterns
