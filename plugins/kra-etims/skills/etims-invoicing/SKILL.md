---
name: etims-invoicing
description: This skill provides guidance for submitting invoices to KRA eTIMS. Use when the user asks about "tax invoice", "eTIMS invoice", "VAT invoice Kenya", "credit note", "debit note", "sales submission KRA", "invoice validation", "CU invoice number", or needs help with invoice formats, tax calculations, or KRA invoice submission.
---

# KRA eTIMS Invoicing

Submit sales invoices, credit notes, and debit notes to KRA for tax compliance. Every sale must be reported and receive a CU Invoice Number.

## Sales Submission

### Submit Sales Invoice

```bash
POST /api/sales/send
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "invcNo": 1,
  "orgInvcNo": 0,
  "custTin": "A000000001R",
  "custNm": "John Doe",
  "salesTyCd": "N",
  "rcptTyCd": "S",
  "pmtTyCd": "01",
  "salesSttsCd": "02",
  "cfmDt": "20240115123045",
  "salesDt": "20240115",
  "stockRlsDt": null,
  "cnclReqDt": null,
  "cnclDt": null,
  "rfdDt": null,
  "rfdRsnCd": null,
  "totItemCnt": 2,
  "taxblAmtA": 8620.69,
  "taxblAmtB": 0,
  "taxblAmtC": 0,
  "taxblAmtD": 0,
  "taxblAmtE": 0,
  "taxRtA": 16,
  "taxRtB": 0,
  "taxRtC": 0,
  "taxRtD": 0,
  "taxRtE": 0,
  "taxAmtA": 1379.31,
  "taxAmtB": 0,
  "taxAmtC": 0,
  "taxAmtD": 0,
  "taxAmtE": 0,
  "totTaxblAmt": 8620.69,
  "totTaxAmt": 1379.31,
  "totAmt": 10000,
  "prchrAcptcYn": "N",
  "remark": "Sale at Martin Shop",
  "regrId": "admin",
  "regrNm": "Admin User",
  "modrId": "admin",
  "modrNm": "Admin User",
  "receipt": {
    "custTin": "A000000001R",
    "custMblNo": "0712345678",
    "rptNo": 1,
    "rcptPbctDt": "20240115123045",
    "trdeNm": "Martin Electronics",
    "adrs": "Nairobi, Kenya",
    "topMsg": "Thank you for shopping",
    "btmMsg": "Visit again",
    "prchrAcptcYn": "N"
  },
  "itemList": [
    {
      "itemSeq": 1,
      "itemCd": "KE1NTXU0000001",
      "itemClsCd": "5020102700",
      "itemNm": "Smartphone",
      "bcd": null,
      "pkgUnitCd": "EA",
      "pkg": 1,
      "qtyUnitCd": "EA",
      "qty": 1,
      "prc": 8000,
      "splyAmt": 8000,
      "dcRt": 0,
      "dcAmt": 0,
      "isrccCd": null,
      "isrccNm": null,
      "isrcRt": null,
      "isrcAmt": null,
      "taxTyCd": "A",
      "taxblAmt": 6896.55,
      "taxAmt": 1103.45,
      "totAmt": 8000
    },
    {
      "itemSeq": 2,
      "itemCd": "KE1NTXU0000002",
      "itemClsCd": "5020102700",
      "itemNm": "Phone Case",
      "pkgUnitCd": "EA",
      "pkg": 1,
      "qtyUnitCd": "EA",
      "qty": 2,
      "prc": 1000,
      "splyAmt": 2000,
      "dcRt": 0,
      "dcAmt": 0,
      "taxTyCd": "A",
      "taxblAmt": 1724.14,
      "taxAmt": 275.86,
      "totAmt": 2000
    }
  ]
}
```

### Response

```json
{
  "resultCd": "000",
  "resultMsg": "Successful",
  "resultDt": "20240115123050",
  "data": {
    "rcptNo": 1,
    "intrlData": "SIGNED_DATA_STRING",
    "rcptSign": "RECEIPT_SIGNATURE",
    "sdcDateTime": "20240115123050",
    "sdcId": "SDC001",
    "mrcNo": "MRC001",
    "qrCode": "https://etims.kra.go.ke/invoice/verify?..."
  }
}
```

**Important:** Store `rcptNo`, `intrlData`, `rcptSign`, and `qrCode` - these prove KRA validation.

## Invoice Fields Reference

### Header Fields

