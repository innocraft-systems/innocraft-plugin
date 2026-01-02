---
name: etims-stock
description: This skill provides guidance for managing stock and items with KRA eTIMS. Use when the user asks about "eTIMS stock", "item classification", "UNSPSC codes", "inventory KRA", "product registration", "stock movement", "item master", or needs help with registering products, stock transfers, or item categories in eTIMS.
---

# KRA eTIMS Stock Management

Register products and manage inventory movements with KRA eTIMS. All items must be registered before they can appear on invoices.

## Item Registration

### Save Item Master

Register a new product with KRA:

```bash
POST /api/stock/save-master
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "itemCd": "KE1NTXU0000001",
  "itemClsCd": "50201502",
  "itemTyCd": "1",
  "itemNm": "Samsung Galaxy A54",
  "itemStdNm": "Smartphone",
  "orgnNatCd": "KE",
  "pkgUnitCd": "EA",
  "qtyUnitCd": "EA",
  "taxTyCd": "A",
  "btchNo": null,
  "bcd": "8806094539981",
  "dftPrc": 45000,
  "grpPrcL1": 45000,
  "grpPrcL2": 44000,
  "grpPrcL3": 43000,
  "grpPrcL4": 42000,
  "grpPrcL5": 41000,
  "addInfo": "128GB, Black",
  "sftyQty": 10,
  "isrcAplcbYn": "N",
  "useYn": "Y",
  "regrId": "admin",
  "regrNm": "Admin"
}
```

### Response

```json
{
  "resultCd": "000",
  "resultMsg": "Successful",
  "resultDt": "20240115123045",
  "data": {
    "itemCd": "KE1NTXU0000001"
  }
}
```

## Item Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `itemCd` | String | Unique item code (your internal code) |
| `itemClsCd` | String | UNSPSC classification code |
| `itemTyCd` | String | Item type code |
| `itemNm` | String | Item name (as shown on invoice) |
| `itemStdNm` | String | Standard/generic name |
| `orgnNatCd` | String | Country of origin (ISO code) |
| `pkgUnitCd` | String | Packaging unit code |
| `qtyUnitCd` | String | Quantity unit code |
| `taxTyCd` | String | Tax type code (A, B, C, D, E) |
| `bcd` | String | Barcode (EAN/UPC) |
| `dftPrc` | Number | Default selling price |
| `sftyQty` | Number | Safety/minimum stock quantity |
| `useYn` | String | Active status (Y/N) |

### Item Type Codes (itemTyCd)

| Code | Description |
|------|-------------|
| 1 | Finished goods |
| 2 | Raw materials |
| 3 | Service |

### Packaging/Quantity Unit Codes

| Code | Description |
|------|-------------|
| EA | Each |
| KG | Kilogram |
| LT | Litre |
| MT | Metre |
| PK | Pack |
| BX | Box |
| DZ | Dozen |
| PR | Pair |

## UNSPSC Classification

Items must be classified using UNSPSC (United Nations Standard Products and Services Code). Fetch available classifications from KRA:

```bash
POST /api/basic-data/item-cls-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Common UNSPSC Categories

| Code | Category |
|------|----------|
| 50000000 | Food & Beverages |
| 50200000 | Beverages |
| 52000000 | Furniture & Furnishings |
| 43000000 | IT Equipment |
| 43200000 | Components & Hardware |
| 46000000 | Security & Safety |
| 47000000 | Cleaning Equipment |
| 53000000 | Apparel & Luggage |
| 56000000 | Building Materials |

### Item Code Format

KRA recommends item codes follow this pattern:
```
KE[TIN_LAST_4][BRANCH][SEQUENCE]

Example: KE1NTXU0000001
- KE = Kenya
- 1NTX = Last 4 of TIN
- U = Branch indicator
- 0000001 = Sequence number
```

## Stock Movements

### Record Stock Movement

Track stock transfers between branches or adjustments:

```bash
POST /api/stock/move-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Save Stock Input/Output

Record stock receipt or issue:

