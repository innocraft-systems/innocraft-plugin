---
name: setup-etims
description: Set up KRA eTIMS integration for tax compliance in Kenya
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--oscu | --vscu]"
---

# Setup KRA eTIMS Integration

Set up KRA Electronic Tax Invoice Management System (eTIMS) for Kenya tax compliance.

## Instructions

1. Check if the project has an existing package.json. If not, inform the user they need to initialize a project first.

2. Determine the control unit type:
   - If `--oscu` flag: Online Sales Control Unit (cloud-based)
   - If `--vscu` flag: Virtual Sales Control Unit (server-based)
   - Otherwise: Ask the user which type they're registered for

3. Install required dependencies:
   ```bash
   npm install axios dotenv
   ```

4. Create the directory structure:
   - `src/lib/etims/client.ts` - eTIMS API client
   - `src/lib/etims/types.ts` - TypeScript types
   - `src/lib/etims/codes.ts` - KRA code constants
   - `src/lib/etims/utils.ts` - Helper functions

5. Create or update `.env.example` with required variables:
   ```
   # KRA eTIMS Configuration
   ETIMS_TIN=P000000000R
   ETIMS_BRANCH_ID=00
   ETIMS_DEVICE_SERIAL=OSCU-001
   ETIMS_CMC_KEY=your_communication_key
   ETIMS_ENVIRONMENT=sandbox
   ```

6. Add `.env` to `.gitignore` if not already present.

7. Create the eTIMS client with:
   - Device initialization
   - Code list fetching
   - Item classification fetching
   - Invoice submission
   - Stock management

8. Print next steps:
   - Register on eTIMS portal (etims.kra.go.ke)
   - Get TIN, Branch ID, and Device Serial
   - Initialize device to get Communication Key
   - Fetch reference data (codes, classifications)

## Client Template