| Field | Type | Description |
|-------|------|-------------|
| `invcNo` | Integer | Your invoice sequence number |
| `orgInvcNo` | Integer | Original invoice (for credit/debit notes) |
| `custTin` | String | Customer's KRA PIN (or null for cash sales) |
| `custNm` | String | Customer name |
| `salesTyCd` | String | Sales type code |
| `rcptTyCd` | String | Receipt type code |
| `pmtTyCd` | String | Payment type code |
| `salesSttsCd` | String | Sales status code |
| `cfmDt` | String | Confirmation date (YYYYMMDDHHMMSS) |
| `salesDt` | String | Sales date (YYYYMMDD) |

### Sales Type Codes (salesTyCd)

| Code | Description |
|------|-------------|
| N | Normal sale |
| C | Copy of invoice |

### Receipt Type Codes (rcptTyCd)

| Code | Description |
|------|-------------|
| S | Sale |
| R | Refund |
| C | Credit Note |
| D | Debit Note |

### Payment Type Codes (pmtTyCd)

| Code | Description |
|------|-------------|
| 01 | Cash |
| 02 | Credit |
| 03 | Cash/Credit |
| 04 | Bank Check |
| 05 | Debit/Credit Card |
| 06 | Mobile Money |
| 07 | Wire Transfer |

### Sales Status Codes (salesSttsCd)

| Code | Description |
|------|-------------|
| 01 | Wait for Approval |
| 02 | Approved |
| 03 | Credit Note Generated |
| 04 | Canceled |

### Tax Type Codes (taxTyCd)

| Code | Description | Rate |
|------|-------------|------|
| A | Standard VAT | 16% |
| B | Zero-rated | 0% |
| C | Exempt | 0% |
| D | Excise Duty | Varies |
| E | Other | Varies |

## Tax Calculations

### VAT Calculation (16%)

```typescript
// KRA expects tax-inclusive pricing broken down
function calculateVAT(totalAmount: number, taxType: 'A' | 'B' | 'C' = 'A') {
  if (taxType === 'B' || taxType === 'C') {
    return {
      taxableAmount: totalAmount,
      taxAmount: 0,
      totalAmount: totalAmount,
    };
  }

  // Standard VAT (16%)
  const taxRate = 0.16;
  const taxableAmount = totalAmount / (1 + taxRate);
  const taxAmount = totalAmount - taxableAmount;

  return {
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: totalAmount,
  };
}

// Example
const item = calculateVAT(10000); // KES 10,000 total
// { taxableAmount: 8620.69, taxAmount: 1379.31, totalAmount: 10000 }
```

## Credit Notes

To issue a credit note (partial or full refund):

```typescript
const creditNote = {
  // ... common fields
  rcptTyCd: 'C', // Credit Note
  orgInvcNo: 1,  // Reference to original invoice
  rfdDt: '20240116',
  rfdRsnCd: '01', // Refund reason code
  // Negative amounts for refunded items
  itemList: [
    {
      itemSeq: 1,
      itemCd: 'KE1NTXU0000001',
      qty: -1, // Negative quantity
      prc: 8000,
      splyAmt: -8000,
      taxblAmt: -6896.55,
      taxAmt: -1103.45,
      totAmt: -8000,
      // ... other fields
    }
  ]
};
```

### Refund Reason Codes (rfdRsnCd)

| Code | Description |
|------|-------------|
| 01 | Wrong entry |
| 02 | Return by customer |
| 03 | Defective goods |
| 04 | Other |

## Query Sales

### Get Sales Transactions

```bash
POST /api/sales/select
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000",
  "invcNo": null
}
```

To query specific invoice, provide `invcNo`.

## Node.js Implementation