```bash
POST /api/stock/io-save
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "sarNo": 1,
  "orgSarNo": 0,
  "regTyCd": "M",
  "custTin": null,
  "custNm": null,
  "custBhfId": null,
  "sarTyCd": "01",
  "ocrnDt": "20240115",
  "totItemCnt": 1,
  "totTaxblAmt": 38793.10,
  "totTaxAmt": 6206.90,
  "totAmt": 45000,
  "remark": "Stock receipt from supplier",
  "regrId": "admin",
  "regrNm": "Admin",
  "itemList": [
    {
      "itemSeq": 1,
      "itemCd": "KE1NTXU0000001",
      "itemClsCd": "50201502",
      "itemNm": "Samsung Galaxy A54",
      "bcd": "8806094539981",
      "pkgUnitCd": "EA",
      "pkg": 10,
      "qtyUnitCd": "EA",
      "qty": 10,
      "itemExprDt": null,
      "prc": 4500,
      "splyAmt": 45000,
      "totDcAmt": 0,
      "taxTyCd": "A",
      "taxblAmt": 38793.10,
      "taxAmt": 6206.90,
      "totAmt": 45000
    }
  ]
}
```

### Stock Adjustment/Receipt Type Codes (sarTyCd)

| Code | Description |
|------|-------------|
| 01 | Stock receipt (purchase) |
| 02 | Stock issue (sale) |
| 03 | Stock adjustment |
| 04 | Stock transfer out |
| 05 | Stock transfer in |
| 06 | Opening stock |
| 07 | Damage/loss |

### Registration Type Codes (regTyCd)

| Code | Description |
|------|-------------|
| M | Manual entry |
| A | Automatic (from sales) |

## Purchase Management

### Fetch Purchases

Get purchases reported by suppliers (for input VAT):

```bash
POST /api/purchase/select
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Confirm Purchase

Accept a purchase transaction from supplier:

```bash
POST /api/purchase/save
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "invcNo": 123,
  "spplrTin": "A000000001R",
  "spplrBhfId": "00",
  "spplrNm": "Supplier Co Ltd",
  "spplrInvcNo": "SUP-001",
  "regTyCd": "M",
  "pchsTyCd": "N",
  "rcptTyCd": "P",
  "pmtTyCd": "01",
  "pchsSttsCd": "02",
  "cfmDt": "20240115123045",
  "pchsDt": "20240115",
  "totItemCnt": 1,
  "totTaxblAmt": 38793.10,
  "totTaxAmt": 6206.90,
  "totAmt": 45000,
  "remark": "Monthly stock purchase",
  "itemList": [
    {
      "itemSeq": 1,
      "itemCd": "KE1NTXU0000001",
      "itemClsCd": "50201502",
      "itemNm": "Samsung Galaxy A54",
      "pkgUnitCd": "EA",
      "pkg": 10,
      "qtyUnitCd": "EA",
      "qty": 10,
      "prc": 4500,
      "splyAmt": 45000,
      "dcRt": 0,
      "dcAmt": 0,
      "taxTyCd": "A",
      "taxblAmt": 38793.10,
      "taxAmt": 6206.90,
      "totAmt": 45000
    }
  ]
}
```

## Node.js Implementation

```typescript
interface Item {
  code: string;
  name: string;
  standardName: string;
  classificationCode: string;
  barcode?: string;
  price: number;
  taxType: 'A' | 'B' | 'C' | 'D' | 'E';
  origin?: string;
  safetyQty?: number;
}

class EtimsStock {
  private client: EtimsClient;
  private itemCounter: number = 0;

  constructor(client: EtimsClient) {
    this.client = client;
  }

  // Generate item code
  generateItemCode(tinLast4: string, branch: string = 'U'): string {
    this.itemCounter++;
    const seq = String(this.itemCounter).padStart(7, '0');
    return `KE${tinLast4}${branch}${seq}`;
  }

  // Register new item
  async registerItem(item: Item) {
    const payload = {
      itemCd: item.code,
      itemClsCd: item.classificationCode,
      itemTyCd: '1', // Finished goods
      itemNm: item.name,
      itemStdNm: item.standardName,
      orgnNatCd: item.origin || 'KE',
      pkgUnitCd: 'EA',
      qtyUnitCd: 'EA',
      taxTyCd: item.taxType,
      bcd: item.barcode || null,
      dftPrc: item.price,
      grpPrcL1: item.price,
      grpPrcL2: item.price,
      grpPrcL3: item.price,
      grpPrcL4: item.price,
      grpPrcL5: item.price,
      sftyQty: item.safetyQty || 0,
      isrcAplcbYn: 'N',
      useYn: 'Y',
      regrId: 'system',
      regrNm: 'System',
    };

    return this.client.request('/api/stock/save-master', payload);
  }

