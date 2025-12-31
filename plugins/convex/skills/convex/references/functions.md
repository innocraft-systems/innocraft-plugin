# Convex Functions Reference

## Function Types Overview

| Type | Constructor | Database | External APIs | Transactional | Use Case |
|------|-------------|----------|---------------|---------------|----------|
| Query | `query()` | Read-only | ❌ | ✅ | Read data, subscriptions |
| Mutation | `mutation()` | Read/Write | ❌ | ✅ | Write data |
| Action | `action()` | Via ctx.runQuery/runMutation | ✅ | ❌ | External API calls |
| HTTP Action | `httpAction()` | Via ctx.runQuery/runMutation | ✅ | ❌ | REST endpoints, webhooks |
| Internal | `internalQuery/Mutation/Action()` | Same as base type | Same | Same | Not exposed to clients |

## Queries

Queries are read-only functions that automatically cache and subscribe to changes.

### Basic Query

```typescript
// convex/tasks.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .order("desc")
      .take(args.limit ?? 50);
  },
});
```

### Query with Index

```typescript
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
```

### Query with Authentication

```typescript
export const myTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_token", (q) => 
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .collect();
  },
});
```

### Query Context Properties

```typescript
handler: async (ctx, args) => {
  // Database reader (read-only)
  ctx.db.query("table")
  ctx.db.get("table", id)  // 1.31.0+: table name first
  
  // Authentication
  await ctx.auth.getUserIdentity()
  
  // File storage (read-only)
  ctx.storage.getUrl(storageId)
  ctx.storage.getMetadata(storageId)
}
```

## Mutations

Mutations are transactional functions that can read and write data.

### Basic Mutation

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    text: v.string(),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("tasks", {
      text: args.text,
      completed: args.completed ?? false,
    });
    return id;
  },
});
```

### Update and Delete

```typescript
export const update = mutation({
  args: { 
    id: v.id("tasks"), 
    text: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // 1.31.0+: table name as first argument
    await ctx.db.patch("tasks", id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete("tasks", args.id);
  },
});

export const replace = mutation({
  args: { 
    id: v.id("tasks"),
    text: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...doc } = args;
    await ctx.db.replace("tasks", id, doc);
  },
});
```

### Mutation Context Properties

```typescript
handler: async (ctx, args) => {
  // Database writer (read + write) - 1.31.0+ syntax
  await ctx.db.insert("table", {...})
  await ctx.db.patch("table", id, {...})
  await ctx.db.replace("table", id, {...})
  await ctx.db.delete("table", id)
  await ctx.db.get("table", id)
  
  // Authentication
  await ctx.auth.getUserIdentity()
  
  // Scheduling
  await ctx.scheduler.runAfter(delay, functionRef, args)
  await ctx.scheduler.runAt(timestamp, functionRef, args)
  await ctx.scheduler.cancel(scheduledFunctionId)
  
  // File storage
  await ctx.storage.generateUploadUrl()
  await ctx.storage.delete(storageId)
}
```

## Actions

Actions can call external APIs but are NOT transactional.

### Basic Action

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendEmail = action({
  args: { to: v.string(), subject: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@example.com",
        to: args.to,
        subject: args.subject,
        html: args.body,
      }),
    });
    return await response.json();
  },
});
```

### Action with Database Access

```typescript
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const fetchAndSave = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    // Fetch external data
    const response = await fetch(args.url);
    const data = await response.json();
    
    // Save via mutation (actions can't write directly)
    await ctx.runMutation(internal.data.save, { data });
    
    return data;
  },
});

export const save = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.insert("externalData", args.data);
  },
});
```

### Action Context Properties

```typescript
handler: async (ctx, args) => {
  // Run queries/mutations
  await ctx.runQuery(api.tasks.list, {})
  await ctx.runMutation(api.tasks.create, { text: "..." })
  await ctx.runAction(internal.other.action, {})
  
  // Authentication (propagated from caller)
  await ctx.auth.getUserIdentity()
  
  // Scheduling
  await ctx.scheduler.runAfter(delay, functionRef, args)
  
  // File storage
  await ctx.storage.store(blob)
  await ctx.storage.getUrl(storageId)
  
  // Vector search
  await ctx.vectorSearch("table", "index", { ... })
}
```

