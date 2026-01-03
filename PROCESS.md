# SharaLedger - High-Level Process Documentation

This document explains the high-level architecture and workflows of SharaLedger, providing insight into how different components work together to deliver a complete accounting solution.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Startup Process](#application-startup-process)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Core Business Processes](#core-business-processes)
5. [Technical Workflows](#technical-workflows)
6. [Regional Processing](#regional-processing)
7. [Report Generation Process](#report-generation-process)
8. [Build and Deployment Process](#build-and-deployment-process)

---

## Architecture Overview

### High-Level Architecture

SharaLedger follows a **client-server architecture** within an Electron desktop application:

```
┌─────────────────────────────────────────────────────────┐
│                    SharaLedger App                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────┐      ┌────────────────────┐    │
│  │  Main Process      │◄────►│  Renderer Process  │    │
│  │  (Server Side)     │ IPC  │  (Client Side)     │    │
│  └────────────────────┘      └────────────────────┘    │
│           │                           │                  │
│           │                           │                  │
│  ┌────────▼────────┐         ┌───────▼──────┐          │
│  │   Backend       │         │   Fyo Core    │          │
│  │   - Database    │         │   - Models    │          │
│  │   - File System │         │   - Schemas   │          │
│  │   - Patches     │         │   - Docs      │          │
│  └────────┬────────┘         └───────┬──────┘          │
│           │                           │                  │
│           │        ┌──────────────────▼──────┐          │
│           └───────►│   SQLite Database       │          │
│                    │   (Local File Storage)  │          │
│                    └─────────────────────────┘          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Component Layers

1. **Presentation Layer** (`src/`)

   - Vue 3 components and pages
   - User interface and interactions
   - Routing and navigation

2. **Business Logic Layer** (`fyo/`, `models/`)

   - Document models and controllers
   - Validation and computation
   - Business rules

3. **Data Access Layer** (`backend/database/`)

   - Database operations (CRUD)
   - Query building with Knex
   - Transaction management

4. **Storage Layer** (SQLite)
   - Local file-based database
   - ACID-compliant persistence
   - Schema and indexes

---

## Application Startup Process

### 1. Main Process Initialization

When SharaLedger starts:

```
1. Electron Main Process Starts
   └─> main.ts executed
       │
       ├─> Create application window
       ├─> Set up IPC handlers
       ├─> Initialize auto-updater
       ├─> Register protocol handlers
       └─> Load renderer process
```

**Key Operations:**

- Create browser window with security settings
- Register IPC listeners for database operations
- Set up menu and keyboard shortcuts
- Initialize telemetry (if enabled)
- Check for updates

### 2. Renderer Process Initialization

```
1. Renderer Starts
   └─> src/main.js executed
       │
       ├─> Initialize Vue application
       ├─> Set up router
       ├─> Initialize Fyo instance
       │   │
       │   ├─> Connect to database via IPC
       │   ├─> Load schemas
       │   ├─> Initialize models
       │   └─> Load system settings
       │
       ├─> Mount Vue app
       └─> Navigate to appropriate page
           │
           ├─> If no database: Setup wizard
           ├─> If database exists: Dashboard
           └─> If locked: Login screen
```

### 3. Database Connection

```
1. Database Connection Request
   │
   ├─> Renderer calls fyo.db.connect()
   │
   ├─> Fyo Demux routes to appropriate handler
   │   │
   │   └─> Electron: IPC call to Main Process
   │       └─> Browser: IndexedDB connection
   │
   ├─> Main Process DatabaseHandler
   │   │
   │   ├─> Open SQLite file
   │   ├─> Run migrations if needed
   │   ├─> Execute pending patches
   │   └─> Verify database integrity
   │
   └─> Return database handle to Renderer
```

---

## Data Flow Architecture

### Document Lifecycle

Every business document (Invoice, Payment, etc.) follows this lifecycle:

```
1. CREATE
   │
   ├─> User initiates new document
   ├─> Schema loaded from schemas/
   ├─> Model instantiated from models/
   ├─> Default values applied
   └─> Form rendered in UI
       │
2. EDIT
   │
   ├─> User enters/modifies data
   ├─> Real-time validation
   ├─> Computed fields updated
   └─> UI reflects changes
       │
3. VALIDATE
   │
   ├─> Required field checks
   ├─> Data type validation
   ├─> Business rule validation
   ├─> Cross-field validation
   └─> Custom model validations
       │
4. SAVE
   │
   ├─> beforeSave hooks executed
   ├─> Data serialized
   ├─> IPC call to Main Process
   ├─> Database transaction begins
   │   │
   │   ├─> INSERT/UPDATE SQL
   │   ├─> Update child tables
   │   ├─> Create ledger entries (if accounting doc)
   │   └─> Commit transaction
   │
   ├─> afterSave hooks executed
   └─> UI updated with saved data
       │
5. SUBMIT (for transactional docs)
   │
   ├─> beforeSubmit hooks
   ├─> Document marked as submitted
   ├─> Accounting entries posted
   ├─> Stock entries updated (if inventory)
   ├─> Document becomes non-editable
   └─> afterSubmit hooks
       │
6. CANCEL (optional)
   │
   ├─> beforeCancel hooks
   ├─> Reverse accounting entries
   ├─> Reverse stock movements
   ├─> Mark document as cancelled
   └─> afterCancel hooks
```

---

## Core Business Processes

### 1. Sales Invoice Creation Process

```
┌─────────────────────────────────────────────────┐
│              Sales Invoice Flow                  │
└─────────────────────────────────────────────────┘

1. User navigates to Sales Invoice
   │
2. New Sales Invoice form opens
   │
   ├─> Select Customer (Party)
   │   └─> Loads customer details, GSTIN, address
   │
   ├─> Add Items
   │   │
   │   ├─> Search and select items
   │   ├─> Enter quantity
   │   ├─> Price auto-filled from item master
   │   ├─> HSN/SAC code loaded
   │   └─> Line total calculated
   │
   ├─> Apply Taxes
   │   │
   │   ├─> Determine Place of Supply
   │   │   └─> From customer GSTIN or address
   │   │
   │   ├─> Check if Intra-state or Inter-state
   │   │
   │   ├─> Apply appropriate tax
   │   │   ├─> Intra-state: CGST + SGST
   │   │   └─> Inter-state: IGST
   │   │
   │   └─> Calculate tax amounts
   │
   ├─> Calculate Totals
   │   │
   │   ├─> Net Total (sum of line totals)
   │   ├─> Total Tax
   │   └─> Grand Total
   │
3. Save (Draft)
   │
   └─> Invoice saved but not posted to ledger
       │
4. Submit
   │
   ├─> Post accounting entries:
   │   │
   │   ├─> Debit: Accounts Receivable
   │   ├─> Credit: Sales Account
   │   ├─> Credit: Tax Liability Accounts (CGST/SGST/IGST)
   │   └─> Update stock (if inventory enabled)
   │
   └─> Invoice finalized and locked
```

### 2. Payment Recording Process

```
┌─────────────────────────────────────────────────┐
│              Payment Entry Flow                  │
└─────────────────────────────────────────────────┘

1. User creates Payment Entry
   │
2. Select Payment Type
   │
   ├─> Receive (Customer payment)
   └─> Pay (Supplier payment)
       │
3. Select Party
   │
   └─> Load outstanding invoices
       │
4. Enter Payment Details
   │
   ├─> Amount
   ├─> Payment method (Cash, Bank Transfer, etc.)
   ├─> Bank account (if applicable)
   └─> Payment date
       │
5. Allocate to Invoices
   │
   ├─> Select outstanding invoices
   ├─> Allocate amount to each invoice
   └─> Calculate outstanding after payment
       │
6. Submit Payment
   │
   ├─> Post accounting entries:
   │   │
   │   For RECEIVE:
   │   ├─> Debit: Bank/Cash Account
   │   └─> Credit: Accounts Receivable
   │
   │   For PAY:
   │   ├─> Debit: Accounts Payable
   │   └─> Credit: Bank/Cash Account
   │
   ├─> Update invoice outstanding amounts
   └─> Update party balance
```

### 3. Point of Sale (POS) Process

```
┌─────────────────────────────────────────────────┐
│              POS Transaction Flow                │
└─────────────────────────────────────────────────┘

1. Open POS Interface
   │
   ├─> Load item catalog with images
   └─> Initialize cart
       │
2. Add Items to Cart
   │
   ├─> Click item or scan barcode
   ├─> Enter quantity
   ├─> Modify price (if allowed)
   └─> Apply discounts
       │
3. Calculate Bill
   │
   ├─> Sum item totals
   ├─> Add applicable taxes
   ├─> Calculate grand total
   └─> Display amount due
       │
4. Collect Payment
   │
   ├─> Select payment method
   │   ├─> Cash
   │   ├─> Card
   │   ├─> UPI
   │   └─> Mixed payment
   │
   ├─> Enter amount received
   └─> Calculate change
       │
5. Complete Transaction
   │
   ├─> Create Sales Invoice (auto-submit)
   ├─> Create Payment Entry
   ├─> Print/Email receipt
   │
   └─> Update stock levels
       │
6. Ready for Next Customer
```

---

## Technical Workflows

### Schema to UI Process

How schemas become interactive forms:

```
1. Schema Definition (JSON)
   │
   ├─> Define fields with properties:
   │   ├─> fieldname, fieldtype
   │   ├─> label, required
   │   ├─> default, readonly
   │   └─> validation rules
   │
2. Regional Override (if applicable)
   │
   ├─> Load regional schema
   └─> Merge with base schema
       │
3. Schema Loading
   │
   ├─> Fyo.schemaMap populated
   └─> Available to model layer
       │
4. Model Instantiation
   │
   ├─> Doc instance created
   ├─> Fields initialized
   ├─> Computed fields set up
   └─> Validation rules attached
       │
5. Form Generation
   │
   ├─> FormView component receives schema
   ├─> Fields rendered based on fieldtype:
   │   ├─> Data → Input field
   │   ├─> Link → Autocomplete
   │   ├─> Select → Dropdown
   │   ├─> Table → Child table
   │   ├─> Date → Date picker
   │   └─> Currency → Formatted input
   │
   └─> Two-way binding established
       │
6. User Interaction
   │
   ├─> User enters data
   ├─> Model updated
   ├─> Validation triggered
   └─> UI reflects state
```

### Database Query Process

How data is fetched from the database:

```
1. UI Request
   │
   └─> fyo.db.getAll('SalesInvoice', { filters, fields })
       │
2. Fyo Database Layer
   │
   ├─> Build query parameters
   └─> Route through Demux
       │
3. Demux Layer
   │
   ├─> Check platform (Electron vs Browser)
   │
   └─> Electron Path:
       │
       └─> IPC call to Main Process
           │
4. Main Process Database Handler
   │
   ├─> Receive IPC message
   ├─> Validate request
   └─> Forward to DatabaseCore
       │
5. DatabaseCore
   │
   ├─> Build SQL with Knex query builder
   ├─> Execute query via better-sqlite3
   └─> Get result set
       │
6. Transform Results
   │
   ├─> Convert DB rows to objects
   ├─> Apply field formatting
   └─> Serialize for IPC
       │
7. Return to Renderer
   │
   ├─> IPC response
   ├─> Deserialize data
   └─> Return to calling code
       │
8. UI Update
   │
   └─> Reactive Vue component updates
```

### Validation Cascade

How validation works at multiple levels:

```
┌─────────────────────────────────────────────────┐
│            Validation Levels                     │
└─────────────────────────────────────────────────┘

Level 1: UI Validation (Immediate)
├─> Input type validation (number, email, etc.)
├─> Required field checks
└─> Format validation

Level 2: Schema Validation
├─> Field type enforcement
├─> Min/max value checks
├─> Option list validation
└─> Pattern matching (regex)

Level 3: Model Validation
├─> Business rule validation
├─> Cross-field validation
├─> Conditional requirements
└─> Custom validation methods

Level 4: Database Constraints
├─> Foreign key constraints
├─> Unique constraints
├─> NOT NULL constraints
└─> Check constraints

All levels must pass for data to be saved.
```

---

## Regional Processing

### Indian GST Processing Flow

```
┌─────────────────────────────────────────────────┐
│       GST Calculation Process                    │
└─────────────────────────────────────────────────┘

1. Invoice Creation
   │
2. Identify Parties
   │
   ├─> Get supplier GSTIN (from company settings)
   └─> Get customer GSTIN (from party record)
       │
3. Determine Place of Supply
   │
   ├─> Extract state code from customer GSTIN (first 2 digits)
   │
   └─> If no GSTIN, use shipping address state
       │
4. Check Transaction Type
   │
   ├─> Compare supplier state with place of supply
   │
   ├─> Same state → Intra-state
   └─> Different state → Inter-state
       │
5. Select Tax Template
   │
   ├─> Intra-state:
   │   └─> Tax rate splits into CGST + SGST
   │       Example: 18% = 9% CGST + 9% SGST
   │
   └─> Inter-state:
       └─> Full rate as IGST
           Example: 18% = 18% IGST
       │
6. Calculate Tax
   │
   ├─> For each invoice item:
   │   │
   │   ├─> Taxable amount = Quantity × Rate
   │   │
   │   ├─> Tax amount = Taxable amount × Tax rate
   │   │
   │   └─> Total = Taxable amount + Tax amount
   │
   └─> Sum all taxes by component (CGST, SGST, IGST)
       │
7. Display Tax Breakdown
   │
   ├─> Show on invoice
   ├─> Store in database
   └─> Use in GST reports
```

### GST Report Generation

```
┌─────────────────────────────────────────────────┐
│         GSTR-3B Report Generation                │
└─────────────────────────────────────────────────┘

1. User selects date range (e.g., monthly)
   │
2. Query Database
   │
   ├─> Fetch all submitted invoices in period
   │   ├─> Sales Invoices (outward supply)
   │   └─> Purchase Invoices (inward supply)
   │
3. Group and Aggregate
   │
   ├─> Outward Supplies:
   │   ├─> Sum taxable value
   │   ├─> Sum CGST
   │   ├─> Sum SGST
   │   ├─> Sum IGST
   │   └─> Total tax
   │
   └─> Inward Supplies:
       ├─> Sum taxable value
       ├─> Sum CGST
       ├─> Sum SGST
       ├─> Sum IGST
       └─> Total tax (Input Tax Credit)
       │
4. Calculate Net GST
   │
   ├─> Net CGST = Outward CGST - Inward CGST
   ├─> Net SGST = Outward SGST - Inward SGST
   ├─> Net IGST = Outward IGST - Inward IGST
   └─> Total GST Payable = Net CGST + Net SGST + Net IGST
       │
5. Format Report
   │
   ├─> Create summary rows
   ├─> Apply Indian number formatting
   └─> Display in table
       │
6. Export Options
   │
   ├─> CSV for GST portal upload
   └─> Excel for records
```

---

## Report Generation Process

### Financial Report Flow

```
┌─────────────────────────────────────────────────┐
│      General Ledger Report Generation            │
└─────────────────────────────────────────────────┘

1. User opens General Ledger report
   │
2. Set Parameters
   │
   ├─> Date range (From - To)
   ├─> Account selection (optional)
   └─> Other filters
       │
3. Report Class Initialization
   │
   └─> GeneralLedger extends LedgerReport
       │
4. Data Retrieval
   │
   ├─> Query all accounting entries
   │   │
   │   ├─> FROM AccountingLedgerEntry table
   │   ├─> WHERE date BETWEEN fromDate AND toDate
   │   ├─> JOIN with account, party tables
   │   └─> ORDER BY date, account
   │
   └─> Get opening balances (before fromDate)
       │
5. Process Data
   │
   ├─> Group by account
   │
   ├─> For each entry:
   │   ├─> Track debit amount
   │   ├─> Track credit amount
   │   └─> Calculate running balance
   │
   └─> Calculate totals and closing balances
       │
6. Format for Display
   │
   ├─> Apply currency formatting (INR)
   ├─> Apply number formatting (1,00,000)
   ├─> Apply date formatting (DD/MM/YYYY)
   └─> Create table rows
       │
7. Render Report
   │
   ├─> Display in Report View component
   ├─> Enable sorting, filtering
   └─> Provide export options
       │
8. Export (if requested)
   │
   ├─> CSV: Plain comma-separated format
   └─> Excel: Formatted XLSX with styling
```

### Profit & Loss Statement

```
┌─────────────────────────────────────────────────┐
│         P&L Statement Generation                 │
└─────────────────────────────────────────────────┘

1. User opens P&L report
   │
2. Set Period
   │
   ├─> Financial year
   ├─> Quarter
   ├─> Month
   └─> Custom date range
       │
3. Fetch Account Balances
   │
   ├─> Get all Income accounts
   │   └─> Sales, Service Income, Other Income
   │
   └─> Get all Expense accounts
       └─> Cost of Goods Sold, Operating Expenses, etc.
       │
4. Calculate Period Balances
   │
   ├─> Sum all credits to Income accounts (Revenue)
   ├─> Sum all debits to Expense accounts (Expenses)
   └─> Apply date range filter
       │
5. Build Hierarchical Structure
   │
   ├─> Income (Root)
   │   ├─> Direct Income
   │   │   ├─> Sales
   │   │   └─> Service Income
   │   └─> Indirect Income
   │       └─> Other Income
   │
   ├─> Expenses (Root)
   │   ├─> Direct Expenses (COGS)
   │   └─> Indirect Expenses
   │       ├─> Administrative
   │       ├─> Selling
   │       └─> Financial
   │
   └─> Net Profit = Total Income - Total Expenses
       │
6. Apply Tree Logic
   │
   ├─> Calculate parent account totals
   ├─> Show/hide child accounts based on level
   └─> Add indentation for hierarchy
       │
7. Format and Display
   │
   ├─> Show Income section
   ├─> Show Expense section
   └─> Highlight Net Profit/Loss
```

---

## Build and Deployment Process

### Development Build

```
1. Developer runs: yarn dev
   │
2. Vite Dev Server Starts
   │
   ├─> Compile TypeScript → JavaScript
   ├─> Process Vue SFC files
   ├─> Apply Tailwind CSS
   └─> Serve on localhost:3000
       │
3. Electron Main Process Starts
   │
   ├─> Load main.ts
   ├─> Create window
   └─> Load http://localhost:3000
       │
4. Hot Module Replacement (HMR) Active
   │
   └─> File changes → Instant reload without app restart
```

### Production Build

```
1. Developer runs: yarn build
   │
2. Vite Production Build
   │
   ├─> Optimize and bundle all code
   ├─> Minify JavaScript/CSS
   ├─> Generate source maps
   ├─> Hash filenames for caching
   └─> Output to dist/ folder
       │
3. Electron Builder
   │
   ├─> Package application with:
   │   ├─> Bundled frontend (dist/)
   │   ├─> Backend code (backend/, fyo/, models/)
   │   ├─> Node modules
   │   └─> SQLite binaries
   │
   ├─> Create platform-specific installer:
   │   ├─> Windows: .exe installer
   │   ├─> macOS: .dmg and .app
   │   └─> Linux: .AppImage, .deb, .rpm
   │
   └─> Sign binaries (if certificates provided)
       │
4. Distribution
   │
   ├─> Upload to GitHub Releases
   ├─> Upload to website
   └─> Publish to package managers
       ├─> Homebrew (macOS/Linux)
       └─> Flathub (Linux)
```

### Auto-Update Process

```
1. Application Starts
   │
   └─> Check for updates (in background)
       │
2. Query Update Server
   │
   ├─> Current version: 1.0.0
   └─> Check: Is there a newer version?
       │
3. New Version Found: 1.1.0
   │
   ├─> Download update in background
   └─> Verify signature
       │
4. Notify User
   │
   └─> "Update available, restart to install"
       │
5. User Restarts
   │
   ├─> Old version closes
   ├─> Installer runs
   ├─> New version installed
   └─> New version starts
```

---

## Summary

This process documentation provides a comprehensive overview of how SharaLedger operates at various levels:

- **Architecture**: Client-server design within Electron
- **Startup**: Multi-stage initialization process
- **Data Flow**: Document lifecycle from creation to persistence
- **Business Processes**: Sales, payments, and POS workflows
- **Technical Workflows**: Schema-to-UI, database queries, validation
- **Regional Processing**: GST calculations and reporting
- **Report Generation**: Financial statements and analytics
- **Build & Deploy**: From development to production

Understanding these processes helps developers contribute effectively and users understand how their data flows through the system.

For more information:

- [Terminology Guide](TERMINOLOGY.md)
- [Features Documentation](FEATURES.md)
- [Technical Architecture](META.md)
