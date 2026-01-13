# Convex Database Reference

Convex uses a document-relational database: JSON-like documents with relational capabilities (IDs, indexes, joins).

## Schema Definition

### Basic Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  posts: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
    published: v.boolean(),
    tags: v.array(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_published", ["published"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
  })
    .index("by_post", ["postId"]),
});
```

### Validators Reference

```typescript
import { v } from "convex/values";

// Primitives
v.string()                    // string
v.number()                    // number (float64)
v.boolean()                   // boolean
v.null()                      // null
v.int64()                     // bigint (64-bit integer)
v.bytes()                     // ArrayBuffer

// Complex Types
v.array(v.string())           // string[]
v.object({                    // { name: string, age: number }
  name: v.string(),
  age: v.number(),
})
v.record(v.string(), v.number())  // Record<string, number>

// Union & Literal
v.union(v.string(), v.number())   // string | number
v.literal("active")               // "active"
v.literal(42)                     // 42

// Optional, Nullable & Any (1.29.0+)
v.optional(v.string())        // string | undefined
v.nullable(v.string())        // string | null (shorthand for v.union(v.string(), v.null()))
v.any()                       // any value

// Convex-specific
v.id("tableName")             // Id<"tableName">
```

### Validator Helper Methods (1.29.0+)

```typescript
// Reusing and extending validators
const userValidator = v.object({
  name: v.string(),
  email: v.string(),
  role: v.string(),
  createdAt: v.number(),
});

// Pick specific fields
const nameOnly = userValidator.pick("name", "email");

// Omit specific fields  
const withoutDates = userValidator.omit("createdAt");

// Extend with additional fields
const adminUser = userValidator.extend({
  permissions: v.array(v.string()),
});

// Make all fields optional
const partialUser = userValidator.partial();

// For paginated query return values
import { paginationResultValidator } from "convex/server";
const paginatedUsers = paginationResultValidator(userValidator);
```

### Optional Fields

```typescript
defineTable({
  name: v.string(),           // Required
  nickname: v.optional(v.string()),  // Optional
})
```

### Strict Table Names

```typescript
// Default: strict mode (recommended)
export default defineSchema({
  users: defineTable({...}),
});

// Flexible mode (for prototyping)
export default defineSchema(
  { users: defineTable({...}) },
  { strictTableNameTypes: false }
);
```

## Reading Data

### Basic Queries

```typescript
// Get by ID (convex 1.31.0+ - table name required)
const user = await ctx.db.get("users", userId);

// Query all documents
const allUsers = await ctx.db.query("users").collect();

// Query with order
const recent = await ctx.db
  .query("posts")
  .order("desc")  // by _creationTime
  .collect();

// Limit results
const top10 = await ctx.db
  .query("posts")
  .order("desc")
  .take(10);

// Get first/unique
const first = await ctx.db.query("users").first();
const unique = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", "test@example.com"))
  .unique();
```

### Index Queries (Recommended)

```typescript
// Equality
const userPosts = await ctx.db
  .query("posts")
  .withIndex("by_author", (q) => q.eq("authorId", userId))
  .collect();

// Range queries
const recentPosts = await ctx.db
  .query("posts")
  .withIndex("by_published", (q) => 
    q.eq("published", true)
  )
  .order("desc")
  .take(20);

// Multiple conditions (compound index)
// Schema: .index("by_author_published", ["authorId", "published"])
const published = await ctx.db
  .query("posts")
  .withIndex("by_author_published", (q) => 
    q.eq("authorId", userId).eq("published", true)
  )
  .collect();

// Range on last field
// Schema: .index("by_status_date", ["status", "date"])
const pending = await ctx.db
  .query("orders")
  .withIndex("by_status_date", (q) => 
    q.eq("status", "pending").gte("date", startDate)
  )
  .collect();
```

### Index Operators

```typescript
.withIndex("index_name", (q) => 
  q.eq("field", value)        // Equal
   .neq("field", value)       // Not equal (less efficient)
   .lt("field", value)        // Less than
   .lte("field", value)       // Less than or equal
   .gt("field", value)        // Greater than
   .gte("field", value)       // Greater than or equal
)
```

### Filter (Use Sparingly)

```typescript
// Filter is less efficient than indexes
// Use only when index conditions are insufficient
const filtered = await ctx.db
  .query("posts")
  .withIndex("by_author", (q) => q.eq("authorId", userId))
  .filter((q) => 
    q.and(
      q.eq(q.field("published"), true),
      q.gt(q.field("views"), 100)
    )
  )
  .collect();

