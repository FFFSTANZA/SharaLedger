# SharaLedger - Terminology Guide

This document provides detailed explanations of all the key terminologies used in SharaLedger (formerly Frappe Books), covering accounting concepts, technical terms, and system-specific vocabulary.

---

## Table of Contents

1. [Accounting Terminology](#accounting-terminology)
2. [Technical Terminology](#technical-terminology)
3. [System Components](#system-components)
4. [Indian GST Terminology](#indian-gst-terminology)
5. [UI/UX Terminology](#uiux-terminology)
6. [Database & Schema Terminology](#database--schema-terminology)

---

## Accounting Terminology

### Double-Entry Accounting

A fundamental accounting principle where every financial transaction affects at least two accounts - one debit and one credit. This ensures that the accounting equation (Assets = Liabilities + Equity) always remains balanced.

**Example:** When you sell a product for ₹1,000:

- Debit: Bank Account (+₹1,000)
- Credit: Sales Revenue (-₹1,000)

### Chart of Accounts

A complete listing of all accounts available in the accounting system, organized into categories:

- **Assets**: What the business owns (Cash, Inventory, Equipment)
- **Liabilities**: What the business owes (Loans, Accounts Payable)
- **Equity**: Owner's stake in the business (Capital, Retained Earnings)
- **Revenue**: Income from business activities (Sales, Service Income)
- **Expenses**: Costs incurred to run the business (Rent, Salaries, Utilities)

### General Ledger

The complete record of all financial transactions in the business, organized by account. It serves as the central repository from which all financial statements are derived.

### Trial Balance

A report that lists all accounts with their debit or credit balances. Used to verify that total debits equal total credits, ensuring the books are mathematically accurate.

### Balance Sheet

A financial statement showing the company's financial position at a specific point in time. It displays:

- **Assets** (what you own)
- **Liabilities** (what you owe)
- **Equity** (net worth)

Formula: Assets = Liabilities + Equity

### Profit and Loss Statement (P&L)

Also called Income Statement, it shows the company's financial performance over a period of time by summarizing:

- **Revenue** (income earned)
- **Expenses** (costs incurred)
- **Net Profit/Loss** (Revenue - Expenses)

### Journal Entry

A manual accounting entry used to record transactions that don't fit into standard categories (invoices, payments, etc.). Often used for adjustments, corrections, or complex transactions.

### Invoice

A commercial document issued by a seller to a buyer, indicating:

- Products/services provided
- Quantities
- Agreed prices
- Payment terms
- Tax calculations

Types in SharaLedger:

- **Sales Invoice**: Bill sent to customers for goods/services sold
- **Purchase Invoice**: Bill received from suppliers for goods/services purchased

### Credit Note

A document issued to reduce the amount owed by a customer, typically due to:

- Product returns
- Billing errors
- Discounts applied after invoicing

### Debit Note

A document issued to increase the amount owed to a supplier, typically for:

- Additional charges
- Corrections to purchase invoices

### Accounts Receivable

Money owed to the business by customers for goods/services sold on credit. Represents outstanding sales invoices.

### Accounts Payable

Money the business owes to suppliers for goods/services purchased on credit. Represents outstanding purchase invoices.

### Party

A generic term used in SharaLedger to refer to any business entity you transact with:

- **Customer**: Party that buys from you
- **Supplier**: Party you buy from

### Item

A product or service that can be bought or sold. Items have attributes like:

- Name and description
- Price
- Unit of measure (pieces, kg, hours, etc.)
- HSN/SAC code (for India)
- Tax rates

### Payment Entry

A record of money received from customers or paid to suppliers, linking payments to specific invoices.

### Cash Flow

The movement of money in and out of the business:

- **Cash Inflow**: Money coming in (sales, receipts)
- **Cash Outflow**: Money going out (purchases, expenses)
- **Net Cash Flow**: Difference between inflow and outflow

### Fiscal Year

The 12-month period used for financial reporting and tax purposes. In India, it typically runs from April 1 to March 31.

### Point of Sale (POS)

A system for processing retail transactions quickly, typically used in:

- Retail stores
- Restaurants
- Quick-service businesses

Features instant billing, payment processing, and receipt printing.

---

## Technical Terminology

### Electron

A framework that allows building cross-platform desktop applications using web technologies (HTML, CSS, JavaScript). SharaLedger uses Electron to run on Windows, macOS, and Linux as a native desktop app.

### Main Process

The "server" side of the Electron application that:

- Manages application lifecycle (startup, shutdown)
- Creates and manages windows
- Handles system-level operations (file system, database)
- Runs in Node.js environment

Entry point: `main.ts`

### Renderer Process

The "client" side of the Electron application that:

- Displays the user interface
- Handles user interactions
- Runs in a browser-like environment
- Communicates with Main Process via IPC

Entry point: `src/main.js`

### IPC (Inter-Process Communication)

The mechanism for communication between Main and Renderer processes in Electron:

- `ipcRenderer.invoke()`: Request-response pattern
- `ipcRenderer.send()`: Fire-and-forget pattern
- Allows renderer to access system resources safely

### Vue.js

A progressive JavaScript framework used for building the user interface. SharaLedger uses Vue 3 with:

- Component-based architecture
- Reactive data binding
- Single File Components (.vue files)

### SFC (Single File Component)

A `.vue` file that contains three sections:

```vue
<template>  <!-- HTML structure -->
<script>    <!-- JavaScript logic -->
<style>     <!-- CSS styling -->
```

### Vite

A modern build tool and development server that:

- Provides fast hot module replacement (HMR)
- Bundles code for production
- Supports TypeScript, Vue, and other modern frameworks

### SQLite

A lightweight, file-based database engine used by SharaLedger to store all data locally:

- No server required
- ACID compliant
- Single file database (`.db` extension)
- Embedded in the application

### better-sqlite3

A Node.js library that provides synchronous SQLite3 bindings, used as the database driver in SharaLedger.

### Knex.js

A SQL query builder used to:

- Generate database queries programmatically
- Handle database migrations
- Provide database abstraction layer

### TypeScript

A typed superset of JavaScript that adds:

- Static type checking
- Enhanced IDE support
- Better code documentation
- Compiled to JavaScript

### Tailwind CSS

A utility-first CSS framework used for styling:

- Provides pre-built CSS classes
- Enables rapid UI development
- Supports responsive design
- Customizable via configuration

---

## System Components

### Fyo

The core framework/library that powers SharaLedger's business logic. It manages:

- Data models and schemas
- Document lifecycle
- Validation rules
- Computed fields
- Database operations

Think of Fyo as the "engine" that handles all business logic independent of the UI.

### Doc (Document)

An instance of a schema that represents a database record. Examples:

- A specific invoice (e.g., "INV-001")
- A specific customer (e.g., "ABC Corp")
- A specific payment (e.g., "PAY-2024-001")

Docs have methods for CRUD operations, validation, and business logic.

### Schema

A JSON-based definition that describes the structure of a document type:

- Field names and types
- Validation rules
- Relationships between documents
- Computed fields
- Permissions

Example: The "SalesInvoice" schema defines all fields an invoice should have.

### Model

A TypeScript class that contains the business logic for a specific schema. Models:

- Extend the base Doc class
- Implement validation rules
- Handle calculations
- Define hooks (before save, after save, etc.)

### Demux

A set of files that handle platform-specific operations, abstracting whether the app runs in:

- Electron (desktop)
- Browser (web)

Located in: `fyo/demux/`

### Regional Schema Override

A system that allows extending base schemas with country-specific fields:

- Base schemas: `/schemas/app/*.json`
- Regional overrides: `/schemas/regional/in/*.json` (for India)

Example: Adding GSTIN field to Party schema for Indian users.

### DatabaseCore

The core database management layer that:

- Wraps better-sqlite3
- Provides ORM-style CRUD operations
- Handles migrations
- Executes patches
- Manages transactions

Located in: `backend/database/`

### Migrations

Database schema changes that:

- Create tables
- Add/modify columns
- Create indexes
- Transform data

Tracked and executed automatically.

### Patches

Code-based database updates that:

- Fix data issues
- Add default records
- Transform existing data
- Run once per database

Located in: `backend/patches/`

---

## Indian GST Terminology

### GST (Goods and Services Tax)

A comprehensive indirect tax levied on the supply of goods and services in India, replacing multiple cascading taxes.

### GSTIN (GST Identification Number)

A unique 15-character alphanumeric code assigned to every GST-registered business.

Format: `27AAAAA0000A1Z5`

- First 2 digits: State code
- Next 10 characters: PAN of the business
- Next 1 character: Entity number
- Next 1 character: Z (default)
- Last 1 character: Check digit

### CGST (Central GST)

The tax collected by the Central Government on intra-state (within the same state) transactions.

Example: 18% GST on intra-state sale = 9% CGST + 9% SGST

### SGST (State GST)

The tax collected by the State Government on intra-state transactions, always equal to CGST.

### IGST (Integrated GST)

The tax collected by the Central Government on inter-state (across different states) transactions.

Example: 18% GST on inter-state sale = 18% IGST

### HSN Code (Harmonized System of Nomenclature)

A standardized numerical code used to classify **goods** under GST.

Examples:

- 2106 - Food preparations
- 8471 - Computers
- 6109 - T-shirts

### SAC Code (Services Accounting Code)

A standardized numerical code used to classify **services** under GST.

Examples:

- 9963 - Accommodation and food services
- 9983 - Professional services
- 9987 - Maintenance services

### Place of Supply

The state where the goods/services are deemed to be consumed. Determines whether CGST+SGST or IGST applies:

- **Same state as supplier**: CGST + SGST
- **Different state**: IGST

### Intra-State Transaction

A transaction where the supplier and the place of supply are in the same state. Subject to CGST + SGST.

### Inter-State Transaction

A transaction where the supplier and the place of supply are in different states. Subject to IGST.

### GSTR-1

GST return for **outward supplies** (sales). Filed monthly/quarterly, it contains:

- Sales invoice details
- Credit notes
- Tax collected

### GSTR-2

GST return for **inward supplies** (purchases). Contains:

- Purchase invoice details
- Debit notes
- Tax paid (Input Tax Credit)

### GSTR-3B

A summary GST return filed monthly showing:

- Total outward supplies (sales)
- Total inward supplies (purchases)
- Tax payable (Sales tax - Purchase tax)
- Tax paid

### Reverse Charge Mechanism (RCM)

A system where the buyer (instead of the supplier) is liable to pay GST. Applies to specific categories of goods/services.

### Input Tax Credit (ITC)

The credit of GST paid on purchases that can be offset against GST collected on sales, reducing the net tax liability.

### Taxable Value

The base amount on which tax is calculated, excluding the tax itself.

Example: Item price = ₹1,000 + 18% GST (₹180) = ₹1,180 total

- Taxable Value: ₹1,000
- Tax Amount: ₹180

### E-Way Bill

An electronic document required for movement of goods worth more than ₹50,000 in value.

---

## UI/UX Terminology

### Dashboard

The home screen showing an overview of business metrics:

- Cash flow charts
- Outstanding invoices
- Profit/loss summaries
- Quick action buttons

### Card-Based Layout

A design pattern where information is organized into distinct rectangular containers (cards) with:

- Rounded corners
- Shadows
- Clear boundaries
- Grouped related content

### Glass Morphism

A modern UI design trend featuring:

- Semi-transparent backgrounds
- Backdrop blur effects
- Light borders
- Layered appearance

Example: `bg-white/95 backdrop-blur-md`

### Dark Mode

An alternative color scheme with:

- Dark backgrounds
- Light text
- Reduced eye strain in low-light conditions
- Lower power consumption on OLED screens

### Gradient

A gradual blend between two or more colors, used in SharaLedger for:

- Headers (violet to teal)
- Buttons
- Chart fills
- Background effects

### Hover States

Visual feedback when the user moves their cursor over an interactive element:

- Color changes
- Shadow enhancements
- Slight movement (transform)
- Scale changes

### Transition

Smooth animation between states, making UI changes feel natural:

- `transition-all duration-300`: Animates all properties over 300ms
- Applied to buttons, cards, charts

### Shadow

Visual depth effect using drop shadows:

- `shadow-sm`: Subtle shadow
- `shadow-lg`: Large shadow
- `shadow-xl`: Extra large shadow
- `shadow-2xl`: Maximum shadow

### Responsive Design

UI that adapts to different screen sizes:

- Desktop layouts
- Tablet layouts
- Mobile layouts

### Modal

A dialog box that appears on top of the main content, requiring user interaction before continuing.

---

## Database & Schema Terminology

### CRUD Operations

The four basic database operations:

- **Create**: Insert new records
- **Read**: Retrieve existing records
- **Update**: Modify existing records
- **Delete**: Remove records

### ORM (Object-Relational Mapping)

A technique that maps database tables to programming objects, allowing database operations using object-oriented code.

### Foreign Key

A field that references the primary key of another table, establishing relationships between tables.

Example: Invoice has a `party` field that references a Party record.

### Index

A database structure that improves query performance by creating a sorted reference to specific columns.

### Transaction

A group of database operations that either all succeed or all fail together, ensuring data consistency.

### ACID Compliance

Database properties ensuring reliability:

- **Atomicity**: All-or-nothing transactions
- **Consistency**: Data integrity maintained
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data persists

### Computed Field

A field whose value is automatically calculated based on other fields.

Example: Invoice `grandTotal` = `netTotal` + `taxes`

### Link Field

A field that references another document, creating a relationship.

Example: Invoice `party` field links to a Party document.

### Table Field

A field that contains multiple rows of data (child table).

Example: Invoice `items` field contains multiple InvoiceItem rows.

### Default Value

A value automatically assigned to a field if no value is provided.

Example: Invoice date defaults to today's date.

### Required Field

A field that must have a value before the document can be saved.

Example: Invoice must have a `party` (customer).

### Read-only Field

A field whose value cannot be directly edited by the user, typically computed or system-generated.

Example: Invoice `outstandingAmount` is calculated automatically.

### Hidden Field

A field that exists in the database but is not displayed in the UI under certain conditions.

---

## Additional Terms

### Hot Module Replacement (HMR)

A development feature that updates code in the running application without a full page reload, preserving application state.

### Auto-update

Feature that automatically checks for and installs new versions of SharaLedger.

### Offline Mode

Ability to use SharaLedger without an internet connection, since all data is stored locally.

### Export Functionality

Ability to export data to external formats:

- CSV (Comma-Separated Values)
- Excel (XLSX)
- PDF

### Localization (l10n)

Adapting the application for a specific region:

- Date formats (DD/MM/YYYY for India)
- Number formats (1,00,000 for India)
- Currency (₹ for India)
- Language translations

### Internationalization (i18n)

Designing the application to support multiple languages and regions without code changes.

### Amount in Words

Converting numerical amounts to written words in regional format.

Example: ₹1,23,456 → "One Lakh Twenty-Three Thousand Four Hundred Fifty-Six Rupees only"

### Taxable Amount

The portion of a transaction value that is subject to tax.

### Tax Breakup

Detailed split of taxes applied:

- CGST: ₹90
- SGST: ₹90
- Total Tax: ₹180

---

## Summary

This terminology guide covers the essential vocabulary used throughout SharaLedger. Understanding these terms will help users, developers, and contributors navigate the system effectively, whether they're creating invoices, understanding reports, or contributing to the codebase.

For more information:

- [Process Documentation](PROCESS.md)
- [Features Documentation](FEATURES.md)
- [Technical Documentation](META.md)
- [Indian Localization](INDIAN_LOCALIZATION_STATUS.md)