```typescript
interface InvoiceItem {
  itemCd: string;
  itemClsCd: string;
  itemNm: string;
  qty: number;
  prc: number;
  taxTyCd: 'A' | 'B' | 'C' | 'D' | 'E';
}

interface Invoice {
  customerTin?: string;
  customerName: string;
  customerPhone?: string;
  paymentType: string;
  items: InvoiceItem[];
  remark?: string;
}

class EtimsInvoicing {
  private client: EtimsClient;
  private invoiceCounter: number = 0;

  constructor(client: EtimsClient) {
    this.client = client;
  }

  async submitSale(invoice: Invoice) {
    this.invoiceCounter++;

    // Calculate totals per tax type
    const taxTotals = this.calculateTaxTotals(invoice.items);

    // Build item list
    const itemList = invoice.items.map((item, index) => {
      const vat = this.calculateVAT(item.prc * item.qty, item.taxTyCd);
      return {
        itemSeq: index + 1,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemNm: item.itemNm,
        pkgUnitCd: 'EA',
        pkg: item.qty,
        qtyUnitCd: 'EA',
        qty: item.qty,
        prc: item.prc,
        splyAmt: item.prc * item.qty,
        dcRt: 0,
        dcAmt: 0,
        taxTyCd: item.taxTyCd,
        taxblAmt: vat.taxableAmount,
        taxAmt: vat.taxAmount,
        totAmt: vat.totalAmount,
      };
    });

    const now = new Date();
    const cfmDt = this.formatDateTime(now);
    const salesDt = this.formatDate(now);

    const payload = {
      invcNo: this.invoiceCounter,
      orgInvcNo: 0,
      custTin: invoice.customerTin || null,
      custNm: invoice.customerName,
      salesTyCd: 'N',
      rcptTyCd: 'S',
      pmtTyCd: invoice.paymentType,
      salesSttsCd: '02',
      cfmDt,
      salesDt,
      stockRlsDt: null,
      cnclReqDt: null,
      cnclDt: null,
      rfdDt: null,
      rfdRsnCd: null,
      totItemCnt: itemList.length,
      ...taxTotals,
      prchrAcptcYn: 'N',
      remark: invoice.remark || '',
      regrId: 'system',
      regrNm: 'System',
      modrId: 'system',
      modrNm: 'System',
      receipt: {
        custTin: invoice.customerTin || null,
        custMblNo: invoice.customerPhone || null,
        rptNo: this.invoiceCounter,
        rcptPbctDt: cfmDt,
      },
      itemList,
    };

    return this.client.request('/api/sales/send', payload);
  }

  private calculateVAT(amount: number, taxType: string) {
    if (taxType === 'B' || taxType === 'C') {
      return { taxableAmount: amount, taxAmount: 0, totalAmount: amount };
    }
    const taxRate = taxType === 'A' ? 0.16 : 0;
    const taxableAmount = Math.round((amount / (1 + taxRate)) * 100) / 100;
    const taxAmount = Math.round((amount - taxableAmount) * 100) / 100;
    return { taxableAmount, taxAmount, totalAmount: amount };
  }

  private calculateTaxTotals(items: InvoiceItem[]) {
    const totals = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const taxAmts = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    items.forEach(item => {
      const amount = item.prc * item.qty;
      const vat = this.calculateVAT(amount, item.taxTyCd);
      totals[item.taxTyCd] += vat.taxableAmount;
      taxAmts[item.taxTyCd] += vat.taxAmount;
    });

    const totTaxblAmt = Object.values(totals).reduce((a, b) => a + b, 0);
    const totTaxAmt = Object.values(taxAmts).reduce((a, b) => a + b, 0);

    return {
      taxblAmtA: totals.A, taxblAmtB: totals.B, taxblAmtC: totals.C,
      taxblAmtD: totals.D, taxblAmtE: totals.E,
      taxRtA: 16, taxRtB: 0, taxRtC: 0, taxRtD: 0, taxRtE: 0,
      taxAmtA: taxAmts.A, taxAmtB: taxAmts.B, taxAmtC: taxAmts.C,
      taxAmtD: taxAmts.D, taxAmtE: taxAmts.E,
      totTaxblAmt, totTaxAmt,
      totAmt: totTaxblAmt + totTaxAmt,
    };
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }
}

// Usage
const invoicing = new EtimsInvoicing(etimsClient);

const result = await invoicing.submitSale({
  customerName: 'John Doe',
  customerPhone: '0712345678',
  paymentType: '06', // Mobile Money (M-Pesa)
  items: [
    {
      itemCd: 'KE1NTXU0000001',
      itemClsCd: '5020102700',
      itemNm: 'Smartphone',
      qty: 1,
      prc: 8000,
      taxTyCd: 'A',
    },
  ],
  remark: 'Sale via Martin Shop App',
});

console.log('CU Invoice:', result.data.rcptNo);
console.log('QR Code:', result.data.qrCode);
```

## Receipt/Invoice Format

After successful submission, print receipt with:

1. **Business Details** - Name, TIN, Address
2. **CU Invoice Number** - KRA-assigned number
3. **QR Code** - For verification
4. **Item Details** - Name, qty, price, tax
5. **Tax Breakdown** - By tax type
6. **Totals** - Subtotal, VAT, Grand total
7. **Signature** - eTIMS digital signature

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Item not registered | Product not in KRA system | Register item first via stock/save-master |
| Invalid tax calculation | Amounts don't match | Recalculate VAT correctly |
| Duplicate invoice | Same invcNo submitted | Use unique sequence numbers |
| Invalid customer TIN | Wrong KRA PIN format | Verify customer PIN or use null |
