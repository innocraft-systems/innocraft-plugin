---
name: setup-kopokopo
description: Set up Kopokopo (K2 Connect) payment integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--sdk | --rest]"
---

# Setup Kopokopo K2 Connect Integration

Set up Kopokopo K2 Connect API for M-Pesa buy goods payments in Kenya.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the implementation approach:
   - If `--sdk` flag: Use the official k2-connect-node SDK
   - If `--rest` flag: Use direct REST API calls
   - Otherwise: Recommend SDK for simpler integration

3. Install required dependencies:

   For SDK approach:
   ```bash
   npm install k2-connect-node dotenv
   ```

   For REST approach:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/kopokopo/client.ts` - Kopokopo client
   - `src/lib/kopokopo/types.ts` - TypeScript types
   - `src/lib/kopokopo/webhooks.ts` - Webhook handlers

5. Create or update `.env.example` with required variables:
   ```
   # Kopokopo K2 Connect Configuration
   KOPOKOPO_CLIENT_ID=your_client_id
   KOPOKOPO_CLIENT_SECRET=your_client_secret
   KOPOKOPO_API_KEY=your_api_key
   KOPOKOPO_TILL_NUMBER=K123456
   KOPOKOPO_ENVIRONMENT=sandbox
   KOPOKOPO_CALLBACK_URL=https://yourapp.com/api/kopokopo/webhook
   ```

6. Add `.env` to `.gitignore` if not already present.

7. Create webhook signature verification utility.

8. If using a framework with API routes, offer to create webhook handlers:
   - `src/app/api/kopokopo/webhook/route.ts` (Next.js App Router)
   - `src/pages/api/kopokopo/webhook.ts` (Next.js Pages)
   - `src/routes/kopokopo.ts` (Express)

9. Print next steps:
   - Register at https://sandbox.kopokopo.com/
   - Get API credentials from dashboard
   - Set environment variables in .env
   - Subscribe to webhooks for payment notifications

## SDK Client Template

```typescript
import K2 from 'k2-connect-node';

interface K2Options {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  baseUrl: string;
}

class KopokopoClient {
  private k2: any;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private tillNumber: string;

  constructor() {
    const env = process.env.KOPOKOPO_ENVIRONMENT || 'sandbox';

    const options: K2Options = {
      clientId: process.env.KOPOKOPO_CLIENT_ID!,
      clientSecret: process.env.KOPOKOPO_CLIENT_SECRET!,
      apiKey: process.env.KOPOKOPO_API_KEY!,
      baseUrl: env === 'production'
        ? 'https://api.kopokopo.com'
        : 'https://sandbox.kopokopo.com'
    };

    this.k2 = new K2(options);
    this.tillNumber = process.env.KOPOKOPO_TILL_NUMBER!;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenService = this.k2.TokenService;
    const { access_token, expires_in } = await tokenService.getToken();

    this.accessToken = access_token;
    this.tokenExpiry = Date.now() + (expires_in - 60) * 1000;

    return access_token;
  }

  async initiatePayment(options: {
    phone: string;
    amount: number;
    firstName: string;
    lastName: string;
    email?: string;
    callbackUrl?: string;
    metadata?: Record<string, string>;
  }) {
    const token = await this.getAccessToken();
    const stkService = this.k2.StkService;
    stkService.setAccessToken(token);

    return stkService.initiateIncomingPayment({
      tillNumber: this.tillNumber,
      firstName: options.firstName,
      lastName: options.lastName,
      phoneNumber: options.phone,
      email: options.email || '',
      currency: 'KES',
      amount: options.amount,
      callbackUrl: options.callbackUrl || process.env.KOPOKOPO_CALLBACK_URL,
      metadata: options.metadata
    });
  }

  async createPayRecipient(options: {
    type: 'mobile_wallet' | 'bank_account';
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    accountName?: string;
    accountNumber?: string;
    bankBranchRef?: string;
  }) {
    const token = await this.getAccessToken();
    const payService = this.k2.PayService;
    payService.setAccessToken(token);

    if (options.type === 'mobile_wallet') {
      return payService.addPayRecipient({
        type: 'mobile_wallet',
        firstName: options.firstName,
        lastName: options.lastName,
        phoneNumber: options.phone!,
        email: options.email,
        network: 'Safaricom'
      });
    } else {
      return payService.addPayRecipient({
        type: 'bank_account',
        accountName: options.accountName!,
        accountNumber: options.accountNumber!,
        bankBranchRef: options.bankBranchRef!,
        settlementMethod: 'EFT'
      });
    }
  }

  async sendPayment(options: {
    destinationRef: string;
    destinationType: 'mobile_wallet' | 'bank_account';
    amount: number;
    description: string;
    callbackUrl?: string;
  }) {
    const token = await this.getAccessToken();
    const payService = this.k2.PayService;
    payService.setAccessToken(token);

    return payService.sendPay({
      destinationReference: options.destinationRef,
      destinationType: options.destinationType,
      amount: options.amount,
      currency: 'KES',
      description: options.description,
      callbackUrl: options.callbackUrl || process.env.KOPOKOPO_CALLBACK_URL
    });
  }
}

export const kopokopo = new KopokopoClient();
```

## Webhook Verification Template

```typescript
import crypto from 'crypto';

export function verifyKopokopoWebhook(
  payload: string,
  signature: string,
  apiKey: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Tips

- Kopokopo is ideal for Till Number (Buy Goods) transactions
- Unlike Daraja, Kopokopo handles the complexity of M-Pesa integration
- Webhooks are essential - payments are confirmed asynchronously
- Reference the kopokopo skill for detailed API documentation
