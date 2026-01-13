---
name: neon-drizzle
description: This skill provides guidance for setting up Drizzle ORM with Neon serverless PostgreSQL. Use when the user asks about "Drizzle with Neon", "Neon ORM setup", "drizzle-orm neon", "schema definitions", "database migrations with Neon", "drizzle-kit configuration", or needs help with HTTP vs WebSocket adapters for Neon.
---

# Drizzle ORM with Neon

Set up type-safe database access using Drizzle ORM with Neon's serverless PostgreSQL.

## Installation

```bash
# HTTP adapter (serverless/edge)
npm install drizzle-orm @neondatabase/serverless dotenv
npm install -D drizzle-kit tsx

# Additional for WebSocket (Node.js servers)
npm install ws bufferutil
npm install -D @types/ws
```

## Project Structure

```
project-root/
├── drizzle/              # Generated migrations
├── src/
│   ├── db/
│   │   ├── schema.ts     # Schema definitions
│   │   └── index.ts      # Database client
│   └── index.ts
├── .env
├── drizzle.config.ts
└── package.json
```

## Configuration

Create `drizzle.config.ts`:

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

Add to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Connection Adapters

### HTTP Adapter (Serverless/Edge)

Use for Vercel Edge, Cloudflare Workers, single-query operations:

```typescript
import { drizzle } from 'drizzle-orm/neon-http';

const db = drizzle(process.env.DATABASE_URL!);
```

### WebSocket Adapter (Transactions/Sessions)

Use for interactive transactions, long-running servers:

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  ws: ws,
});
```

## Schema Definition

```typescript
// src/db/schema.ts
import { pgTable, serial, text, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  authorId: integer('author_id').references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

// Type inference
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
```

## Query Examples

```typescript
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// Insert
const newUser = await db.insert(users)
  .values({ name: 'John', email: 'john@example.com' })
  .returning();

// Select
const allUsers = await db.select().from(users);

// Update
await db.update(users)
  .set({ name: 'Jane' })
  .where(eq(users.email, 'john@example.com'));

// Delete
await db.delete(users)
  .where(eq(users.email, 'john@example.com'));
```

## Migration Commands

| Command | Purpose |
|---------|---------|
| `npx drizzle-kit generate` | Create migration files from schema |
| `npx drizzle-kit migrate` | Apply migrations to database |
| `npx drizzle-kit push` | Push schema directly (dev only) |
| `npx drizzle-kit studio` | Open visual database browser |

## Templates

Reference templates at `${CLAUDE_PLUGIN_ROOT}/templates/drizzle/`:
- `drizzle.config.ts` - Complete Drizzle Kit configuration
- `schema.ts` - Example schema with RLS policies
- `github-actions.yml` - CI/CD workflow with Neon branching

## Detailed Reference

See [references/drizzle-detailed.md](references/drizzle-detailed.md) for:
- WebSocket pool configuration
- HTTP transactions
- Migration workflows
- Troubleshooting common issues
