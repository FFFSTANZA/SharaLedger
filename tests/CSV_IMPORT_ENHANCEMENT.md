# Enhanced CSV Import for Bank Statements

## Overview

The bank statement import functionality has been significantly enhanced to handle various CSV file formats robustly. The new system can detect and process different delimiters, handle quoted fields, manage empty rows, and provide intelligent column mapping suggestions.

## Key Improvements

### 1. Robust CSV Parsing

**Multiple Delimiter Support:**
- Comma (,)
- Semicolon (;)  
- Tab (\t)
- Pipe (|)

**Advanced Quote Handling:**
- Properly handles quoted fields
- Escaped quotes within quoted fields
- Multiple quote characters (", ', `)

**Encoding Support:**
- UTF-8 (default)
- Auto-detection of common encodings
- Fallback mechanisms for malformed data

### 2. Enhanced Column Detection

The system now uses intelligent pattern matching to auto-detect column types:

**Date Columns:**
- Headers: `date`, `transaction date`, `posting date`, `value date`, etc.
- Data pattern analysis: recognizes DD/MM/YYYY, YYYY-MM-DD formats
- Fuzzy matching for date-like data

**Amount Columns:**
- Headers: `amount`, `amt`, `value`, `transaction amount`
- Numeric pattern detection
- Currency formatting recognition

**Description Columns:**
- Headers: `description`, `narration`, `details`, `remarks`
- Text-length analysis
- Content pattern recognition

**Withdrawal/Deposit Columns:**
- Header analysis for debit/credit indicators
- Value sign analysis for automatic classification
- Special handling for separate withdrawal/deposit columns

**Balance Columns:**
- Large number detection
- Banking terminology recognition

**Reference Columns:**
- Alphanumeric pattern matching
- Banking reference formats (cheque numbers, UTR, etc.)

### 3. Data Quality Validation

**Empty Row Detection:**
- Automatic removal of empty rows
- Configurable thresholds for data completeness

**Column Consistency:**
- Validation of column counts across rows
- Warning generation for inconsistencies

**Encoding Verification:**
- Detection of non-ASCII characters
- Warnings for potential encoding issues

### 4. User Experience Improvements

**Better Error Messages:**
- Detailed parsing reports
- Warning descriptions
- Actionable guidance for fixing issues

**Parsing Transparency:**
- Show detected delimiter and format
- Display parsing warnings (non-blocking)
- Preview of parsed data

**Flexible Mapping:**
- Manual override of auto-detected mappings
- Clear/reset mapping functionality
- Visual mapping interface

## Usage

### Supported File Formats

1. **Standard CSV (Comma-delimited)**
   ```
   Date,Description,Amount,Balance
   2024-01-01,Opening Balance,1000.00,1000.00
   2024-01-02,ATM Withdrawal,-50.00,950.00
   ```

2. **Semicolon-delimited with Quotes**
   ```
   "Date";"Description";"Amount";"Balance"
   "2024-01-01";"Opening Balance";"1000.00";"1000.00"
   ```

3. **Tab-delimited**
   ```
   Date    Description Amount  Balance
   2024-01-01  Opening Balance  1000.00 1000.00
   ```

4. **Mixed Format with Special Characters**
   ```
   Date,Description,Amount,Balance,Reference
   01/01/2024,Opening Balance,"$1,000.00",1000.00,OB001
   02/01/2024,ATM Withdrawal,50.00,950.00,ATM001
   ```

### Common Bank Statement Formats

The system handles various bank statement formats:

**HDFC Bank Format:**
```
Date,Transaction Date,Description,Reference,Debit,Credit,Balance
01/01/2024,01/01/2024,OPENING BALANCE,,,1000.00,1000.00
```

**ICICI Bank Format:**
```
Transaction Date,Description,Amount,Balance
01-01-2024,Opening Balance,+1000.00,1000.00
02-01-2024,ATM Withdrawal,-50.00,950.00
```

**SBI Format:**
```
DATE,NARRATION,CHQ./REF.NO.,WITHDRAWALS,DEPOSITS,BALANCE
01/01/2024,OPENING BALANCE,,0.00,1000.00,1000.00
02/01/2024,ATM WDL,12345,500.00,0.00,500.00
```

## Technical Details

### CSV Parser Functions

**parseCSVAdvanced(content, options):**
- Main parsing function with full feature set
- Returns detailed parsing results including warnings
- Handles all edge cases and formatting variations

**parseCSV(content, options):**
- Backward-compatible wrapper
- Returns simple array format for existing code

**analyzeCSVStructure(content):**
- Quick file format analysis
- Delimiter detection
- Sample data extraction

**Utility Functions:**
- `sanitizeField(value)`: Clean and normalize field values
- `detectDataType(value)`: Identify numeric, date, or text data

### Import Process

1. **File Analysis**
   - Detect delimiter and format
   - Analyze encoding and structure
   - Generate parsing warnings if needed

2. **Data Validation**
   - Check for empty rows and columns
   - Validate data consistency
   - Report quality issues

3. **Column Mapping**
   - Auto-detect column types
   - Suggest mappings based on headers and data
   - Allow manual override

4. **Import Processing**
   - Transform data according to mappings
   - Apply deduplication logic
   - Generate import reports

## Error Handling

### Common Issues and Solutions

**"Only header exists" Error:**
- Enhanced parsing now handles files with minimal data
- Better detection of actual data vs. formatting artifacts
- More descriptive error messages

**Encoding Issues:**
- Automatic encoding detection
- Fallback to UTF-8 with warnings
- Non-blocking warnings for minor issues

**Malformed CSV:**
- Graceful handling of inconsistent row lengths
- Padding or truncation as needed
- Warning generation for format issues

**Empty Data:**
- Detection of completely empty files
- Partial data handling
- User guidance for remediation

## Testing

The enhanced CSV parser includes comprehensive test coverage:

- Standard CSV formats
- International delimiters and encodings
- Edge cases and malformed data
- Bank statement format compatibility
- Performance with large files

Run tests with:
```bash
npm test -- csv_parser_enhanced
```

## Migration Notes

### For Existing Code

The `parseCSV` function maintains backward compatibility. Existing code will continue to work without changes.

### For New Features

To use enhanced features:

```typescript
import { parseCSVAdvanced, analyzeCSVStructure } from 'utils/csvParser';

// Enhanced parsing with options
const result = parseCSVAdvanced(content, {
  delimiter: ',',
  skipEmptyLines: true,
  encoding: 'utf-8',
  maxRows: 50000
});

// Quick structure analysis
const analysis = analyzeCSVStructure(content);
console.log(`Detected ${analysis.delimiter} delimiter`);
```

### Performance Considerations

- Large file processing with configurable row limits
- Memory-efficient parsing for big datasets
- Progressive processing for responsive UI
- Optional data validation for speed vs. accuracy trade-offs

## Future Enhancements

- Excel (.xlsx) file support
- Cloud storage integration
- Real-time preview during import
- Template-based import mapping
- Machine learning for better column detection