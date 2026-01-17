# SharaLedger - Features Documentation

This document provides a comprehensive overview of all features available in SharaLedger, explaining what each feature is, what it does, and how it benefits users.

---

## Table of Contents

1. [Core Accounting Features](#core-accounting-features)
2. [Transaction Management](#transaction-management)
3. [Financial Reports](#financial-reports)
4. [Point of Sale (POS)](#point-of-sale-pos)
5. [Dashboard & Analytics](#dashboard--analytics)
6. [Inventory Management](#inventory-management)
7. [Indian GST Features](#indian-gst-features)
8. [Import/Export](#importexport)
9. [Multi-Currency Support](#multi-currency-support)
10. [Customization & Settings](#customization--settings)
11. [Platform Features](#platform-features)

---

## Core Accounting Features

### Double-Entry Bookkeeping

**What it is:**
A fundamental accounting system where every transaction affects at least two accounts - ensuring the accounting equation (Assets = Liabilities + Equity) always stays balanced.

**What it does:**

- Automatically creates corresponding debit and credit entries for every transaction
- Maintains mathematical accuracy across all accounts
- Ensures financial integrity and audit trail

**Benefits:**

- Eliminates manual calculation errors
- Provides complete transaction history
- Enables accurate financial reporting
- Complies with accounting standards

**Use cases:**

- Recording sales and purchases
- Tracking payments and receipts
- Managing assets and liabilities
- Maintaining accurate books for tax and audit

---

### Chart of Accounts

**What it is:**
A structured list of all accounts used to categorize and track financial transactions.

**What it does:**

- Organizes accounts into groups:
  - **Assets**: Bank accounts, inventory, equipment, receivables
  - **Liabilities**: Loans, payables, credit cards
  - **Equity**: Capital, retained earnings
  - **Income**: Sales revenue, service income
  - **Expenses**: Rent, salaries, utilities, supplies
- Allows creation of custom accounts
- Supports hierarchical account structure (parent-child relationships)

**Benefits:**

- Organized financial tracking
- Easy categorization of transactions
- Clear financial reporting structure
- Customizable to business needs

**Use cases:**

- Setting up company books
- Creating department-wise expense accounts
- Tracking multiple bank accounts
- Managing different revenue streams

---

### Journal Entries

**What it is:**
Manual accounting entries used to record transactions that don't fit standard categories.

**What it does:**

- Allows direct debit and credit posting to any account
- Supports multi-line entries
- Includes reference numbers and notes
- Records transaction date and description

**Benefits:**

- Flexibility for complex transactions
- Ability to make adjustments and corrections
- Record non-standard transactions
- Period-end adjustments and accruals

**Use cases:**

- Recording depreciation
- Making year-end adjustments
- Correcting errors
- Recording bank charges
- Transferring between accounts

---

## Transaction Management

### Sales Invoices

**What it is:**
Documents issued to customers for goods or services sold.

**What it does:**

- Creates professional invoices with company branding
- Lists items/services with quantities and prices
- Calculates taxes automatically (including GST for India)
- Tracks payment status (paid/unpaid/partially paid)
- Generates unique invoice numbers
- Shows due dates and payment terms

**Benefits:**

- Professional customer communications
- Automated tax calculations
- Payment tracking
- Revenue recognition
- Aging analysis

**Use cases:**

- Billing customers for products sold
- Invoicing for services rendered
- Creating recurring invoices
- Export invoices as PDF
- Email invoices to customers

---

### Purchase Invoices

**What it is:**
Records of purchases made from suppliers.

**What it does:**

- Records supplier bills
- Tracks items purchased with quantities and costs
- Calculates input taxes (GST for India)
- Monitors payment obligations
- Links to payment entries

**Benefits:**

- Expense tracking
- Tax credit management (ITC)
- Vendor management
- Cash flow planning
- Purchase analysis

**Use cases:**

- Recording supplier bills
- Tracking inventory purchases
- Managing service expenses
- Claiming tax credits
- Monitoring payables

---

### Payment Entries

**What it is:**
Records of money received from customers or paid to suppliers.

**What it does:**

- Records incoming and outgoing payments
- Links payments to specific invoices
- Supports multiple payment methods (cash, bank, card, UPI)
- Handles partial payments
- Tracks bank/cash accounts
- Calculates outstanding amounts

**Benefits:**

- Clear payment tracking
- Reduced outstanding receivables
- Accurate cash flow records
- Payment history

**Use cases:**

- Recording customer payments
- Making supplier payments
- Handling advance payments
- Processing refunds

---

### Credit Notes

**What it is:**
Documents issued to reduce the amount owed by a customer.

**What it does:**

- Creates credit against sales invoices
- Adjusts revenue and tax liability
- Links to original invoice
- Supports full or partial credits

**Benefits:**

- Proper handling of returns
- Accurate revenue reporting
- Customer satisfaction
- Tax compliance

**Use cases:**

- Processing product returns
- Correcting billing errors
- Applying post-invoice discounts
- Handling damaged goods

---

### Debit Notes

**What it is:**
Documents issued to increase the amount owed to a supplier.

**What it does:**

- Adjusts purchase invoices
- Increases expense and tax credit
- Links to original purchase

**Benefits:**

- Accurate expense tracking
- Proper tax credit adjustment
- Supplier communication

**Use cases:**

- Recording additional charges
- Correcting undercharged amounts
- Handling return-to-supplier scenarios

---

## Financial Reports

### General Ledger

**What it is:**
A comprehensive record of all financial transactions organized by account.

**What it does:**

- Lists every transaction affecting each account
- Shows date, reference, party, debit, credit, and balance
- Filters by date range and account
- Displays running balance
- Supports export to Excel/CSV

**Benefits:**

- Complete audit trail
- Transaction verification
- Account reconciliation
- Historical analysis

**Use cases:**

- Reviewing all transactions for an account
- Auditing financial records
- Investigating discrepancies
- Year-end reviews

---

### Profit and Loss Statement (P&L)

**What it is:**
A financial statement showing profitability over a period.

**What it does:**

- Summarizes all income (revenue)
- Summarizes all expenses
- Calculates net profit or loss
- Shows period comparisons
- Displays hierarchical account structure
- Supports custom date ranges

**Benefits:**

- Business performance measurement
- Identifies profit drivers
- Expense analysis
- Decision-making insights
- Tax preparation

**Use cases:**

- Monthly/quarterly/yearly profit analysis
- Comparing performance across periods
- Tax return preparation
- Business valuation
- Investor reporting

---

### Balance Sheet

**What it is:**
A snapshot of the company's financial position at a specific date.

**What it does:**

- Lists all assets (what you own)
- Lists all liabilities (what you owe)
- Shows owner's equity (net worth)
- Verifies accounting equation: Assets = Liabilities + Equity
- Supports as-of-date reporting

**Benefits:**

- Financial health assessment
- Net worth calculation
- Solvency analysis
- Lending/investment decisions
- Compliance reporting

**Use cases:**

- Year-end financial statements
- Loan applications
- Business valuation
- Investor presentations
- Tax filings

---

### Trial Balance

**What it is:**
A report listing all accounts with their debit or credit balances.

**What it does:**

- Shows balance for every account
- Verifies debits equal credits
- Identifies posting errors
- Serves as basis for financial statements

**Benefits:**

- Error detection
- Mathematical verification
- Pre-closing checks
- Audit preparation

**Use cases:**

- Month-end/year-end closing
- Verifying books are balanced
- Preparing for financial statements
- Auditor requests

---

### Receivables Ageing

**What it is:**
A report showing outstanding customer invoices by age.

**What it does:**

- Lists unpaid customer invoices
- Groups by age: 0-30 days, 31-60 days, 61-90 days, 90+ days
- Shows customer-wise outstanding
- Includes GSTIN (for India)
- Highlights overdue amounts

**Benefits:**

- Collections management
- Credit risk assessment
- Cash flow forecasting
- Customer relationship management

**Use cases:**

- Identifying overdue payments
- Prioritizing collection efforts
- Reviewing credit policies
- Customer follow-ups

---

### Payables Ageing

**What it is:**
A report showing outstanding supplier bills by age.

**What it does:**

- Lists unpaid supplier invoices
- Groups by age buckets
- Shows supplier-wise payables
- Includes GSTIN (for India)
- Highlights due/overdue amounts

**Benefits:**

- Payment planning
- Cash flow management
- Supplier relationship management
- Avoid late payment penalties

**Use cases:**

- Planning payment schedules
- Negotiating payment terms
- Managing working capital
- Avoiding supply disruptions

---

## Point of Sale (POS)

### POS Interface

**What it is:**
A simplified, touch-friendly interface for quick retail transactions.

**What it does:**

- Displays product catalog with images
- Enables fast item selection (click or scan)
- Shows real-time cart with quantities and totals
- Calculates taxes automatically
- Processes multiple payment methods
- Prints receipts instantly
- Updates inventory in real-time

**Benefits:**

- Faster checkout process
- Reduced billing errors
- Better customer experience
- Real-time inventory tracking
- End-of-day reconciliation

**Use cases:**

- Retail store billing
- Restaurant order processing
- Quick service counters
- Walk-in customer sales
- Cash-and-carry operations

---

### POS Features

**Item Search:**

- Quick search by name or barcode
- Category filtering
- Favorite items

**Cart Management:**

- Add/remove items
- Adjust quantities
- Apply discounts
- View item details

**Payment Processing:**

- Cash payments
- Card payments
- UPI/Digital wallets
- Split payments (multiple methods)
- Calculate change

**Receipt Printing:**

- Thermal printer support
- A4 printer support
- Email receipts
- SMS receipts (if configured)

**Session Management:**

- Open/close POS sessions
- Track cash drawer
- End-of-day reports
- Cashier tracking

---

## Dashboard & Analytics

### Financial Dashboard

**What it is:**
A visual overview of key business metrics and financial health.

**What it does:**

- **Cash Flow Chart**: Visualizes cash inflow and outflow trends over time
- **Key Metrics Cards**:
  - Total inflow (sales revenue)
  - Total outflow (purchases and expenses)
  - Net cash flow
  - Profit/Loss summary
- **Outstanding Amounts**:
  - Unpaid customer invoices (receivables)
  - Unpaid supplier bills (payables)
- **Quick Actions**: Fast access to common tasks
- **Recent Transactions**: Latest activities

**Benefits:**

- At-a-glance business health
- Trend identification
- Early warning of cash problems
- Data-driven decisions
- Progress tracking

**Design Features:**

- Card-based modern layout
- Color-coded metrics (violet for positive, teal for negative)
- Interactive charts with tooltips
- Gradient backgrounds
- Dark mode support
- Responsive design

**Use cases:**

- Daily business reviews
- Week/month-end analysis
- Presentations to stakeholders
- Performance monitoring
- Quick status checks

---

## Inventory Management

### Item Master

**What it is:**
Central database of all products and services offered.

**What it does:**

- Stores item details (name, description, code)
- Manages pricing (purchase and selling prices)
- Tracks units of measure
- Maintains HSN/SAC codes
- Stores item images
- Defines tax rates per item
- Supports batch/serial number tracking

**Benefits:**

- Consistent product information
- Quick item selection in transactions
- Accurate pricing
- Tax compliance
- Product catalog management

**Use cases:**

- Setting up product catalog
- Managing service offerings
- Updating prices
- Adding new products
- Maintaining product database

---

### Stock Tracking

**What it is:**
Real-time monitoring of inventory levels.

**What it does:**

- Tracks quantity on hand
- Records stock movements (in/out)
- Links to purchase and sales transactions
- Supports multiple warehouses
- Generates stock reports
- Alerts on low stock

**Benefits:**

- Prevent stockouts
- Avoid overstocking
- Accurate COGS calculation
- Inventory valuation
- Purchase planning

**Use cases:**

- Monitoring inventory levels
- Valuing inventory for financial statements
- Identifying slow-moving items
- Reorder point management
- Stock audits

---

### Stock Reports

**Stock Ledger:**

- Transaction-wise stock movements
- Shows receipts, issues, and balance
- Filterable by item and date

**Stock Balance:**

- Current quantity of all items
- Value of inventory
- Warehouse-wise breakup

---

## Indian GST Features

### GST Configuration

**What it is:**
Pre-configured tax system for Indian GST compliance.

**What it does:**

- **Tax Templates**: Pre-created for standard GST rates
  - 5%, 12%, 18%, 28% GST (splits into CGST+SGST)
  - 5%, 12%, 18%, 28% IGST
  - Exempt-GST (0%)
- **Auto-split Logic**: GST automatically splits into CGST (rate/2) + SGST (rate/2) for intra-state
- **IGST for Inter-state**: Automatic selection based on place of supply

**Benefits:**

- No manual tax setup needed
- Compliance with GST laws
- Accurate tax calculations
- Proper tax reporting

---

### GSTIN Management

**What it is:**
System for recording and validating GST Identification Numbers.

**What it does:**

- Stores company GSTIN (in Accounting Settings)
- Stores customer/supplier GSTIN (in Party master)
- Validates GSTIN format
- Extracts state code from GSTIN
- Determines place of supply
- Displays on invoices and reports

**Benefits:**

- GST compliance
- Proper tax calculation
- Invoice authenticity
- Input tax credit eligibility
- Report accuracy

---

### HSN/SAC Codes

**What it is:**
Classification codes for goods (HSN) and services (SAC) as per GST.

**What it does:**

- Dropdown with pre-filled common codes:
  - **HSN**: 2106 (Food), 8471 (Computers), 6109 (Garments)
  - **SAC**: 9963 (Hospitality), 9983 (IT Services), 9987 (Maintenance)
- Allows custom code entry
- Auto-shows HSN for products, SAC for services
- Displays on invoices

**Benefits:**

- GST compliance
- Correct tax rate application
- Statutory reporting
- Professional invoices

**Use cases:**

- Item master setup
- Invoice generation
- GST return filing
- E-way bill generation

---

### Place of Supply

**What it is:**
The state where goods/services are considered consumed, determining tax type.

**What it does:**

- Auto-detects from customer GSTIN (first 2 digits = state code)
- Falls back to shipping address if no GSTIN
- Compares with supplier state
- Determines intra-state vs inter-state

**Result:**

- **Same state**: Apply CGST + SGST
- **Different state**: Apply IGST

**Benefits:**

- Automatic tax selection
- Compliance with GST place of supply rules
- No manual intervention needed

---

### GST Invoice Templates

**What it is:**
Professionally designed invoice templates compliant with GST requirements.

**What it does:**

- Displays supplier GSTIN prominently
- Shows customer GSTIN and registration status
- Lists HSN/SAC codes in item table
- Shows place of supply
- Breaks down tax:
  - Separate columns/rows for CGST, SGST, IGST
- Displays amount in words (Lakh/Crore format)
- Invoice numbering as per standards

**Available Templates:**

- Basic Template
- Business Template
- Business POS Template
- Minimal Template

**Benefits:**

- Legal compliance
- Professional appearance
- Clear tax breakup
- Audit-ready documentation

---

### GST Reports

#### GSTR-1 (Sales Return)

**What it is:**
Report of outward supplies (sales) for GST filing.

**What it does:**

- Lists all sales invoices for the period
- Groups by:
  - B2B (Business to Business)
  - B2CL (Large consumers)
  - B2CS (Small consumers)
  - Exports/Nil rated
- Shows taxable value and tax breakup (CGST/SGST/IGST)
- Includes customer GSTIN
- Exports to CSV for GST portal upload

**Use cases:**

- Monthly/quarterly GST return filing
- Sales tax reporting
- Revenue audits

---

#### GSTR-2 (Purchase Return)

**What it is:**
Report of inward supplies (purchases) for claiming Input Tax Credit.

**What it does:**

- Lists all purchase invoices for the period
- Shows supplier GSTIN
- Displays taxable value and tax components
- Tracks reverse charge transactions
- Exports to CSV

**Use cases:**

- Claiming input tax credit
- Purchase tax reporting
- Reconciling with supplier GSTR-1

---

#### GSTR-3B (Monthly Summary)

**What it is:**
Simplified summary GST return showing tax liability.

**What it does:**

- Summarizes outward supplies (sales):
  - Total taxable value
  - Total CGST collected
  - Total SGST collected
  - Total IGST collected
- Summarizes inward supplies (purchases):
  - Total taxable value
  - Total CGST paid (ITC)
  - Total SGST paid (ITC)
  - Total IGST paid (ITC)
- Calculates net GST payable:
  - Net CGST = Sales CGST - Purchase CGST
  - Net SGST = Sales SGST - Purchase SGST
  - Net IGST = Sales IGST - Purchase IGST
- Shows total tax liability for the month

**Benefits:**

- Easy GST payment calculation
- Compliance with monthly filing requirement
- Quick tax liability overview

**Use cases:**

- Monthly GST return filing
- Tax payment planning
- Cash flow management

---

### Indian Localization

**Date Format:**

- Default: DD/MM/YYYY (Indian standard)
- Applied across all invoices, reports, and UI

**Currency:**

- Default: INR (₹)
- Indian Rupee symbol

**Number Formatting:**

- Indian numbering system (Lakh, Crore)
- Examples:
  - 1,00,000 (One Lakh)
  - 10,00,000 (Ten Lakh)
  - 1,00,00,000 (One Crore)

**Amount in Words:**

- Converts numbers to Indian English
- "One Lakh Twenty-Three Thousand Rupees only"
- Displays on invoices

---

## Import/Export

### Data Import

**What it is:**
Bulk upload feature for migrating data from other systems.

**What it does:**

- Imports from CSV/Excel files
- Supports multiple entity types:
  - Chart of Accounts
  - Parties (Customers/Suppliers)
  - Items
  - Opening balances
- Maps columns to fields
- Validates data before import
- Shows import progress and errors

**Benefits:**

- Quick setup for existing businesses
- Migration from other software
- Bulk data updates
- Time saving

**Use cases:**

- Initial setup with existing data
- Migrating from Excel or other accounting software
- Bulk adding items or customers
- Updating prices in bulk

---

### Data Export

**What it is:**
Feature to export data and reports to external formats.

**What it does:**

- **CSV Export**: Plain text format for spreadsheets
- **Excel Export**: Formatted XLSX with styling
- **PDF Export**: For invoices and reports
- Exports reports with formatting
- Maintains Indian number and date formats

**Benefits:**

- Data portability
- Integration with other tools
- Archiving and backup
- Sharing with stakeholders
- Further analysis in Excel

**Use cases:**

- Exporting GST reports for portal upload
- Sending reports to accountants
- Creating backups
- Analyzing in Excel
- Sharing with auditors

---

## Multi-Currency Support

**What it is:**
Ability to handle transactions in multiple currencies.

**What it does:**

- Supports any currency (USD, EUR, GBP, etc.)
- Records exchange rates
- Converts to base currency (INR)
- Shows both foreign and base currency amounts
- Handles forex gains/losses

**Benefits:**

- International business support
- Accurate multi-currency accounting
- Forex management

**Use cases:**

- Export businesses
- Import transactions
- Foreign suppliers/customers
- Multi-national operations

---

## Customization & Settings

### Company Settings

**What it is:**
Configuration of company information and branding.

**What it does:**

- Company name and address
- Logo upload
- GSTIN and tax details
- Bank account details
- Email and phone
- Financial year settings

**Benefits:**

- Personalized invoices
- Professional branding
- Compliance information
- Communication details

---

### Print Settings

**What it is:**
Customization of how documents are printed.

**What it does:**

- Select invoice template (Basic, Business, Minimal)
- Toggle amount in words
- Show/hide logo
- Page size selection
- Header/footer text
- Font and color preferences

**Benefits:**

- Branded documents
- Professional appearance
- Template flexibility

---

### User Preferences

**What it is:**
Personal settings for each user.

**What it does:**

- Theme selection (Light/Dark mode)
- Language preference
- Date format preference
- Number format preference
- Default views

**Benefits:**

- Personalized experience
- Accessibility
- Comfort and productivity

---

## Platform Features

### Offline Functionality

**What it is:**
Ability to use SharaLedger without internet connection.

**What it does:**

- All data stored locally in SQLite
- No cloud dependency
- Full functionality offline
- Works anywhere, anytime

**Benefits:**

- Reliability
- Privacy and data security
- Works in areas with poor connectivity
- No subscription or internet costs
- Fast performance

**Use cases:**

- Remote locations
- Travel
- Internet outages
- Data privacy concerns
- Cost savings

---

### Cross-Platform Desktop App

**What it is:**
Native desktop application for Windows, macOS, and Linux.

**What it does:**

- Runs as installed desktop software
- Native OS integration
- File system access
- Printer integration
- System notifications

**Benefits:**

- Familiar desktop experience
- Better performance than web apps
- Works offline
- Local data storage
- OS-level features

**Platforms:**

- Windows (7, 8, 10, 11)
- macOS (10.14+)
- Linux (Ubuntu, Debian, Fedora, etc.)

---

### Auto-Update

**What it is:**
Automatic updating system for keeping the app current.

**What it does:**

- Checks for updates automatically
- Downloads updates in background
- Notifies user when ready
- Installs on restart
- Ensures latest features and security

**Benefits:**

- Always up-to-date
- Security patches
- New features automatically
- No manual downloads
- Seamless updates

---

### Data Backup

**What it is:**
Built-in backup system for data protection.

**What it does:**

- Creates database backups
- Saves to user-selected location
- Scheduled automatic backups
- Manual backup option
- Restore from backup

**Benefits:**

- Data protection
- Disaster recovery
- Peace of mind
- Easy restoration
- Version history

---

### Data Security

**What it is:**
Features ensuring data protection and privacy.

**What it does:**

- Local data storage (no cloud uploads)
- File-based database
- OS-level file permissions
- Optional database encryption
- User access control

**Benefits:**

- Complete data privacy
- No third-party access
- Secure storage
- Compliance with data protection laws
- Business confidentiality

---

### Search Functionality

**What it is:**
Powerful search across all documents and transactions.

**What it does:**

- Global search bar
- Search by document number, party name, amount
- Filter by document type and date
- Quick navigation to documents
- Recent documents list

**Benefits:**

- Quick information retrieval
- Time saving
- Better productivity
- Easy navigation

---

### Keyboard Shortcuts

**What it is:**
Keyboard commands for faster navigation and actions.

**What it does:**

- Quick access to common actions
- Navigation shortcuts
- Document creation shortcuts
- Search activation

**Benefits:**

- Faster workflow
- Reduced mouse usage
- Power user features
- Efficiency

**Examples:**

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New document
- `Ctrl/Cmd + S`: Save
- `Ctrl/Cmd + P`: Print

---

## Summary

SharaLedger provides a comprehensive set of features covering:

1. **Complete Accounting**: Double-entry bookkeeping, chart of accounts, journals
2. **Transaction Management**: Invoices, payments, credit/debit notes
3. **Financial Reports**: P&L, Balance Sheet, Trial Balance, General Ledger, Ageing reports
4. **POS**: Fast retail billing with touch-friendly interface
5. **Dashboard**: Visual analytics and business metrics
6. **Inventory**: Item master, stock tracking, stock reports
7. **Indian GST**: Complete compliance with GSTIN, HSN/SAC, GST reports (GSTR-1/2/3B)
8. **Import/Export**: Data migration and export in multiple formats
9. **Multi-Currency**: International transaction support
10. **Platform**: Offline, cross-platform, auto-update, data security

Each feature is designed to simplify accounting for small and medium businesses while maintaining compliance and providing professional-grade functionality.

For more information:

- [Terminology Guide](TERMINOLOGY.md)
- [Process Documentation](PROCESS.md)
- [Indian GST Status](INDIAN_LOCALIZATION_STATUS.md)
