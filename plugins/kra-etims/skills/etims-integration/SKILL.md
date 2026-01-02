---
name: etims-integration
description: This skill provides guidance for integrating with KRA eTIMS (Electronic Tax Invoice Management System) in Kenya. Use when the user asks about "eTIMS", "KRA API", "OSCU", "VSCU", "tax compliance Kenya", "eTIMS integration", "KRA tax invoice", "electronic invoicing Kenya", or needs help with eTIMS authentication, device initialization, or API setup.
---

# KRA eTIMS Integration

KRA's Electronic Tax Invoice Management System (eTIMS) is mandatory for all Kenyan businesses. This guide covers OSCU/VSCU integration for system-to-system tax compliance.

## Base URLs

| Environment | URL |
|-------------|-----|
| Sandbox | `https://etims-api-sbx.kra.go.ke` |
| Production | `https://etims-api.kra.go.ke/etims-api` |

## Prerequisites

Before integrating, you need from KRA:

| Item | Description | How to Get |
|------|-------------|------------|
| TIN | Tax Identification Number | KRA PIN registration |
| Branch ID | `00` for main, KRA-assigned for branches | eTIMS portal |
| Device Serial | Your OSCU/VSCU identifier | eTIMS registration |
| Communication Key | API authentication key | KRA issues once (keep secure!) |

## Authentication

### Initialize Device

First-time setup to register your device with KRA:

```bash
POST /api/initialization/osdc-info
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "dvcSrlNo": "OSCU-001"
}
```

**Response:**
```json
{
  "resultCd": "000",
  "resultMsg": "Successful",
  "resultDt": "20240115123045",
  "data": {
    "dvcSrlNo": "OSCU-001",
    "sdcId": "SDC001",
    "mrcNo": "MRC001",
    "cmcKey": "your_communication_key"
  }
}
```

**Important:** The `cmcKey` (Communication Key) is issued **once**. Store it securely!

## Fetch Reference Data

### Get Code List

Retrieve standard KRA codes (tax types, payment methods, etc.):

```bash
POST /api/basic-data/code-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

**Response includes:**
- Tax type codes (A, B, C, D, E)
- Payment type codes
- Transaction type codes
- Country codes
- Packaging unit codes
- Quantity unit codes

### Get Item Classifications

Fetch UNSPSC product categories:

```bash
POST /api/basic-data/item-cls-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Get Branch List

```bash
POST /api/basic-data/bhf-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Get Customer List

```bash
POST /api/basic-data/customer-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Get Taxpayer Info

```bash
POST /api/basic-data/taxpayer-info
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00"
}
```

### Get Notices

Retrieve KRA announcements and updates:

```bash
POST /api/basic-data/notice-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

## Response Codes

| Code | Meaning |
|------|---------|
| 000 | Success |
| 001 | Invalid request |
| 002 | Authentication failed |
| 003 | Device not registered |
| 004 | Invalid TIN |
| 005 | Invalid branch |
| 006 | Duplicate transaction |

## Node.js Implementation

```typescript
import axios from 'axios';

interface EtimsConfig {
  baseUrl: string;
  tin: string;
  bhfId: string;
  dvcSrlNo: string;
  cmcKey?: string;
}

class EtimsClient {
  private config: EtimsConfig;

  constructor(config: EtimsConfig) {
    this.config = config;
  }

  private async request(endpoint: string, data: object) {
    const response = await axios.post(
      `${this.config.baseUrl}${endpoint}`,
      {
        ...data,
        tin: this.config.tin,
        bhfId: this.config.bhfId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'cmcKey': this.config.cmcKey,
        }
      }
    );

    if (response.data.resultCd !== '000') {
      throw new Error(`eTIMS Error: ${response.data.resultMsg}`);
    }

    return response.data;
  }

  // Initialize device (first-time setup)
  async initializeDevice() {
    return this.request('/api/initialization/osdc-info', {
      dvcSrlNo: this.config.dvcSrlNo,
    });
  }

  // Fetch code list
  async getCodeList(lastReqDt: string = '20240101000000') {
    return this.request('/api/basic-data/code-list', { lastReqDt });
  }

  // Fetch item classifications
  async getItemClassifications(lastReqDt: string = '20240101000000') {
    return this.request('/api/basic-data/item-cls-list', { lastReqDt });
  }

  // Fetch customers
  async getCustomers(lastReqDt: string = '20240101000000') {
    return this.request('/api/basic-data/customer-list', { lastReqDt });
  }

  // Fetch branches
  async getBranches(lastReqDt: string = '20240101000000') {
    return this.request('/api/basic-data/bhf-list', { lastReqDt });
  }

  // Fetch notices
  async getNotices(lastReqDt: string = '20240101000000') {
    return this.request('/api/basic-data/notice-list', { lastReqDt });
  }
}

// Usage
const etims = new EtimsClient({
  baseUrl: process.env.ETIMS_BASE_URL!,
  tin: process.env.ETIMS_TIN!,
  bhfId: process.env.ETIMS_BRANCH_ID!,
  dvcSrlNo: process.env.ETIMS_DEVICE_SERIAL!,
  cmcKey: process.env.ETIMS_COMM_KEY,
});

// Initialize (first time only)
const initResult = await etims.initializeDevice();
console.log('Communication Key:', initResult.data.cmcKey);

// Fetch reference data
const codes = await etims.getCodeList();
const items = await etims.getItemClassifications();
```

## Multi-Tenant Architecture

For SaaS platforms with multiple business tenants:

```typescript
// Store per-tenant eTIMS credentials
interface TenantEtimsConfig {
  tenantId: string;
  tin: string;
  bhfId: string;
  dvcSrlNo: string;
  cmcKeyEncrypted: string; // Encrypt before storing!
}

// Create client for specific tenant
function createTenantEtimsClient(tenant: TenantEtimsConfig): EtimsClient {
  return new EtimsClient({
    baseUrl: process.env.ETIMS_BASE_URL!,
    tin: tenant.tin,
    bhfId: tenant.bhfId,
    dvcSrlNo: tenant.dvcSrlNo,
    cmcKey: decrypt(tenant.cmcKeyEncrypted),
  });
}
```

## Sync Strategy

KRA recommends periodic syncing:

| Data Type | Sync Frequency |
|-----------|----------------|
| Code List | Every 2 days |
| Item Classifications | Daily |
| Notices | Daily |
| Customer List | As needed |

```typescript
// Scheduled sync job
async function syncEtimsData(etims: EtimsClient) {
  const lastSync = await getLastSyncDate();
  const lastReqDt = formatDate(lastSync); // YYYYMMDDHHMMSS

  // Fetch updates since last sync
  const [codes, items, notices] = await Promise.all([
    etims.getCodeList(lastReqDt),
    etims.getItemClassifications(lastReqDt),
    etims.getNotices(lastReqDt),
  ]);

  // Store in database
  await saveCodeList(codes.data);
  await saveItemClassifications(items.data);
  await saveNotices(notices.data);

  await updateLastSyncDate(new Date());
}
```

## Certification Process

To become a certified eTIMS integrator:

1. **Apply** - Submit Bio Data Form to KRA eTIMS Operations
2. **Documentation** - Provide business registration, technical staff proof
3. **Development** - Build integration in sandbox
4. **Testing** - Complete KRA test scenarios
5. **Vetting** - KRA reviews your implementation
6. **Certification** - Receive integrator certification
7. **Go Live** - Switch to production credentials

## Resources

- **Sandbox Portal**: https://etims-sbx.kra.go.ke
- **Production Portal**: https://etims.kra.go.ke
- **KRA Support**: etims@kra.go.ke
