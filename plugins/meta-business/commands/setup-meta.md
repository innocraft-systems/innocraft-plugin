---
name: setup-meta
description: Set up Meta Business API integration for Facebook and Instagram
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--facebook | --instagram | --both]"
---

# Setup Meta Business API

Set up Meta Graph API for Facebook Pages and Instagram Business accounts.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the integration scope:
   - If `--facebook` flag: Set up Facebook Pages API only
   - If `--instagram` flag: Set up Instagram Graph API only
   - If `--both` flag: Set up both platforms
   - Otherwise: Ask the user which platforms they need

3. Install required dependencies:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/meta/client.ts` - Meta API client
   - `src/lib/meta/facebook.ts` - Facebook-specific methods
   - `src/lib/meta/instagram.ts` - Instagram-specific methods (if needed)
   - `src/lib/meta/types.ts` - TypeScript types

5. Create or update `.env.example` with required variables:
   ```
   # Meta Business API
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_ACCESS_TOKEN=your_long_lived_token
   META_PAGE_ID=your_page_id
   META_INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
   ```

6. Add `.env` to `.gitignore` if not already present.

7. Print next steps:
   - Create Meta App at developers.facebook.com
   - Add Facebook Login and Instagram Graph API products
   - Get Page Access Token via OAuth or Business Manager
   - Exchange for long-lived token (60 days)

## Client Template

```typescript
import axios, { AxiosInstance } from 'axios';

interface PostResponse {
  id: string;
}

interface MediaResponse {
  id: string;
}

export class MetaClient {
  private accessToken: string;
  private pageId: string;
  private instagramAccountId: string | null;
  private http: AxiosInstance;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN!;
    this.pageId = process.env.META_PAGE_ID!;
    this.instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID || null;

    this.http = axios.create({
      baseURL: 'https://graph.facebook.com/v21.0',
      params: {
        access_token: this.accessToken
      }
    });
  }

  // ========== FACEBOOK PAGES ==========

  async postToFacebook(message: string): Promise<PostResponse> {
    const { data } = await this.http.post(`/${this.pageId}/feed`, {
      message
    });
    return data;
  }

  async postPhotoToFacebook(imageUrl: string, caption?: string): Promise<PostResponse> {
    const { data } = await this.http.post(`/${this.pageId}/photos`, {
      url: imageUrl,
      caption
    });
    return data;
  }

  async postVideoToFacebook(videoUrl: string, description?: string): Promise<PostResponse> {
    const { data } = await this.http.post(`/${this.pageId}/videos`, {
      file_url: videoUrl,
      description
    });
    return data;
  }

  async postLinkToFacebook(link: string, message?: string): Promise<PostResponse> {
    const { data } = await this.http.post(`/${this.pageId}/feed`, {
      link,
      message
    });
    return data;
  }

  async scheduleFacebookPost(message: string, scheduledTime: Date): Promise<PostResponse> {
    const { data } = await this.http.post(`/${this.pageId}/feed`, {
      message,
      published: false,
      scheduled_publish_time: Math.floor(scheduledTime.getTime() / 1000)
    });
    return data;
  }

  async getFacebookPageInsights(metrics: string[], period: string = 'day'): Promise<any> {
    const { data } = await this.http.get(`/${this.pageId}/insights`, {
      params: {
        metric: metrics.join(','),
        period
      }
    });
    return data;
  }

  // ========== INSTAGRAM ==========

  async postToInstagram(imageUrl: string, caption?: string): Promise<PostResponse> {
    if (!this.instagramAccountId) {
      throw new Error('Instagram account not configured');
    }

    // Step 1: Create media container
    const { data: container } = await this.http.post(
      `/${this.instagramAccountId}/media`,
      {
        image_url: imageUrl,
        caption
      }
    );

    // Step 2: Publish the container
    const { data: post } = await this.http.post(
      `/${this.instagramAccountId}/media_publish`,
      {
        creation_id: container.id
      }
    );

    return post;
  }

  async postCarouselToInstagram(
    mediaUrls: Array<{ type: 'image' | 'video'; url: string }>,
    caption?: string
  ): Promise<PostResponse> {
    if (!this.instagramAccountId) {
      throw new Error('Instagram account not configured');
    }

    // Step 1: Create individual media containers
    const childrenIds: string[] = [];

    for (const media of mediaUrls) {
      const params: any = {
        is_carousel_item: true
      };

      if (media.type === 'image') {
        params.image_url = media.url;
      } else {
        params.video_url = media.url;
        params.media_type = 'VIDEO';
      }

      const { data } = await this.http.post(
        `/${this.instagramAccountId}/media`,
        params
      );
      childrenIds.push(data.id);
    }

    // Step 2: Create carousel container
    const { data: container } = await this.http.post(
      `/${this.instagramAccountId}/media`,
      {
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        caption
      }
    );

    // Step 3: Publish
    const { data: post } = await this.http.post(
      `/${this.instagramAccountId}/media_publish`,
      {
        creation_id: container.id
      }
    );

    return post;
  }

  async postReelToInstagram(videoUrl: string, caption?: string): Promise<PostResponse> {
    if (!this.instagramAccountId) {
      throw new Error('Instagram account not configured');
    }

    // Step 1: Create reel container
    const { data: container } = await this.http.post(
      `/${this.instagramAccountId}/media`,
      {
        video_url: videoUrl,
        caption,
        media_type: 'REELS'
      }
    );

    // Step 2: Wait for processing (poll status)
    await this.waitForMediaProcessing(container.id);

    // Step 3: Publish
    const { data: post } = await this.http.post(
      `/${this.instagramAccountId}/media_publish`,
      {
        creation_id: container.id
      }
    );

    return post;
  }

  private async waitForMediaProcessing(containerId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await this.http.get(`/${containerId}`, {
        params: { fields: 'status_code' }
      });

      if (data.status_code === 'FINISHED') {
        return;
      }

      if (data.status_code === 'ERROR') {
        throw new Error('Media processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Media processing timeout');
  }

  async getInstagramInsights(mediaId: string, metrics: string[]): Promise<any> {
    const { data } = await this.http.get(`/${mediaId}/insights`, {
      params: {
        metric: metrics.join(',')
      }
    });
    return data;
  }
}

export const meta = new MetaClient();
```

## Token Exchange Template

```typescript
async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    `grant_type=fb_exchange_token&` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `fb_exchange_token=${shortLivedToken}`
  );

  const data = await response.json();
  return data.access_token; // Valid for ~60 days
}
```

## Required Permissions

| Permission | Purpose |
|------------|---------|
| `pages_manage_posts` | Create/edit/delete Page posts |
| `pages_read_engagement` | Read comments, reactions |
| `pages_manage_engagement` | Reply to comments |
| `instagram_basic` | Read Instagram profile |
| `instagram_content_publish` | Post to Instagram |
| `instagram_manage_insights` | Read Instagram analytics |

## Tips

- Page Access Tokens last 60 days; set up token refresh
- Instagram requires a Business or Creator account linked to a Page
- Carousels support 2-10 media items
- Video processing is async; poll status before publishing
- Reference meta-pages, meta-instagram skills for detailed docs