// Filter operators
q.eq(a, b)          // a === b
q.neq(a, b)         // a !== b
q.lt(a, b)          // a < b
q.lte(a, b)         // a <= b
q.gt(a, b)          // a > b
q.gte(a, b)         // a >= b
q.and(cond1, cond2) // cond1 && cond2
q.or(cond1, cond2)  // cond1 || cond2
q.not(cond)         // !cond
q.field("name")     // doc.name
```

## Writing Data

### Insert

```typescript
// Insert returns the new document's ID
const userId = await ctx.db.insert("users", {
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  createdAt: Date.now(),
});
```

### Patch (Partial Update)

```typescript
// Update specific fields (convex 1.31.0+ - table name required)
await ctx.db.patch("users", userId, {
  name: "Alice Smith",
  // Other fields unchanged
});
```

### Replace (Full Update)

```typescript
// Replace entire document (except _id, _creationTime)
await ctx.db.replace("users", userId, {
  name: "Alice Smith",
  email: "alice.smith@example.com",
  role: "admin",
  createdAt: Date.now(),
});
```

### Delete

```typescript
await ctx.db.delete("users", userId);
```

### Legacy API (deprecated)

```typescript
// Old syntax (still works but deprecated)
await ctx.db.get(userId);
await ctx.db.patch(userId, { name: "Alice" });
await ctx.db.delete(userId);

// Migration: use ESLint plugin or codemod
// npx eslint . --fix
// npx @convex-dev/codemod@latest explicit-ids
```

## Indexes

### Defining Indexes

```typescript
defineTable({
  channel: v.id("channels"),
  author: v.id("users"),
  content: v.string(),
  likes: v.number(),
})
  // Single field index
  .index("by_channel", ["channel"])
  
  // Compound index (order matters!)
  .index("by_channel_author", ["channel", "author"])
  
  // For sorting
  .index("by_likes", ["likes"])
```

### Index Best Practices

1. **Order matters in compound indexes**
   - `["channel", "author"]` can query by channel OR by channel+author
   - But NOT by author alone

2. **Equality first, range last**
   ```typescript
   // Good: equality on status, range on date
   .index("by_status_date", ["status", "date"])
   
   // Query: status = "active" AND date >= startDate
   ```

3. **Avoid redundant indexes**
   - `by_a` is redundant if you have `by_a_b`

4. **Max 16 fields per index, 32 indexes per table**

### Staged Indexes (Large Tables)

For tables with many documents, backfilling new indexes can block deployments. Use staged indexes for async backfilling:

```typescript
// Step 1: Add with staged: true (won't block deployment)
.index("by_new_field", { fields: ["newField"], staged: true })

// Step 2: Monitor backfill progress in dashboard

// Step 3: After backfill completes, remove staged: true
.index("by_new_field", ["newField"])
```

**CLI Protection (1.30.0+):** When deleting large indexes (100k+ documents), the CLI asks for confirmation to prevent accidental data loss.

## Relationships

### One-to-Many

```typescript
// Schema
users: defineTable({ name: v.string() }),
posts: defineTable({
  authorId: v.id("users"),
  title: v.string(),
}).index("by_author", ["authorId"]),

// Query user's posts
const posts = await ctx.db
  .query("posts")
  .withIndex("by_author", (q) => q.eq("authorId", userId))
  .collect();

// Get post with author
const post = await ctx.db.get("posts", postId);
const author = await ctx.db.get("users", post.authorId);
```

### Many-to-Many

```typescript
// Schema with junction table
users: defineTable({ name: v.string() }),
groups: defineTable({ name: v.string() }),
memberships: defineTable({
  userId: v.id("users"),
  groupId: v.id("groups"),
})
  .index("by_user", ["userId"])
  .index("by_group", ["groupId"]),

// Get user's groups
const memberships = await ctx.db
  .query("memberships")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();
const groups = await Promise.all(
  memberships.map((m) => ctx.db.get("groups", m.groupId))
);
```

## System Tables

Access Convex system data:

```typescript
// Scheduled functions
const scheduled = await ctx.db.system
  .query("_scheduled_functions")
  .collect();

// Storage metadata
const files = await ctx.db.system
  .query("_storage")
  .collect();
```

## Document Structure

Every document has:
- `_id`: Unique ID (auto-generated)
- `_creationTime`: Timestamp in ms (auto-generated)
- Your defined fields

```typescript
{
  _id: "jh76f2q3...",
  _creationTime: 1699931054642.111,
  name: "Alice",
  email: "alice@example.com"
}
```

## TypeScript Types

```typescript
// Import document type
import { Doc, Id } from "../convex/_generated/dataModel";

// Use in components
function UserCard({ user }: { user: Doc<"users"> }) {
  return <div>{user.name}</div>;
}

// Use ID type
function getUser(userId: Id<"users">) {
  return ctx.db.get("users", userId);
}

// Infer partial types
import { Infer } from "convex/values";
type UserFields = Infer<typeof userValidator>;
```

## Limits

- Document size: < 1MB
- Nesting depth: 16 levels max
- Index fields: 16 per index
- Indexes per table: 32
- Transaction reads: 8MB
- Transaction writes: 8MB
