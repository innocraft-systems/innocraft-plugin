# Convex File Storage Reference

Store and serve files directly from Convex.

## Upload Files from Client

### Generate Upload URL Pattern

```typescript
// convex/files.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Step 1: Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: Save file reference after upload
export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    return await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedBy: identity?.tokenIdentifier,
      uploadedAt: Date.now(),
    });
  },
});

// Get file URL
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

### React Upload Component

```typescript
// src/FileUpload.tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useRef } from "react";

export function FileUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to URL
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Save reference in database
      await saveFile({
        storageId,
        fileName: file.name,
        fileType: file.type,
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="file" ref={inputRef} disabled={uploading} />
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
```

## Upload via HTTP Action

For webhooks or custom upload endpoints (max 20MB):

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get file from request
    const blob = await request.blob();
    
    // Store in Convex
    const storageId = await ctx.storage.store(blob);
    
    // Optionally save metadata
    const fileName = request.headers.get("X-File-Name") || "unknown";
    await ctx.runMutation(internal.files.saveUpload, {
      storageId,
      fileName,
    });

    return new Response(JSON.stringify({ storageId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

export default http;
```

## Store Files in Actions

For files from external APIs:

```typescript
// convex/images.ts
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const downloadAndStore = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    // Download file
    const response = await fetch(args.url);
    const blob = await response.blob();
    
    // Store in Convex
    const storageId: Id<"_storage"> = await ctx.storage.store(blob);
    
    // Save reference
    await ctx.runMutation(internal.images.save, { storageId });
    
    return storageId;
  },
});

export const save = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.db.insert("images", {
      storageId: args.storageId,
      createdAt: Date.now(),
    });
  },
});
```

## Serving Files

### Get URL in Query

```typescript
export const getImage = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get("images", args.id);
    if (!image) return null;
    
    const url = await ctx.storage.getUrl(image.storageId);
    return { ...image, url };
  },
});
```

### Serve via HTTP Action

```typescript
// convex/http.ts
http.route({
  path: "/files/:storageId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.pathname.split("/").pop();
    
    const blob = await ctx.storage.get(storageId as Id<"_storage">);
    if (!blob) {
      return new Response("Not found", { status: 404 });
    }
    
    return new Response(blob, {
      headers: {
        "Content-Type": blob.type,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  }),
});
```

## File Metadata

```typescript
export const getFileMetadata = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const metadata = await ctx.storage.getMetadata(args.storageId);
    // Returns: { contentType: string, size: number }
    return metadata;
  },
});
```

## Delete Files

```typescript
export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get("files", args.id);
    if (!file) return;
    
    // Delete from storage
    await ctx.storage.delete(file.storageId);
    
    // Delete record
    await ctx.db.delete("files", args.id);
  },
});
```

## Schema with Storage

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    uploadedBy: v.optional(v.string()),
    uploadedAt: v.number(),
  }).index("by_uploader", ["uploadedBy"]),

  images: defineTable({
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    postId: v.optional(v.id("posts")),
  }).index("by_post", ["postId"]),
});
```

## React Native Upload

```typescript
async function uploadFile(uri: string, generateUploadUrl: any, saveFile: any) {
  // Get upload URL
  const postUrl = await generateUploadUrl();

  // Load file
  const fileData = await fetch(uri);
  const blob = await fileData.blob();

  // Upload
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": "audio/mp4" },
    body: blob,
  });

  const { storageId } = await result.json();
  
  // Save reference
  await saveFile({ storageId });
}
```

## Image Display Component

```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function ImageDisplay({ imageId }: { imageId: Id<"images"> }) {
  const image = useQuery(api.images.get, { id: imageId });
  
  if (!image?.url) return <div>Loading...</div>;
  
  return <img src={image.url} alt={image.caption || ""} />;
}
```

## Storage Limits

- Individual file: No hard limit (use chunked upload for very large files)
- Upload URL expiry: 1 hour
- HTTP action upload: 20MB max
- URLs are signed and temporary (regenerate if needed)

## Best Practices

1. **Always save storageId to database** - URLs expire, IDs persist
2. **Validate file types** before generating upload URLs
3. **Clean up orphaned files** - Delete storage when deleting records
4. **Use correct Content-Type** in upload requests
5. **Handle upload failures** - Provide retry mechanism
