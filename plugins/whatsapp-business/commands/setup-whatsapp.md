---
name: setup-whatsapp
description: Set up WhatsApp Business Cloud API integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--basic | --webhooks | --full]"
---

# Setup WhatsApp Business Cloud API

Set up Meta's WhatsApp Business Cloud API for messaging.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the integration scope:
   - If `--basic` flag: Set up sending messages only
   - If `--webhooks` flag: Set up receiving messages via webhooks
   - If `--full` flag: Set up both sending and receiving
   - Otherwise: Ask the user what they need

3. Install required dependencies:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/whatsapp/client.ts` - WhatsApp client
   - `src/lib/whatsapp/types.ts` - TypeScript types
   - `src/lib/whatsapp/webhooks.ts` - Webhook handlers (if --webhooks or --full)

5. Create or update `.env.example` with required variables:
   ```
   # WhatsApp Business Cloud API
   WHATSAPP_ACCESS_TOKEN=your_permanent_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
   WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
   ```

6. Add `.env` to `.gitignore` if not already present.

7. If webhooks requested, create webhook handler:
   - `src/app/api/whatsapp/webhook/route.ts` (Next.js App Router)
   - `src/pages/api/whatsapp/webhook.ts` (Next.js Pages)
   - `src/routes/whatsapp.ts` (Express)

8. Print next steps:
   - Create Meta App at developers.facebook.com
   - Add WhatsApp product to app
   - Get Phone Number ID and Access Token
   - Configure webhooks (if needed)

## Client Template

```typescript
import axios, { AxiosInstance } from 'axios';

interface MessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{
    type: 'text' | 'image' | 'document' | 'video';
    text?: string;
    image?: { link: string };
    document?: { link: string; filename: string };
  }>;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;
  private http: AxiosInstance;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;

    this.http = axios.create({
      baseURL: 'https://graph.facebook.com/v21.0',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // ========== TEXT MESSAGES ==========

  async sendText(to: string, message: string): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    });

    return data;
  }

  // ========== MEDIA MESSAGES ==========

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption
      }
    });

    return data;
  }

  async sendDocument(to: string, documentUrl: string, filename: string, caption?: string): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption
      }
    });

    return data;
  }

  // ========== TEMPLATE MESSAGES ==========

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: TemplateComponent[]
  ): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    });

    return data;
  }

  // ========== INTERACTIVE MESSAGES ==========

  async sendButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title }
          }))
        }
      }
    });

    return data;
  }

  async sendList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText,
          sections
        }
      }
    });

    return data;
  }

  // ========== REACTIONS ==========

  async sendReaction(to: string, messageId: string, emoji: string): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji
      }
    });

    return data;
  }

  // ========== LOCATION ==========

  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<MessageResponse> {
    const { data } = await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address
      }
    });

    return data;
  }

  // ========== READ RECEIPTS ==========

  async markAsRead(messageId: string): Promise<void> {
    await this.http.post(`/${this.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    });
  }
}

export const whatsapp = new WhatsAppClient();
```

## Webhook Handler Template

```typescript
// Next.js App Router
import { NextRequest, NextResponse } from 'next/server';

// Webhook verification (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Webhook events (POST)
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Process messages
  const entries = body.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const messages = value.messages || [];

      for (const message of messages) {
        await handleMessage(message, value.contacts?.[0]);
      }
    }
  }

  return NextResponse.json({ status: 'ok' });
}

async function handleMessage(message: any, contact: any) {
  const from = message.from;
  const type = message.type;

  switch (type) {
    case 'text':
      console.log(`Text from ${from}: ${message.text.body}`);
      // Handle text message
      break;

    case 'image':
      console.log(`Image from ${from}: ${message.image.id}`);
      // Handle image
      break;

    case 'interactive':
      if (message.interactive.type === 'button_reply') {
        console.log(`Button clicked: ${message.interactive.button_reply.id}`);
      }
      break;

    default:
      console.log(`Unknown message type: ${type}`);
  }
}
```

## Tips

- Use System User tokens for permanent access (no expiry)
- Phone numbers must include country code (254712345678)
- Template messages required for initiating conversations (24hr window)
- Test with your own number first before going live
- Reference whatsapp-cloud-api skill for detailed documentation
