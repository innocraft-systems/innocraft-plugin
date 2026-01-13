---
name: setup-pesapal
description: Set up Pesapal payment gateway integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--iframe | --redirect]"
---

# Setup Pesapal Payment Gateway

Set up Pesapal API 3.0 for card and mobile money payments in Kenya.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the integration type:
   - If `--iframe` flag: Set up iframe embed integration
   - If `--redirect` flag: Set up redirect-based flow
   - Otherwise: Ask the user which approach they prefer

3. Install required dependencies:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/pesapal/client.ts` - Pesapal client
   - `src/lib/pesapal/types.ts` - TypeScript types
   - `src/lib/pesapal/ipn.ts` - IPN handler

5. Create or update `.env.example` with required variables:
   ```
   # Pesapal Configuration
   PESAPAL_CONSUMER_KEY=your_consumer_key
   PESAPAL_CONSUMER_SECRET=your_consumer_secret
   PESAPAL_ENVIRONMENT=sandbox
   PESAPAL_CALLBACK_URL=https://yourapp.com/payment/callback
   PESAPAL_IPN_URL=https://yourapp.com/api/pesapal/ipn
   ```

6. Add `.env` to `.gitignore` if not already present.

7. If using a framework with API routes, create:
   - Payment initiation endpoint
   - IPN webhook handler
   - Callback/redirect page

8. Print next steps:
   - Register at https://developer.pesapal.com/
   - Create an application
   - Register your IPN URL in dashboard
   - Set environment variables in .env

## Client Template

```typescript
import axios, { AxiosInstance } from 'axios';

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface OrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callbackUrl: string;
  notificationId: string;
  billingAddress: {
    emailAddress: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
  };
}

export class PesapalClient {
  private consumerKey: string;
  private consumerSecret: string;
  private baseUrl: string;
  private tokenCache: TokenCache | null = null;
  private http: AxiosInstance;

  constructor() {
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY!;
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET!;

    const env = process.env.PESAPAL_ENVIRONMENT || 'sandbox';
    this.baseUrl = env === 'production'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';

    this.http = axios.create({ baseURL: this.baseUrl });
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const { data } = await this.http.post('/api/Auth/RequestToken', {
      consumer_key: this.consumerKey,
      consumer_secret: this.consumerSecret
    });

    this.tokenCache = {
      token: data.token,
      expiresAt: Date.now() + (data.expiryDate ?
        new Date(data.expiryDate).getTime() - Date.now() - 60000 :
        3540000) // Default ~59 minutes
    };

    return this.tokenCache.token;
  }

  async registerIPN(url: string, notificationType: 'GET' | 'POST' = 'POST') {
    const token = await this.getAccessToken();

    const { data } = await this.http.post(
      '/api/URLSetup/RegisterIPN',
      {
        url,
        ipn_notification_type: notificationType
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }

  async submitOrder(order: {
    merchantReference: string;
    amount: number;
    currency?: string;
    description: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    notificationId: string;
    callbackUrl?: string;
  }) {
    const token = await this.getAccessToken();

    const { data } = await this.http.post(
      '/api/Transactions/SubmitOrderRequest',
      {
        id: order.merchantReference,
        currency: order.currency || 'KES',
        amount: order.amount,
        description: order.description,
        callback_url: order.callbackUrl || process.env.PESAPAL_CALLBACK_URL,
        notification_id: order.notificationId,
        billing_address: {
          email_address: order.email,
          phone_number: order.phone,
          first_name: order.firstName,
          last_name: order.lastName
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }

  async getTransactionStatus(orderTrackingId: string) {
    const token = await this.getAccessToken();

    const { data } = await this.http.get(
      `/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }
}

export const pesapal = new PesapalClient();
```

## Payment Flow

```typescript
// 1. Register IPN URL (do once, store notification_id)
const ipnResult = await pesapal.registerIPN(
  process.env.PESAPAL_IPN_URL!,
  'POST'
);
const notificationId = ipnResult.ipn_id;

// 2. Submit order
const order = await pesapal.submitOrder({
  merchantReference: 'ORDER-123',
  amount: 1000,
  description: 'Payment for Order #123',
  email: 'customer@example.com',
  phone: '+254712345678',
  firstName: 'John',
  lastName: 'Doe',
  notificationId: notificationId
});

// 3. Redirect user to payment page
// order.redirect_url contains the Pesapal payment page

// 4. Handle IPN callback
// Pesapal will POST to your IPN URL with OrderTrackingId

// 5. Verify payment status
const status = await pesapal.getTransactionStatus(orderTrackingId);
```

## IPN Handler Template

```typescript
// Next.js App Router example
import { NextRequest, NextResponse } from 'next/server';
import { pesapal } from '@/lib/pesapal/client';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { OrderTrackingId, OrderMerchantReference } = body;

  // Verify the transaction
  const status = await pesapal.getTransactionStatus(OrderTrackingId);

  if (status.payment_status_description === 'Completed') {
    // Update your order as paid
    // await updateOrder(OrderMerchantReference, 'paid');
  }

  return NextResponse.json({ status: 'ok' });
}
```

## Tips

- Pesapal supports cards (Visa, Mastercard), M-Pesa, Airtel Money, and bank transfers
- Register IPN URL once and store the notification_id
- Always verify payment status via API after IPN - don't trust IPN alone
- Reference the pesapal skill for detailed API documentation
