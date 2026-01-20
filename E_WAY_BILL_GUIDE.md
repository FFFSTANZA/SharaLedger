# E-Way Bill System Guide

## Overview
An E-Way Bill (Electronic Way Bill) is a mandatory document required for the movement of goods in India. This system allows you to manage and track E-Way Bills directly linked to your Sales Invoices.

## How it Works
1. **Creation**: E-Way Bills are linked to specific Sales Invoices.
2. **Sales Invoice Link**: When you select a Sales Invoice, the system automatically fetches:
    - Invoice Number, Date, and Total Value.
    - **From GSTIN**: Your company's GSTIN from settings.
    - **To GSTIN**: The customer's GSTIN from their record.
3. **Populating Data**:
    - **Automatic**: Reference fields like Invoice No, Date, and Value are read-only and updated when the invoice is selected.
    - **Calculated**: The "Valid Upto" date is automatically calculated based on the distance provided (standard 200km per day rule).
4. **Status Management**:
    - **Draft**: The initial state of an E-Way Bill.
    - **Active**: When the bill is submitted and within its validity period.
    - **Cancelled**: If the movement of goods is cancelled.
    - **Expired**: When the validity period has passed.

## How to Create an E-Way Bill

### Method 1: Directly from a Sales Invoice
1. Go to **Sales** > **Sales Bills**.
2. Open a **Submitted** Sales Invoice.
3. Click the **Create** button in the header.
4. Select **E-Way Bill**.
5. All invoice and GST details will be automatically pre-filled.
6. Enter **Transport Details**:
    - Transporter Name (optional)
    - Transport Mode (Road, Rail, Air, Ship)
    - Vehicle Number (e.g., MH12AB1234)
    - Distance in KM
7. Once you generate the E-Way Bill on the GST Portal, enter the **12-digit E-Way Bill Number**, **Date**, and **Valid Upto** date.
8. Click **Save** and then **Submit**.

### Method 2: From the E-Way Bill List
1. Go to **GST** > **E-Way Bills**.
2. Click **New Entry**.
3. Select the **Sales Invoice** from the dropdown.
4. The system will automatically populate the invoice and GST details.
5. Fill in the remaining transport and portal-generated details.
6. Click **Save** and then **Submit**.

## Key Features
- **Validation**: Ensures E-Way Bill numbers are 12 digits and vehicle numbers follow the correct format.
- **Register**: A dedicated report (GST > E-Way Bill Register) to view all movements within a period.
- **Status Tracking**: Automatically marks bills as "Expired" based on the validity date.

## Troubleshooting
- **Sales Invoice Null/Rs. 0**: Ensure you have selected a **Submitted** Sales Invoice. The system only fetches details from invoices that are finalized.
- **Invalid Data Error**: This usually happens if the Vehicle Number or GSTIN format is incorrect. Check the format:
    - **Vehicle No**: MH12AB1234
    - **GSTIN**: 27AAAAA0000A1Z5
- **Not in Register**: Ensure the E-Way Bill is saved. The Register filters by the **Invoice Date** within the selected range.
