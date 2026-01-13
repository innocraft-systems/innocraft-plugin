---
name: setup-intasend
description: Set up IntaSend payment gateway integration
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--collect | --send | --full]"
---

# Setup IntaSend Payment Gateway

Set up IntaSend API for collections, payouts, and wallet management in Kenya.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the integration type:
   - If `--collect` flag: Set up payment collection only
   - If `--send` flag: Set up payouts (B2C, PesaLink) only
   - If `--full` flag: Set up collections, payouts, and wallets
   - Otherwise: Ask the user which features they need

3. Install required dependencies:
   ```bash
   npm install intasend-node dotenv
   ```

   Or for REST API approach:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/intasend/client.ts` - IntaSend client
   - `src/lib/intasend/types.ts` - TypeScript types
   - `src/lib/intasend/webhooks.ts` - Webhook handlers

5. Create or update `.env.example` with required variables:
   ```
   # IntaSend Configuration
   INTASEND_PUBLISHABLE_KEY=ISPubKey_test_xxx
   INTASEND_SECRET_KEY=ISSecretKey_test_xxx
   INTASEND_ENVIRONMENT=sandbox
   INTASEND_WEBHOOK_URL=https://yourapp.com/api/intasend/webhook
   ```

6. Add `.env` to `.gitignore` if not already present.

7. If using a framework with API routes, create:
   - Collection initiation endpoint
   - Webhook handler
   - Payout endpoints (if --send or --full)

8. Print next steps:
   - Register at https://intasend.com/
   - Get API keys from dashboard
   - Set environment variables in .env
   - Configure webhooks in dashboard

## SDK Client Template

```typescript
const IntaSend = require('intasend-node');

class IntaSendClient {
  private client: any;

  constructor() {
    const env = process.env.INTASEND_ENVIRONMENT || 'sandbox';

    this.client = new IntaSend(
      process.env.INTASEND_PUBLISHABLE_KEY,
      process.env.INTASEND_SECRET_KEY,
      env !== 'production' // test_mode = true for sandbox
    );
  }

  // ========== COLLECTIONS ==========

  async createCollection(options: {
    amount: number;
    phone?: string;
    email?: string;
    firstName: string;
    lastName: string;
    method?: 'M-PESA' | 'CARD-PAYMENT';
    apiRef?: string;
  }) {
    const collection = this.client.collection();

    return collection.charge({
      first_name: options.firstName,
      last_name: options.lastName,
      email: options.email || '',
      phone_number: options.phone || '',
      amount: options.amount,
      currency: 'KES',
      method: options.method || 'M-PESA',
      api_ref: options.apiRef
    });
  }

  async getCollectionStatus(invoiceId: string) {
    const collection = this.client.collection();
    return collection.status(invoiceId);
  }

  // ========== M-PESA STK PUSH ==========

  async stkPush(options: {
    phone: string;
    amount: number;
    apiRef?: string;
  }) {
    const collection = this.client.collection();

    return collection.mpesaStkPush({
      phone_number: options.phone,
      amount: options.amount,
      api_ref: options.apiRef
    });
  }

  // ========== PAYOUTS ==========

  async createPayout(options: {
    phone: string;
    amount: number;
    narrative?: string;
  }) {
    const payouts = this.client.payouts();

    return payouts.mpesa({
      currency: 'KES',
      transactions: [{
        account: options.phone,
        amount: options.amount,
        narrative: options.narrative || 'Payout'
      }]
    });
  }

  async bankTransfer(options: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    name: string;
    narrative?: string;
  }) {
    const payouts = this.client.payouts();

    return payouts.bank({
      currency: 'KES',
      transactions: [{
        account: options.accountNumber,
        bank_code: options.bankCode,
        amount: options.amount,
        name: options.name,
        narrative: options.narrative || 'Bank transfer'
      }]
    });
  }

  async getPayoutStatus(trackingId: string) {
    const payouts = this.client.payouts();
    return payouts.status(trackingId);
  }

  // ========== WALLETS ==========

  async getWallets() {
    const wallets = this.client.wallets();
    return wallets.list();
  }

  async createWallet(options: {
    label: string;
    currency?: string;
    canDisburse?: boolean;
  }) {
    const wallets = this.client.wallets();
    return wallets.create({
      label: options.label,
      currency: options.currency || 'KES',
      can_disburse: options.canDisburse ?? true
    });
  }

  async fundWallet(options: {
    walletId: string;
    phone: string;
    amount: number;
  }) {
    const wallets = this.client.wallets();
    return wallets.fund({
      wallet_id: options.walletId,
      phone_number: options.phone,
      amount: options.amount
    });
  }

  async walletToMpesa(options: {
    walletId: string;
    phone: string;
    amount: number;
    narrative?: string;
  }) {
    const wallets = this.client.wallets();
    return wallets.withdraw({
      wallet_id: options.walletId,
      phone_number: options.phone,
      amount: options.amount,
      narrative: options.narrative || 'Withdrawal'
    });
  }
}

export const intasend = new IntaSendClient();
```

## Webhook Handler Template

```typescript
// Next.js App Router example
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('X-IntaSend-Signature') || '';

  if (!verifyWebhook(rawBody, signature, process.env.INTASEND_SECRET_KEY!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  switch (body.state) {
    case 'COMPLETE':
      // Payment successful
      // await updateOrder(body.api_ref, 'paid');
      break;
    case 'FAILED':
      // Payment failed
      // await updateOrder(body.api_ref, 'failed');
      break;
    case 'PENDING':
      // Still processing
      break;
  }

  return NextResponse.json({ status: 'ok' });
}
```

## Common Bank Codes

| Bank | Code |
|------|------|
| KCB Bank | 01 |
| Standard Chartered | 02 |
| Barclays/ABSA | 03 |
| Equity Bank | 68 |
| Co-operative Bank | 11 |
| NCBA | 07 |
| DTB | 63 |
| Family Bank | 70 |
| I&M Bank | 57 |

## Tips

- IntaSend supports M-Pesa, cards, bank transfers, and wallets
- Wallets are useful for holding funds before disbursement
- PesaLink enables instant bank transfers
- Reference the intasend skill for detailed API documentation