## HTTP Actions

Custom HTTP endpoints for webhooks and REST APIs.

### Basic HTTP Action

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    
    // Process webhook
    await ctx.runMutation(internal.webhooks.process, { data: body });
    
    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

### REST API Pattern

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/tasks",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const tasks = await ctx.runQuery(api.tasks.list, {});
    return new Response(JSON.stringify(tasks), {
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/tasks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const id = await ctx.runMutation(api.tasks.create, body);
    return new Response(JSON.stringify({ id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

### CORS Configuration

```typescript
http.route({
  path: "/api/data",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const data = await ctx.runQuery(api.data.list, {});
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),
});

// Handle preflight
http.route({
  path: "/api/data",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),
});
```

### Authenticated HTTP Action

```typescript
http.route({
  path: "/api/protected",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response("Unauthorized", { status: 401 });
    }
    // ... process authenticated request
  }),
});

// Client calls with Authorization header:
// Authorization: Bearer <jwt_token>
```

## Internal Functions

Internal functions are not exposed to clients but can be called from other functions.

```typescript
import { 
  internalQuery, 
  internalMutation, 
  internalAction 
} from "./_generated/server";
import { internal } from "./_generated/api";

// Define internal function
export const processData = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    // Only callable from other Convex functions
    await ctx.db.insert("processed", args.data);
  },
});

// Call from another function
export const publicAction = action({
  args: {},
  handler: async (ctx) => {
    // Use `internal` instead of `api`
    await ctx.runMutation(internal.data.processData, { data: {...} });
  },
});
```

**Always use internal functions for:**
- Scheduled functions
- Cron jobs  
- Helper functions not meant for clients

## Function Naming

```typescript
// convex/tasks.ts
export const list = query({...});        // api.tasks.list
export const create = mutation({...});   // api.tasks.create

// convex/admin/users.ts
export const getAll = query({...});      // api.admin.users.getAll

// Default export
export default query({...});             // api.tasks.default
```

## Helper Functions

Share logic between functions without registering as endpoints:

```typescript
// Shared helper (not a Convex function)
async function getUserOrThrow(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Use in query
export const myData = query({
  handler: async (ctx) => {
    const user = await getUserOrThrow(ctx);
    return await ctx.db
      .query("data")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Use in mutation
export const createData = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserOrThrow(ctx);
    return await ctx.db.insert("data", {
      content: args.content,
      userId: user._id,
    });
  },
});
```

## React Client Hooks

```typescript
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

function Component() {
  // Subscribe to query (auto-updates)
  const tasks = useQuery(api.tasks.list, { limit: 10 });
  
  // Skip query when args not ready
  const user = useQuery(
    api.users.get, 
    userId ? { id: userId } : "skip"
  );
  
  // Get mutation function
  const createTask = useMutation(api.tasks.create);
  
  // Get action function
  const sendEmail = useAction(api.emails.send);
  
  // Call mutation
  await createTask({ text: "New task" });
  
  // Call action
  await sendEmail({ to: "user@example.com", subject: "Hello" });
}
```

## Convex Components

Components are modular packages that run in sandboxed environments within Convex.

### Available Components

| Component | Purpose | Install |
|-----------|---------|---------|
| **RAG** | Retrieval-Augmented Generation for AI apps | `@convex-dev/rag` |
| **Agent** | AI agent building (supports AI SDK v5) | `@convex-dev/agent` |
| **Resend** | Transactional emails via Resend | `@convex-dev/resend` |
| **Workpool** | Background job processing with batching | `@convex-dev/workpool` |
| **Aggregate** | Scalable counters and aggregations | `@convex-dev/aggregate` |
| **Workflows** | Multi-step durable workflows | `@convex-dev/workflows` |
| **Crons** | Dynamic cron job registration | `@convex-dev/crons` |

### Using Components

```typescript
// Install: npm install @convex-dev/rag

// convex/convex.config.ts
import { defineApp } from "convex/server";
import rag from "@convex-dev/rag/convex.config";

const app = defineApp();
app.use(rag);
export default app;

// Use in your functions
import { components } from "./_generated/api";

export const search = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.rag.search, {
      query: args.query,
    });
  },
});
```

See https://www.convex.dev/components for the full list.