```typescript
import axios, { AxiosInstance } from 'axios';

interface EtimsConfig {
  tin: string;
  branchId: string;
  deviceSerial: string;
  cmcKey: string;
}

interface InvoiceItem {
  itemSeq: number;
  itemCd: string;
  itemClsCd: string;
  itemNm: string;
  pkgUnitCd: string;
  pkg: number;
  qtyUnitCd: string;
  qty: number;
  prc: number;
  splyAmt: number;
  dcRt: number;
  dcAmt: number;
  taxTyCd: string;
  taxAmt: number;
  totAmt: number;
}

export class EtimsClient {
  private config: EtimsConfig;
  private baseUrl: string;
  private http: AxiosInstance;

  constructor() {
    this.config = {
      tin: process.env.ETIMS_TIN!,
      branchId: process.env.ETIMS_BRANCH_ID || '00',
      deviceSerial: process.env.ETIMS_DEVICE_SERIAL!,
      cmcKey: process.env.ETIMS_CMC_KEY!
    };

    const env = process.env.ETIMS_ENVIRONMENT || 'sandbox';
    this.baseUrl = env === 'production'
      ? 'https://etims-api.kra.go.ke/etims-api'
      : 'https://etims-api-sbx.kra.go.ke';

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private getTimestamp(): string {
    return new Date().toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
  }

  private basePayload() {
    return {
      tin: this.config.tin,
      bhfId: this.config.branchId,
      dvcSrlNo: this.config.deviceSerial,
      cmcKey: this.config.cmcKey
    };
  }

  // ========== INITIALIZATION ==========

  async initializeDevice() {
    const { data } = await this.http.post('/api/initialization/osdc-info', {
      tin: this.config.tin,
      bhfId: this.config.branchId,
      dvcSrlNo: this.config.deviceSerial
    });

    if (data.resultCd !== '000') {
      throw new Error(`eTIMS Error: ${data.resultMsg}`);
    }

    return data.data;
  }

  // ========== REFERENCE DATA ==========

  async fetchCodes(lastReqDt?: string) {
    const { data } = await this.http.post('/api/basic-data/code-list', {
      ...this.basePayload(),
      lastReqDt: lastReqDt || '20200101000000'
    });

    return data.data;
  }

  async fetchItemClassifications(lastReqDt?: string) {
    const { data } = await this.http.post('/api/basic-data/item-cls-list', {
      ...this.basePayload(),
      lastReqDt: lastReqDt || '20200101000000'
    });

    return data.data;
  }

  // ========== ITEMS ==========

  async saveItem(item: {
    itemCd: string;
    itemClsCd: string;
    itemNm: string;
    pkgUnitCd: string;
    qtyUnitCd: string;
    taxTyCd: string;
    salePrice: number;
  }) {
    const { data } = await this.http.post('/api/items/item-save', {
      ...this.basePayload(),
      itemCd: item.itemCd,
      itemClsCd: item.itemClsCd,
      itemTyCd: '1', // Finished goods
      itemNm: item.itemNm,
      itemStdNm: item.itemNm,
      orgnNatCd: 'KE',
      pkgUnitCd: item.pkgUnitCd,
      qtyUnitCd: item.qtyUnitCd,
      taxTyCd: item.taxTyCd,
      btchNo: null,
      bcd: null,
      dftPrc: item.salePrice,
      grpPrcL1: item.salePrice,
      grpPrcL2: item.salePrice,
      grpPrcL3: item.salePrice,
      grpPrcL4: item.salePrice,
      grpPrcL5: item.salePrice,
      addInfo: null,
      sftyQty: 0,
      isrcAplcbYn: 'N',
      useYn: 'Y',
      regrId: 'SYSTEM',
      regrNm: 'System',
      modrId: 'SYSTEM',
      modrNm: 'System'
    });

    return data;
  }

  // ========== INVOICES ==========

  async submitSalesInvoice(invoice: {
    invoiceNo: number;
    custTin?: string;
    custNm: string;
    custAddr?: string;
    items: InvoiceItem[];
    paymentType: string;
    remark?: string;
  }) {
    const totals = this.calculateTotals(invoice.items);

    const { data } = await this.http.post('/api/trnsSales/save-sales', {
      ...this.basePayload(),
      invcNo: invoice.invoiceNo,
      orgInvcNo: 0,
      custTin: invoice.custTin || null,
      custNm: invoice.custNm,
      custMblNo: null,
      custAddr: invoice.custAddr || null,
      rcptTyCd: 'S', // Sales
      pmtTyCd: invoice.paymentType,
      salesSttsCd: '02', // Approved
      cfmDt: this.getTimestamp(),
      salesDt: this.getTimestamp().slice(0, 8),
      stockRlsDt: this.getTimestamp(),
      cnclReqDt: null,
      cnclDt: null,
      rfdDt: null,
      rfdRsnCd: null,
      totItemCnt: invoice.items.length,
      taxblAmtA: totals.taxableA,
      taxblAmtB: totals.taxableB,
      taxblAmtC: totals.taxableC,
      taxblAmtD: totals.taxableD,
      taxblAmtE: totals.taxableE,
      taxRtA: 16,
      taxRtB: 16,
      taxRtC: 0,
      taxRtD: 0,
      taxRtE: 8,
      taxAmtA: totals.taxA,
      taxAmtB: totals.taxB,
      taxAmtC: totals.taxC,
      taxAmtD: totals.taxD,
      taxAmtE: totals.taxE,
      totTaxblAmt: totals.totalTaxable,
      totTaxAmt: totals.totalTax,
      totAmt: totals.grandTotal,
      remark: invoice.remark || null,
      regrId: 'SYSTEM',
      regrNm: 'System',
      modrId: 'SYSTEM',
      modrNm: 'System',
      itemList: invoice.items
    });

    if (data.resultCd !== '000') {
      throw new Error(`eTIMS Error: ${data.resultMsg}`);
    }

    return {
      success: true,
      cuInvoiceNo: data.data?.rcptNo,
      signDate: data.data?.sdcDt,
      ...data.data
    };
  }

  private calculateTotals(items: InvoiceItem[]) {
    const totals = {
      taxableA: 0, taxableB: 0, taxableC: 0, taxableD: 0, taxableE: 0,
      taxA: 0, taxB: 0, taxC: 0, taxD: 0, taxE: 0,
      totalTaxable: 0, totalTax: 0, grandTotal: 0
    };

    for (const item of items) {
      const key = item.taxTyCd as 'A' | 'B' | 'C' | 'D' | 'E';
      const taxableKey = `taxable${key}` as keyof typeof totals;
      const taxKey = `tax${key}` as keyof typeof totals;

      totals[taxableKey] += item.splyAmt;
      totals[taxKey] += item.taxAmt;
      totals.totalTaxable += item.splyAmt;
      totals.totalTax += item.taxAmt;
      totals.grandTotal += item.totAmt;
    }

    return totals;
  }
}

export const etims = new EtimsClient();
```

## Tax Type Codes

| Code | Description | Rate |
|------|-------------|------|
| A | Standard rated (VAT 16%) | 16% |
| B | Zero rated | 0% |
| C | Exempt | 0% |
| D | Not applicable | 0% |
| E | Reduced rate (8%) | 8% |

## Payment Type Codes

| Code | Description |
|------|-------------|
| 01 | Cash |
| 02 | Credit |
| 03 | Cash/Credit |
| 04 | Bank Transfer |
| 05 | Mobile Money |
| 06 | Other |

## Tips

- Communication Key is issued ONCE during initialization - store securely
- Always sync reference data (codes, classifications) on startup
- Invoice numbers must be sequential per branch
- Test thoroughly in sandbox before production
- Reference the etims-integration skill for detailed API documentation