  // Record stock receipt
  async recordStockReceipt(items: Array<{
    itemCd: string;
    itemClsCd: string;
    itemNm: string;
    qty: number;
    unitPrice: number;
    taxType: string;
  }>, remark?: string) {
    const now = new Date();

    const itemList = items.map((item, index) => {
      const totalAmt = item.qty * item.unitPrice;
      const vat = this.calculateVAT(totalAmt, item.taxType);

      return {
        itemSeq: index + 1,
        itemCd: item.itemCd,
        itemClsCd: item.itemClsCd,
        itemNm: item.itemNm,
        pkgUnitCd: 'EA',
        pkg: item.qty,
        qtyUnitCd: 'EA',
        qty: item.qty,
        prc: item.unitPrice,
        splyAmt: totalAmt,
        totDcAmt: 0,
        taxTyCd: item.taxType,
        taxblAmt: vat.taxableAmount,
        taxAmt: vat.taxAmount,
        totAmt: vat.totalAmount,
      };
    });

    const totals = this.calculateTotals(itemList);

    const payload = {
      sarNo: Date.now(), // Unique sequence
      orgSarNo: 0,
      regTyCd: 'M',
      sarTyCd: '01', // Stock receipt
      ocrnDt: this.formatDate(now),
      totItemCnt: itemList.length,
      ...totals,
      remark: remark || 'Stock receipt',
      regrId: 'system',
      regrNm: 'System',
      itemList,
    };

    return this.client.request('/api/stock/io-save', payload);
  }

  // Fetch item classifications
  async getClassifications(lastReqDt?: string) {
    return this.client.request('/api/basic-data/item-cls-list', {
      lastReqDt: lastReqDt || '20240101000000',
    });
  }

  // Search for classification by keyword
  async searchClassification(keyword: string) {
    const result = await this.getClassifications();
    const classifications = result.data?.clsList || [];

    return classifications.filter((cls: any) =>
      cls.itemClsNm.toLowerCase().includes(keyword.toLowerCase())
    );
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

  private calculateTotals(itemList: any[]) {
    let totTaxblAmt = 0;
    let totTaxAmt = 0;
    let totAmt = 0;

    itemList.forEach(item => {
      totTaxblAmt += item.taxblAmt;
      totTaxAmt += item.taxAmt;
      totAmt += item.totAmt;
    });

    return { totTaxblAmt, totTaxAmt, totAmt };
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }
}

// Usage
const stock = new EtimsStock(etimsClient);

// Register a new product
await stock.registerItem({
  code: stock.generateItemCode('1NTX'),
  name: 'Samsung Galaxy A54',
  standardName: 'Smartphone',
  classificationCode: '50201502',
  barcode: '8806094539981',
  price: 45000,
  taxType: 'A',
  origin: 'KR', // South Korea
  safetyQty: 5,
});

// Record stock receipt
await stock.recordStockReceipt([
  {
    itemCd: 'KE1NTXU0000001',
    itemClsCd: '50201502',
    itemNm: 'Samsung Galaxy A54',
    qty: 10,
    unitPrice: 4500,
    taxType: 'A',
  },
], 'Stock from Samsung distributor');

// Search for phone classification
const phoneClasses = await stock.searchClassification('phone');
console.log(phoneClasses);
```

## Import Items

For imported goods, additional tracking is required:

### Fetch Import Items

```bash
POST /api/basic-data/import-item-list
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "lastReqDt": "20240101000000"
}
```

### Update Import Item Status

```bash
POST /api/basic-data/import-item-update
Content-Type: application/json

{
  "tin": "P000000045R",
  "bhfId": "00",
  "taskCd": "1234567890",
  "dclDe": "20240115",
  "itemSeq": 1,
  "hsCd": "8517120000",
  "itemClsCd": "50201502",
  "itemCd": "KE1NTXU0000001",
  "imptItemSttsCd": "2",
  "remark": "Customs cleared"
}
```

## Best Practices

1. **Sync Classifications** - Fetch UNSPSC codes regularly (daily)
2. **Register Before Sale** - Items must exist before invoicing
3. **Track Stock** - Record all movements for audit trail
4. **Use Barcodes** - Makes item lookup faster and accurate
5. **Validate Codes** - Ensure classification matches actual product
