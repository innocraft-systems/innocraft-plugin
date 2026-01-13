# Convex Auth Reference

Convex Auth is a built-in authentication library that stores all auth data directly in your Convex database. No external auth service required.

## Supported Authentication Methods

| Method | Description | Requirements |
|--------|-------------|--------------|
| **OAuth** | GitHub, Google, Apple | OAuth app credentials |
| **Magic Links** | Email link sign-in | Email provider (Resend, etc.) |
| **OTPs** | One-time password via email | Email provider |
| **Passwords** | Email + password | Email provider for password reset |
| **Anonymous** | Guest sessions | None |

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @convex-dev/auth @auth/core@0.37.0
npx @convex-dev/auth
```

### 2. Create Auth Configuration

```typescript
// convex/auth.ts
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google, Password],
});
```

### 3. Update Schema

```typescript
// convex/schema.ts
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // Your other tables...
  posts: defineTable({
    content: v.string(),
    authorId: v.id("users"),
  }),
});
```

### 4. Configure HTTP Routes

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

export default http;
```

### 5. Wrap React App

```typescript
// src/main.tsx
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>
);
```

## OAuth Configuration

### GitHub OAuth

1. Create OAuth App at github.com → Settings → Developer settings → OAuth Apps
2. Set Authorization callback URL: `https://<deployment>.convex.site/api/auth/callback/github`
3. Set environment variables:

```bash
npx convex env set AUTH_GITHUB_ID <client_id>
npx convex env set AUTH_GITHUB_SECRET <client_secret>
```

4. Add to auth.ts:

```typescript
import GitHub from "@auth/core/providers/github";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [GitHub],
});
```

### Google OAuth

1. Create project at console.cloud.google.com
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials with redirect URI: `https://<deployment>.convex.site/api/auth/callback/google`
4. Set environment variables:

```bash
npx convex env set AUTH_GOOGLE_ID <client_id>
npx convex env set AUTH_GOOGLE_SECRET <client_secret>
```

5. Add to auth.ts:

```typescript
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
});
```

## Password Authentication

### Basic Setup

```typescript
// convex/auth.ts
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
});
```

### Sign-in/Sign-up Form

```typescript
// src/SignIn.tsx
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        void signIn("password", formData);
      }}
    >
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <input name="flow" type="hidden" value={flow} />
      <button type="submit">{flow === "signIn" ? "Sign In" : "Sign Up"}</button>
      <button type="button" onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}>
        {flow === "signIn" ? "Need an account?" : "Have an account?"}
      </button>
    </form>
  );
}
```

### With Email Verification (Recommended for Production)

```typescript
// convex/ResendOTP.ts
import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { alphabet, generateRandomString } from "oslo/crypto";

export const ResendOTP = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    return generateRandomString(8, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const resend = new ResendAPI(process.env.AUTH_RESEND_KEY);
    await resend.emails.send({
      from: "Auth <noreply@yourdomain.com>",
      to: [email],
      subject: "Your verification code",
      text: `Your code is: ${token}`,
    });
  },
});

// convex/auth.ts
import { Password } from "@convex-dev/auth/providers/Password";
import { ResendOTP } from "./ResendOTP";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password({ verify: ResendOTP })],
});
```

## Magic Links

```typescript
// convex/auth.ts
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Resend({
      from: "Auth <noreply@yourdomain.com>",
    }),
  ],
});

// Set environment variable
// npx convex env set AUTH_RESEND_KEY <your_resend_api_key>
```

### Magic Link Form

```typescript
import { useAuthActions } from "@convex-dev/auth/react";

export function MagicLinkForm() {
  const { signIn } = useAuthActions();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        void signIn("resend", formData);
      }}
    >
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit">Send Magic Link</button>
    </form>
  );
}
```

## Authorization in Backend Functions

### Get Current User ID

```typescript
// convex/posts.ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get("users", userId);
  },
});

export const createPost = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthenticated");
    }
    return await ctx.db.insert("posts", {
      content: args.content,
      authorId: userId,
    });
  },
});
```

### Get Session ID

```typescript
import { getAuthSessionId } from "@convex-dev/auth/server";

export const currentSession = query({
  args: {},
  handler: async (ctx) => {
    const sessionId = await getAuthSessionId(ctx);
    if (sessionId === null) {
      return null;
    }
    return await ctx.db.get("authSessions", sessionId);
  },
});
```

## Frontend Auth State

### Sign Out

```typescript
import { useAuthActions } from "@convex-dev/auth/react";

export function SignOut() {
  const { signOut } = useAuthActions();
  return <button onClick={() => void signOut()}>Sign Out</button>;
}
```

### Conditional Rendering

```typescript
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

export function App() {
  return (
    <>
      <AuthLoading>
        <p>Loading...</p>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}
```

### Get Auth Token for HTTP Actions

```typescript
import { useAuthToken } from "@convex-dev/auth/react";

function UploadComponent() {
  const token = useAuthToken();

  const upload = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_CONVEX_SITE_URL}/upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fileData,
      }
    );
  };

  return <button onClick={upload}>Upload</button>;
}
```

## Anonymous Users

Allow users to interact before requiring authentication:

```typescript
// convex/auth.ts
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Anonymous],
});

// Frontend
const { signIn } = useAuthActions();
await signIn("anonymous");
```

## Production Checklist

1. **Set SITE_URL** for proper redirects:
   ```bash
   npx convex env set SITE_URL https://yourdomain.com
   ```

2. **Configure separate OAuth apps** for dev and production environments

3. **Use email verification** for password auth in production

4. **Set up proper email provider** (Resend, SendGrid, etc.) for magic links/OTPs

5. **Configure custom domain** for Convex (Pro plan) for branded OAuth consent screens

## Auth Tables Created

Convex Auth automatically creates these tables:

- `users` - User accounts
- `authSessions` - Active sessions
- `authAccounts` - OAuth/credential links
- `authRefreshTokens` - Token refresh
- `authVerificationCodes` - OTP/verification codes
- `authVerifiers` - PKCE verifiers
- `authRateLimits` - Rate limiting
