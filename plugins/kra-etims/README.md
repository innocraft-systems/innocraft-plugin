# KRA eTIMS Plugin

KRA Electronic Tax Invoice Management System (eTIMS) integration for Kenya tax compliance. Covers OSCU/VSCU integration, invoice submission, stock management, and item classification.

## Features

- **3 Skills**: Auto-triggering knowledge for eTIMS integration
- **Complete API Documentation**: Authentication, endpoints, tax codes
- **Code Examples**: Node.js implementation examples

## Installation

```bash
# Add the marketplace
claude plugin marketplace add innocraft-systems/innocraft-plugin

# Install the plugin
claude plugin install kra-etims
```

## Skills

| Skill | Triggers On |
|-------|-------------|
| `etims-integration` | "eTIMS", "KRA API", "OSCU", "VSCU", "tax compliance Kenya" |
| `etims-invoicing` | "tax invoice", "eTIMS invoice", "VAT invoice", "credit note" |
| `etims-stock` | "eTIMS stock", "item classification", "UNSPSC", "inventory KRA" |

## What is eTIMS?

eTIMS is Kenya Revenue Authority's (KRA) electronic tax invoice management system. **All Kenyan businesses** are required to:

1. Register on eTIMS portal
2. Submit invoices electronically to KRA
3. Receive a unique invoice number (CU Invoice Number) for each transaction
4. Report stock movements and purchases

## Integration Types

| Type | Best For | Connection |
|------|----------|------------|
| **OSCU** (Online Sales Control Unit) | Always-online systems | Real-time API |
| **VSCU** (Virtual Sales Control Unit) | Bulk/offline invoicing | Batch sync |

## Base URLs

| Environment | URL |
|-------------|-----|
| Sandbox | `https://etims-api-sbx.kra.go.ke` |
| Production | `https://etims-api.kra.go.ke/etims-api` |

## Registration Requirements

Before integrating, you need:

1. **KRA PIN** - Your tax identification number
2. **Branch ID** - `00` for main branch, KRA-assigned for others
3. **Device Serial Number** - Your OSCU/VSCU identifier
4. **Communication Key** - Issued by KRA (one-time, keep secure!)

### For Third-Party Integrators

If building for multiple clients (like your multi-tenant SaaS):

1. Apply for **Integrator Certification** at KRA
2. Submit eTIMS Bio Data Form
3. Provide business registration docs
4. Show proof of 3+ qualified technical staff
5. Pass KRA vetting process

## Environment Variables

```env
# KRA eTIMS Configuration
ETIMS_BASE_URL=https://etims-api-sbx.kra.go.ke
ETIMS_TIN=P000000045R
ETIMS_BRANCH_ID=00
ETIMS_DEVICE_SERIAL=YOUR_DEVICE_SERIAL
ETIMS_COMM_KEY=your_communication_key

# For production
# ETIMS_BASE_URL=https://etims-api.kra.go.ke/etims-api
```

## Key Concepts

### Tax Types (taxTyCd)

| Code | Description | Rate |
|------|-------------|------|
| A | Standard VAT | 16% |
| B | Zero-rated | 0% |
| C | Exempt | 0% |
| D | Excise duty | Varies |
| E | Other levies | Varies |

### Transaction Types

| Code | Description |
|------|-------------|
| S | Sale |
| R | Refund/Return |
| C | Credit Note |
| D | Debit Note |

### Item Classification

Items must be classified using **UNSPSC codes** (United Nations Standard Products and Services Code). These are fetched from KRA's API.

## Compliance Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    eTIMS Compliance Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Initialize Device                                        │
│     POST /api/initialization/osdc-info                       │
│                    │                                         │
│                    ▼                                         │
│  2. Fetch Reference Data                                     │
│     - Item classifications                                   │
│     - Tax codes                                              │
│     - Customer list                                          │
│                    │                                         │
│                    ▼                                         │
│  3. Register Items/Products                                  │
│     POST /api/stock/save-master                              │
│                    │                                         │
│                    ▼                                         │
│  4. Submit Sales Invoice                                     │
│     POST /api/sales/send                                     │
│                    │                                         │
│                    ▼                                         │
│  5. Receive CU Invoice Number                                │
│     (KRA-validated invoice reference)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Resources

- **eTIMS Portal**: https://etims.kra.go.ke
- **Sandbox Portal**: https://etims-sbx.kra.go.ke
- **KRA Integration Info**: https://www.kra.go.ke/business/etims-electronic-tax-invoice-management-system/learn-about-etims/etims-system-to-system-integration

## License

MIT
