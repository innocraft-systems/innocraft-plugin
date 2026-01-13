---
name: setup-daraja
description: Set up Safaricom Daraja (M-Pesa) integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--express | --c2b | --b2c | --full]"
---

# Setup Daraja M-Pesa Integration

Set up Safaricom Daraja API for M-Pesa payments in Kenya.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the integration type:
   - If `--express` flag: Set up M-Pesa Express (STK Push) only
   - If `--c2b` flag: Set up C2B (Customer to Business) only
   - If `--b2c` flag: Set up B2C (Business to Customer) only
   - If `--full` flag: Set up all payment types
   - Otherwise: Ask the user which types they need

3. Install required dependencies:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/mpesa/client.ts` - M-Pesa client class
   - `src/lib/mpesa/types.ts` - TypeScript types
   - `src/lib/mpesa/utils.ts` - Helper functions (password, timestamp)

5. Create the M-Pesa client with:
   - OAuth token management with caching
   - Environment switching (sandbox/production)
   - STK Push implementation (if --express or --full)
   - C2B URL registration (if --c2b or --full)
   - B2C payment (if --b2c or --full)

6. Create or update `.env.example` with required variables:
   ```
   # Daraja M-Pesa Configuration
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_PASSKEY=your_passkey
   MPESA_SHORTCODE=174379
   MPESA_ENVIRONMENT=sandbox
   MPESA_CALLBACK_URL=https://yourapp.com/api/mpesa/callback
   ```

7. Add `.env` to `.gitignore` if not already present.

8. If using a framework with API routes (Next.js, Express, etc.), offer to create callback handlers:
   - `src/app/api/mpesa/callback/route.ts` (Next.js App Router)
   - `src/pages/api/mpesa/callback.ts` (Next.js Pages)
   - `src/routes/mpesa.ts` (Express)

9. Print next steps:
   - Register at https://developer.safaricom.co.ke/
   - Create an app to get Consumer Key and Secret
   - Set environment variables in .env
   - For production: Apply for Go Live

## Client Template

```typescript
import axios, { AxiosInstance } from 'axios';

interface TokenCache {
  token: string;
  expiresAt: number;
}

export class MpesaClient {
  private consumerKey: string;
  private consumerSecret: string;
  private passkey: string;
  private shortcode: string;
  private baseUrl: string;
  private callbackUrl: string;
  private tokenCache: TokenCache | null = null;
  private http: AxiosInstance;

  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY!;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
    this.passkey = process.env.MPESA_PASSKEY!;
    this.shortcode = process.env.MPESA_SHORTCODE!;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL!;

    const env = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.baseUrl = env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    this.http = axios.create({ baseURL: this.baseUrl });
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`
    ).toString('base64');

    const { data } = await this.http.get(
      '/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000
    };

    return this.tokenCache.token;
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  }

  private generatePassword(timestamp: string): string {
    return Buffer.from(
      `${this.shortcode}${this.passkey}${timestamp}`
    ).toString('base64');
  }

  async stkPush(options: {
    phone: string;
    amount: number;
    accountRef: string;
    description?: string;
  }) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    const { data } = await this.http.post(
      '/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: options.amount,
        PartyA: options.phone,
        PartyB: this.shortcode,
        PhoneNumber: options.phone,
        CallBackURL: this.callbackUrl,
        AccountReference: options.accountRef,
        TransactionDesc: options.description || 'Payment'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }

  async stkQuery(checkoutRequestId: string) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.generatePassword(timestamp);

    const { data } = await this.http.post(
      '/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }
}

export const mpesa = new MpesaClient();
```

## Tips

- Use sandbox for testing with shortcode 174379
- Phone numbers must be in format 2547XXXXXXXX
- Amount must be whole numbers (no decimals)
- AccountReference max 12 characters
- Reference the daraja skill for detailed API documentation
