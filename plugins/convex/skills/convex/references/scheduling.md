# Convex Scheduling Reference

Schedule functions to run in the future or on recurring schedules.

## Scheduled Functions

### Schedule from Mutation

```typescript
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Schedule action to run later
export const scheduleEmail = mutation({
  args: { to: v.string(), content: v.string(), delayMs: v.number() },
  handler: async (ctx, args) => {
    // runAfter: delay in milliseconds
    const scheduledId = await ctx.scheduler.runAfter(
      args.delayMs,
      internal.emails.send,
      { to: args.to, content: args.content }
    );
    return scheduledId;
  },
});

// Schedule at specific time
export const scheduleReminder = mutation({
  args: { userId: v.id("users"), reminderTime: v.number() },
  handler: async (ctx, args) => {
    // runAt: Unix timestamp in milliseconds
    await ctx.scheduler.runAt(
      args.reminderTime,
      internal.reminders.send,
      { userId: args.userId }
    );
  },
});
```

### Self-Destructing Message Pattern

```typescript
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendExpiringMessage = mutation({
  args: { body: v.string(), ttlMs: v.number() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("messages", { body: args.body });
    
    // Delete after TTL
    await ctx.scheduler.runAfter(
      args.ttlMs,
      internal.messages.deleteMessage,
      { messageId: id }
    );
    
    return id;
  },
});

export const deleteMessage = internalMutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.delete("messages", args.messageId);
  },
});
```

### Cancel Scheduled Function

```typescript
export const cancelScheduled = mutation({
  args: { scheduledId: v.id("_scheduled_functions") },
  handler: async (ctx, args) => {
    await ctx.scheduler.cancel(args.scheduledId);
  },
});
```

### Query Scheduled Functions

```typescript
import { query } from "./_generated/server";

export const listScheduled = query({
  handler: async (ctx) => {
    return await ctx.db.system
      .query("_scheduled_functions")
      .collect();
  },
});

export const getScheduled = query({
  args: { id: v.id("_scheduled_functions") },
  handler: async (ctx, args) => {
    return await ctx.db.system.get(args.id);
  },
});
```

### Scheduled Function Document

```typescript
{
  "_id": "3ep33196...",
  "_creationTime": 1699931054642.111,
  "name": "messages:deleteMessage",
  "args": [{ "messageId": "..." }],
  "scheduledTime": 1699931054657,
  "state": { "kind": "pending" },
  // After completion:
  "completedTime": 1699931054690.366,
  "state": { "kind": "success" }
}
```

### Scheduling Guarantees

| Type | Execution | Retry |
|------|-----------|-------|
| **Mutations** | Exactly once | Auto-retry on Convex errors |
| **Actions** | At most once | No auto-retry (may have side effects) |

## Cron Jobs

### Basic Cron Setup

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every hour
crons.interval(
  "hourly-cleanup",
  { hours: 1 },
  internal.cleanup.run
);

// Run daily at 9:00 AM UTC
crons.daily(
  "daily-report",
  { hourUTC: 9, minuteUTC: 0 },
  internal.reports.generate
);

// Run weekly on Monday at 9:00 AM UTC
crons.weekly(
  "weekly-digest",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.digests.send
);

// Run monthly on the 1st at midnight UTC
crons.monthly(
  "monthly-billing",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.billing.process
);

// Cron expression syntax
crons.cron(
  "every-5-minutes",
  "*/5 * * * *",
  internal.tasks.check
);

export default crons;
```

### Cron Schedule Options

```typescript
// Interval-based
crons.interval("name", { seconds: 30 }, fn);
crons.interval("name", { minutes: 5 }, fn);
crons.interval("name", { hours: 1 }, fn);

// Time-based (UTC)
crons.hourly("name", { minuteUTC: 30 }, fn);
crons.daily("name", { hourUTC: 9, minuteUTC: 0 }, fn);
crons.weekly("name", { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 }, fn);
crons.monthly("name", { day: 1, hourUTC: 0, minuteUTC: 0 }, fn);

// Cron expression (standard format)
crons.cron("name", "0 9 * * 1-5", fn);  // 9 AM UTC, Mon-Fri
```

### Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

Examples:
- `*/5 * * * *` - Every 5 minutes
- `0 9 * * *` - Daily at 9:00 AM UTC
- `0 9 * * 1-5` - Weekdays at 9:00 AM UTC
- `0 0 1 * *` - First of month at midnight UTC

### Cron with Arguments

```typescript
// Crons can pass static arguments
crons.daily(
  "cleanup-old-data",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cleanup.run,
  { olderThanDays: 30 }  // Static args
);
```

## Dynamic Cron Registration (Component)

For runtime cron registration, use the @convex-dev/crons component:

```bash
npm install @convex-dev/crons
```

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import crons from "@convex-dev/crons/convex.config.js";

const app = defineApp();
app.use(crons);
export default app;
```

```typescript
// convex/myCrons.ts
import { components } from "./_generated/api";
import { Crons } from "@convex-dev/crons";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

const crons = new Crons(components.crons);

export const registerDailyCron = mutation({
  args: {},
  handler: async (ctx) => {
    return await crons.register(
      ctx,
      { kind: "cron", cronspec: "0 0 * * *" },
      internal.tasks.dailyTask,
      { message: "Daily run" },
      "my-daily-cron"  // Optional name
    );
  },
});

export const registerIntervalCron = mutation({
  args: {},
  handler: async (ctx) => {
    return await crons.register(
      ctx,
      { kind: "interval", ms: 3600000 },  // Every hour
      internal.tasks.hourlyTask,
      {}
    );
  },
});

export const deleteCron = mutation({
  args: { id: v.id("crons") },
  handler: async (ctx, args) => {
    await crons.delete(ctx, args.id);
  },
});
```

## Best Practices

### 1. Use Internal Functions

```typescript
// ❌ Bad: Public function exposed to clients
crons.daily("task", {...}, api.tasks.run);

// ✅ Good: Internal function
crons.daily("task", {...}, internal.tasks.run);
```

### 2. Idempotent Cron Jobs

```typescript
export const processDaily = internalMutation({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    
    // Check if already processed
    const existing = await ctx.db
      .query("dailyProcessing")
      .withIndex("by_date", (q) => q.eq("date", today))
      .unique();
    
    if (existing) {
      return; // Already processed
    }
    
    // Process and mark as done
    await ctx.db.insert("dailyProcessing", { date: today });
    // ... actual processing
  },
});
```

### 3. Limit Scheduling

- Max 1000 scheduled functions per mutation
- Max 8MB total argument size per mutation
- Use `runAfter(0, ...)` to immediately queue work

### 4. Error Handling for Actions

```typescript
// Actions are NOT auto-retried
export const unreliableTask = internalAction({
  handler: async (ctx) => {
    try {
      await externalApiCall();
    } catch (error) {
      // Log error, maybe reschedule
      console.error("Task failed:", error);
      await ctx.scheduler.runAfter(
        60000, // Retry in 1 minute
        internal.tasks.unreliableTask,
        {}
      );
    }
  },
});
```

### 5. Transactional Scheduling

Scheduling from mutations is atomic:

```typescript
export const createOrder = mutation({
  handler: async (ctx, args) => {
    // If mutation fails, nothing is scheduled
    const orderId = await ctx.db.insert("orders", {...});
    
    // These only execute if insert succeeds
    await ctx.scheduler.runAfter(0, internal.orders.processPayment, { orderId });
    await ctx.scheduler.runAfter(86400000, internal.orders.sendFollowUp, { orderId });
    
    return orderId;
  },
});
```
