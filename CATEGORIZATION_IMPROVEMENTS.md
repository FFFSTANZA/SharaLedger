# Transaction Categorization Improvements for SME Business

## Overview
Revised categorization rules from personal/mixed-use to **purely business-focused** patterns suitable for SME accounting software.

## Changes Summary
- **Previous**: 100+ rules including personal expenses (food delivery, entertainment, gym, personal shopping)
- **Current**: ~80 business-focused rules aligned with SME Chart of Accounts
- **Reduction**: Removed 40+ personal/irrelevant patterns

## Business-Focused Categories

### Income Categories
✅ **Sales Revenue** - Customer payments, invoice payments
✅ **Service Income** - Professional fees, consulting fees, service charges
✅ **Rental Income** - Property lease, rent received
✅ **Interest Income** - Bank interest received
✅ **Dividend Income** - Investment dividends
✅ **Commission Income** - Agent commission, sales commission
✅ **Other Income** - Grants, subsidies, government grants
✅ **Payment Methods** - UPI, NEFT, IMPS, RTGS, Cash, Cheque deposits

### Expense Categories

#### Bank & Financial
- ATM withdrawals, cash withdrawals
- Bank charges (service, maintenance, SMS, minimum balance)
- Cheque bounce charges
- Card fees (debit/credit card annual fees)

#### Vendor & Suppliers
- Vendor payments, supplier payments
- Purchase, procurement
- Payment methods: UPI, NEFT, IMPS, RTGS, Card

#### Loans & Finance
- Business loans, term loans, working capital loans
- EMI payments, installments
- Interest expenses, loan interest
- Credit card bill payments

#### Salaries & Employee Benefits
- Salaries, wages, payroll
- Provident Fund (PF), EPF, ESIC
- Bonus, incentives, allowances
- Employee insurance (group insurance)

#### Office & Operations
- Office rent, lease payments
- Electricity bills, power bills
- Water bills, sewerage charges
- Internet, broadband, WiFi, ISP, leased line
- Telephone, mobile, landline charges
- Office supplies, stationery, printing
- Maintenance, repairs, AMC
- Cleaning, housekeeping, security services

#### Insurance (Business)
- Property insurance, fire insurance
- Business liability insurance
- Vehicle insurance, fleet insurance
- Employee group insurance, staff insurance

#### Business Travel & Transport
- Fuel (petrol, diesel, CNG)
- Business travel expenses
- Flights, trains, buses
- Taxis, cabs (Uber, Ola)
- Hotels, accommodation
- Parking, toll charges, FASTag

#### Professional Services
- Legal fees, lawyer fees, court fees
- Audit fees, CA fees, chartered accountant
- Consulting fees, advisory services
- Registration fees, licenses, permits, compliance

#### Marketing & Advertising
- Advertisement, marketing campaigns, promotions
- Digital marketing (Google Ads, Facebook Ads, social media)
- Website expenses, domain, hosting

#### Software & Technology
- SaaS subscriptions, cloud services
- Software licenses (Microsoft, Office 365, Google Workspace)
- Cloud infrastructure (AWS, Azure)
- Servers, hosting

#### Training & Development
- Employee training, workshops, seminars, conferences
- Professional certifications, memberships

#### Taxes & Compliance
- Income tax, advance tax, corporate tax
- TDS (Tax Deducted at Source)
- GST (IGST, CGST, SGST)
- Property tax, municipal tax, local taxes

## Removed Personal Categories ❌

The following personal/consumer categories have been REMOVED as they're not relevant for SME business accounting:

### Personal Shopping
- ❌ Fashion shopping (Myntra, Ajio, Meesho)
- ❌ Grocery shopping (DMart, reliance)
- ❌ Amazon/Flipkart personal purchases

### Personal Entertainment
- ❌ Streaming services (Netflix, Amazon Prime, Hotstar, Disney+, Zee5)
- ❌ Music subscriptions (Spotify, Apple Music, YouTube Music)
- ❌ Movie tickets (BookMyShow, PVR, Inox)
- ❌ DTH/Cable TV subscriptions

### Personal Services
- ❌ Food delivery (Zomato, Swiggy, Uber Eats, Dunzo)
- ❌ Restaurants and dining (personal meals)
- ❌ Gym and fitness memberships
- ❌ Personal healthcare (pharmacy, lab tests)
- ❌ Personal education (school fees, tuition)
- ❌ Personal loans (home loan, car loan as personal expense)
- ❌ Personal insurance (life, health, medical)

## Business Context
These categories are now aligned with:
- Typical SME Chart of Accounts
- Business expense classifications
- GST categories for business transactions
- Professional accounting standards
- Business tax reporting requirements

## Technical Details
- File: `src/banking/autoCategorize.ts`
- Pattern matching uses regex with word boundaries for accuracy
- Priority-based scoring (1-10 scale) ensures most specific patterns match first
- Confidence scoring based on pattern priority
- Supports Indian business terminology and payment methods
