---
name: convex
description: Comprehensive Convex.dev backend development skill covering functions (queries, mutations, actions, HTTP actions), database (schema, indexes, reading/writing), Convex Auth (built-in authentication with OAuth, Magic Links, OTPs, Passwords), file storage, scheduling (cron jobs, scheduled functions), and components. Use when building full-stack apps with Convex, implementing authentication, creating real-time reactive backends, or working with Convex's document-relational database. Triggers on requests involving Convex setup, Convex Auth configuration, database schema design, backend functions, file uploads, or scheduled tasks.
---

# Convex Development Skill

Convex is an open-source, reactive backend platform where queries are TypeScript code running directly in the database. It provides a database, serverless functions, file storage, scheduling, and client libraries with real-time updates.

## Quick Start

```bash
# Create new project
npm create convex@latest

# Or add to existing project
npm install convex
npx convex dev
```

## Project Structure

```
my-app/
├── convex/
│   ├── _generated/      # Auto-generated types and API
│   ├── schema.ts        # Database schema (optional but recommended)
│   ├── auth.ts          # Convex Auth config (if using)
│   ├── auth.config.ts   # Third-party auth config (Clerk/Auth0)
│   ├── http.ts          # HTTP action routes
│   ├── crons.ts         # Cron job definitions
│   └── *.ts             # Your functions
├── src/
│   └── ...              # Frontend code
└── convex.json
```

## Core Concepts

### Functions Overview

| Type | Purpose | Database | External APIs | Transactional |
|------|---------|----------|---------------|---------------|
| **Query** | Read data | Read-only | ❌ | ✅ |
| **Mutation** | Write data | Read/Write | ❌ | ✅ |
| **Action** | External calls | Via runQuery/runMutation | ✅ | ❌ |
| **HTTP Action** | REST endpoints | Via runQuery/runMutation | ✅ | ❌ |

### Basic Query

```typescript
// convex/tasks.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .order("desc")
      .take(args.limit ?? 50);
  },
});
```

### Basic Mutation

```typescript
// convex/tasks.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { text: v.string(), completed: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("tasks", {
      text: args.text,
      completed: args.completed ?? false,
    });
    return id;
  },
});
```

### Basic Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_completed", ["completed"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
});
```

### React Client Usage

```typescript
// src/App.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const tasks = useQuery(api.tasks.list, { limit: 10 });
  const createTask = useMutation(api.tasks.create);

  return (
    <div>
      {tasks?.map((task) => <div key={task._id}>{task.text}</div>)}
      <button onClick={() => createTask({ text: "New task" })}>
        Add Task
      </button>
    </div>
  );
}
```

## Authentication Options

### Option 1: Convex Auth (Built-in, Self-hosted)
Use for full control over auth data within Convex. Supports OAuth, Magic Links, OTPs, Passwords.
See: `references/convex-auth.md`

### Option 2: Clerk Integration
Use for managed auth with rich UI components.
See: `references/third-party-auth.md`

### Option 3: Auth0 Integration
Use for enterprise auth requirements.
See: `references/third-party-auth.md`

## Reference Documentation

For detailed guidance on specific topics, read these reference files:

- **`references/convex-auth.md`** - Convex Auth setup, OAuth, passwords, magic links
- **`references/functions.md`** - Queries, mutations, actions, HTTP actions, internal functions
- **`references/database.md`** - Schema, data types, indexes, reading/writing data
- **`references/scheduling.md`** - Cron jobs, scheduled functions, workpool
- **`references/file-storage.md`** - File uploads, downloads, storage APIs
- **`references/third-party-auth.md`** - Clerk and Auth0 integration

## Common Patterns

### Authenticated Function

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createPost = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    return await ctx.db.insert("posts", {
      content: args.content,
      authorId: identity.tokenIdentifier,
    });
  },
});
```

### Using Index for Efficient Queries

```typescript
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
```

### Scheduling from Mutation

```typescript
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendEmailLater = mutation({
  args: { to: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    // Schedule action to run in 5 minutes
    await ctx.scheduler.runAfter(
      5 * 60 * 1000,
      internal.emails.send,
      { to: args.to, content: args.content }
    );
  },
});
```

### Action Calling External API

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const fetchWeather = action({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch(
      `https://api.weather.com/v1?city=${args.city}`
    );
    const data = await response.json();
    
    // Save to database via mutation
    await ctx.runMutation(internal.weather.save, {
      city: args.city,
      data,
    });
    
    return data;
  },
});
```

## Validators Reference

```typescript
import { v } from "convex/values";

// Primitives
v.string()
v.number()
v.boolean()
v.null()
v.int64()
v.bytes()

// Complex
v.array(v.string())
v.object({ name: v.string(), age: v.number() })
v.union(v.string(), v.number())
v.literal("active")
v.optional(v.string())
v.nullable(v.string())  // 1.29.0+ (shorthand for v.union(v.string(), v.null()))

// Convex-specific
v.id("tableName")
v.any()

// Validator helpers (1.29.0+)
myValidator.pick("field1", "field2")
myValidator.omit("field")
myValidator.extend({ newField: v.string() })
myValidator.partial()
```

## CLI Commands

```bash
npx convex dev          # Start dev server with file watching
npx convex deploy       # Deploy to production
npx convex env set KEY value  # Set environment variable
npx convex logs         # Stream function logs
npx convex import data.zip    # Import data
npx convex export       # Export data

# ESLint plugin (recommended)
npm install --save-dev @convex-dev/eslint-plugin
npx eslint . --fix      # Auto-fix Convex best practices

# Database API migration (1.31.0+)
npx @convex-dev/codemod@latest explicit-ids  # Migrate to new db.get/patch/delete API
```

## Version Notes

**convex 1.31.0+ (Dec 2025):** `db.get`, `db.patch`, `db.replace`, `db.delete` now take table name as first argument:
```typescript
// New API (recommended)
await ctx.db.get("users", userId);
await ctx.db.patch("users", userId, { name: "Alice" });
await ctx.db.delete("users", userId);

// Old API still works but deprecated
await ctx.db.get(userId);
```

## Best Practices

1. **Always use indexes** for queries filtering large tables
2. **Use internal functions** for scheduled/cron jobs (not public `api.*`)
3. **Await all promises** in mutations to avoid missed writes
4. **Keep actions small** - do external work only, database via mutations
5. **Use argument validators** (`args: { ... }`) for type safety
6. **Define schema** once your data model stabilizes
7. **Use optimistic updates** for responsive UI
8. **Use ESLint plugin** for Convex best practices (`@convex-dev/eslint-plugin`)
9. **Use new db API** with explicit table names (`db.get("table", id)`)
10. **Use staged indexes** for large tables to avoid blocking deployments
