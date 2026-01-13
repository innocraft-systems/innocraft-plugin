# Third-Party Authentication Reference

Integrate Clerk or Auth0 with Convex for managed authentication.

## Clerk Integration

### 1. Install Dependencies

```bash
npm install @clerk/clerk-react
```

### 2. Configure Clerk Dashboard

1. Create account at clerk.com
2. Create application
3. In JWT Templates, create "convex" template with:
   ```json
   {
     "convex": {}
   }
   ```
4. Copy the Issuer URL from JWT template

### 3. Configure Convex Auth

```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

Set environment variable:
```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-domain.clerk.accounts.dev
```

### 4. Configure React Provider

```typescript
// src/main.tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <App />
    </ConvexProviderWithClerk>
  </ClerkProvider>
);
```

### 5. Auth Components

```typescript
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated } from "convex/react";

function App() {
  return (
    <>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
      <Authenticated>
        <UserProfile />
        <SignOutButton />
      </Authenticated>
    </>
  );
}

function UserProfile() {
  const { user } = useUser();
  return <div>Hello, {user?.fullName}</div>;
}
```

### 6. Access User in Backend

```typescript
// convex/users.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      // Update existing user
      if (user.name !== identity.name) {
        await ctx.db.patch("users", user._id, { name: identity.name });
      }
      return user._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      name: identity.name!,
      email: identity.email!,
      tokenIdentifier: identity.tokenIdentifier,
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});
```

### Clerk Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    // Add custom fields
    role: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),
});
```

---

## Auth0 Integration

### 1. Install Dependencies

```bash
npm install @auth0/auth0-react
```

### 2. Configure Auth0 Dashboard

1. Create account at auth0.com
2. Create application (Single Page Application)
3. Set allowed callback URLs: `http://localhost:5173, https://yourdomain.com`
4. Set allowed logout URLs: same
5. Set allowed web origins: same

### 3. Configure Convex Auth

```typescript
// convex/auth.config.ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.AUTH0_DOMAIN!,
      applicationID: process.env.AUTH0_CLIENT_ID!,
    },
  ],
} satisfies AuthConfig;
```

Set environment variables:
```bash
npx convex env set AUTH0_DOMAIN your-tenant.us.auth0.com
npx convex env set AUTH0_CLIENT_ID your_client_id
```

### 4. Configure React Provider

```typescript
// src/main.tsx
import { Auth0Provider } from "@auth0/auth0-react";
import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain="your-tenant.us.auth0.com"
    clientId="your_client_id"
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
    useRefreshTokens={true}
    cacheLocation="localstorage"
  >
    <ConvexProviderWithAuth0 client={convex}>
      <App />
    </ConvexProviderWithAuth0>
  </Auth0Provider>
);
```

### 5. Auth Components

```typescript
import { useAuth0 } from "@auth0/auth0-react";
import { Authenticated, Unauthenticated } from "convex/react";

function App() {
  const { loginWithRedirect, logout, user } = useAuth0();

  return (
    <>
      <Unauthenticated>
        <button onClick={() => loginWithRedirect()}>Log In</button>
      </Unauthenticated>
      <Authenticated>
        <div>Hello, {user?.name}</div>
        <button onClick={() => logout()}>Log Out</button>
      </Authenticated>
    </>
  );
}
```

---

## UserIdentity Fields

When using `ctx.auth.getUserIdentity()`, available fields depend on provider:

```typescript
interface UserIdentity {
  // Always present
  tokenIdentifier: string;  // Unique: "issuer|subject"
  subject: string;          // User ID from provider
  issuer: string;           // Provider domain
  
  // Usually present (configure in provider)
  name?: string;
  email?: string;
  emailVerified?: boolean;
  pictureUrl?: string;
  
  // OpenID standard fields
  familyName?: string;
  givenName?: string;
  nickname?: string;
  updatedAt?: string;
}
```

### Accessing in Functions

```typescript
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return {
      tokenId: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      picture: identity.pictureUrl,
    };
  },
});
```

---

## Storing Users Pattern

Best practice: Store user data in Convex for relationships and queries.

```typescript
// convex/users.ts
import { mutation, query } from "./_generated/server";

// Call this after successful login
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      // Update if profile changed
      await ctx.db.patch("users", existingUser._id, {
        name: identity.name,
        email: identity.email,
        pictureUrl: identity.pictureUrl,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? "Anonymous",
      email: identity.email,
      pictureUrl: identity.pictureUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get current user with relations
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    // Include related data
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .take(10);

    return { ...user, posts };
  },
});
```

### Auto-store on Mount

```typescript
// src/App.tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";

function AuthenticatedApp() {
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    storeUser();
  }, [storeUser]);

  return <Dashboard />;
}
```

---

## Environment Separation

### Clerk

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
```

Set different values per deployment:
```bash
# Development
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://dev-xxx.clerk.accounts.dev

# Production
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://prod-xxx.clerk.accounts.dev --prod
```

### Auth0

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.AUTH0_DOMAIN!,
      applicationID: process.env.AUTH0_CLIENT_ID!,
    },
  ],
};
```

---

## Debugging

If authentication isn't working:

1. Check backend logs for identity:
   ```typescript
   console.log("identity", await ctx.auth.getUserIdentity());
   ```

2. Verify auth.config.ts matches provider settings

3. Run `npx convex dev` after changing auth.config.ts

4. Check JWT token at https://jwt.io - verify `iss` matches domain

5. Clear browser cookies and try again
