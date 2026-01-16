export interface CSVParseOptions {
  delimiter?: string;
  quoteChar?: string;
  skipEmptyLines?: boolean;
  skipHeaderRow?: boolean;
  encoding?: string;
  maxRows?: number;
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
  totalRows: number;
  emptyRows: number;
  warnings: string[];
  errors: string[];
}

export function parseCSVAdvanced(
  content: string,
  options: CSVParseOptions = {}
): CSVParseResult {
  const {
    delimiter,
    quoteChar = '"',
    skipEmptyLines = false,
    skipHeaderRow = false,
    encoding = 'utf-8',
    maxRows
  } = options;

  // Clean and normalize content
  let text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Detect encoding if needed
  try {
    // Try to decode if it's not already a string
    if (!(content instanceof String) && content instanceof Buffer) {
      text = content.toString(encoding);
    }
  } catch (e) {
    // Fallback to UTF-8
    text = content.toString('utf-8');
  }

  const warnings: string[] = [];
  const errors: string[] = [];

  // Auto-detect delimiter if not provided
  let detectedDelimiter = delimiter;
  if (!detectedDelimiter) {
    const detection = detectDelimiter(text);
    detectedDelimiter = detection.delimiter;
    if (detection.confidence < 0.7) {
      warnings.push(`Low confidence delimiter detection: using "${detectedDelimiter}"`);
    }
  }

  // Detect quote character
  let detectedQuoteChar = quoteChar;
  const quoteDetection = detectQuoteCharacter(text, detectedDelimiter);
  if (quoteDetection.detected) {
    detectedQuoteChar = quoteDetection.quoteChar;
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let quoteStartPos = -1;
  let lineCount = 0;
  let emptyRowCount = 0;
  let malformedRows = 0;

  // Add newline at end if missing to ensure proper parsing
  if (!text.endsWith('\n')) {
    text += '\n';
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    // Handle quoted fields
    if (inQuotes) {
      if (char === detectedQuoteChar) {
        // Check if it's an escaped quote
        if (nextChar === detectedQuoteChar) {
          currentField += detectedQuoteChar;
          i++; // Skip next quote
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          continue;
        }
      } else {
        currentField += char;
        continue;
      }
    }

    // Start of quoted field
    if (char === detectedQuoteChar) {
      inQuotes = true;
      quoteStartPos = i;
      continue;
    }

    // Delimiter
    if (char === detectedDelimiter) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    // New line
    if (char === '\n') {
      currentRow.push(currentField);
      currentField = '';
      
      // Check if row is empty
      const isEmptyRow = currentRow.every(field => field.trim() === '');
      if (isEmptyRow) {
        emptyRowCount++;
        if (!skipEmptyLines) {
          rows.push(currentRow);
        }
      } else {
        rows.push(currentRow);
      }
      
      currentRow = [];
      lineCount++;

      // Check max rows limit
      if (maxRows && lineCount >= maxRows) {
        break;
      }
      continue;
    }

    // Regular character
    currentField += char;
  }

  // Handle last field/row if file doesn't end with newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    const isEmptyRow = currentRow.every(field => field.trim() === '');
    if (!isEmptyRow || !skipEmptyLines) {
      rows.push(currentRow);
    }
  }

  // Validate parsed data
  if (rows.length === 0) {
    errors.push('No data found in file');
    return {
      headers: [],
      rows: [],
      delimiter: detectedDelimiter,
      totalRows: 0,
      emptyRows: emptyRowCount,
      warnings,
      errors
    };
  }

  // Detect headers
  let headers: string[];
  let dataRows: string[][];

  if (skipHeaderRow) {
    headers = Array.from({ length: Math.max(...rows.map(r => r.length)) }, (_, i) => `Column ${i + 1}`);
    dataRows = rows;
  } else {
    headers = rows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
    dataRows = rows.slice(1);
  }

  // Remove empty rows from data
  const filteredDataRows = skipEmptyLines 
    ? dataRows.filter(row => row.some(field => field.trim() !== ''))
    : dataRows;

  // Report issues
  if (malformedRows > 0) {
    warnings.push(`Found ${malformedRows} potentially malformed rows`);
  }

  if (filteredDataRows.length !== dataRows.length) {
    warnings.push(`Removed ${dataRows.length - filteredDataRows.length} empty rows`);
  }

  if (filteredDataRows.length === 0 && !skipHeaderRow) {
    warnings.push('No data rows found after header row');
  }

  // Ensure all rows have the same number of columns
  const maxColumns = Math.max(...rows.map(row => row.length));
  const normalizedRows = filteredDataRows.map(row => {
    if (row.length < maxColumns) {
      // Pad with empty strings
      return [...row, ...Array(maxColumns - row.length).fill('')];
    } else if (row.length > maxColumns) {
      warnings.push('Found rows with more columns than header');
      return row.slice(0, maxColumns);
    }
    return row;
  });

  return {
    headers,
    rows: normalizedRows,
    delimiter: detectedDelimiter,
    totalRows: rows.length,
    emptyRows: emptyRowCount,
    warnings,
    errors
  };
}

function detectDelimiter(text: string): { delimiter: string; confidence: number } {
  const delimiters = [',', ';', '\t', '|'];
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return { delimiter: ',', confidence: 0 };
  }

  let bestDelimiter = ',';
  let bestScore = 0;

  for (const delimiter of delimiters) {
    const scores: number[] = [];
    
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      scores.push(count);
    }

    // Score based on consistency and count
    const avgCount = scores.reduce((a, b) => a + b, 0) / scores.length;
    const consistency = 1 - (Math.max(...scores) - Math.min(...scores)) / Math.max(1, avgCount);
    const score = avgCount * consistency;

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return { delimiter: bestDelimiter, confidence: Math.min(bestScore / 5, 1) };
}

function detectQuoteCharacter(text: string, delimiter: string): { detected: boolean; quoteChar: string } {
  const quoteChars = ['"', "'", '`'];
  let bestQuote = '"';
  let maxQuotes = 0;

  for (const quote of quoteChars) {
    const regex = new RegExp(`\\${quote}[^\\${quote}]*\\${quote}`, 'g');
    const matches = text.match(regex) || [];
    
    if (matches.length > maxQuotes) {
      maxQuotes = matches.length;
      bestQuote = quote;
    }
  }

  return { detected: maxQuotes > 0, quoteChar: bestQuote };
}

// Enhanced version with better error handling and formatting
export function parseCSV(
  content: string,
  options: CSVParseOptions = {}
): string[][] {
  const result = parseCSVAdvanced(content, options);
  
  if (result.errors.length > 0) {
    throw new Error(`CSV parsing failed: ${result.errors.join(', ')}`);
  }

  // Return [headers, ...rows] format for backward compatibility
  return [result.headers, ...result.rows];
}

// Utility functions for better data processing
export function sanitizeField(value: string): string {
  if (!value) return '';
  
  return value
    .trim()
    .replace(/^"+|"+$/g, '') // Remove surrounding quotes
    .replace(/^'+|'+$/g, '') // Remove surrounding single quotes
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function detectDataType(value: string): 'number' | 'date' | 'text' {
  const sanitized = sanitizeField(value);
  
  if (!sanitized) return 'text';
  
  // Number detection
  if (/^-?\d+(\.\d+)?$/.test(sanitized.replace(/,/g, ''))) {
    return 'number';
  }
  
  // Date detection (multiple formats)
  const datePatterns = [
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/, // DD/MM/YYYY or DD-MM-YYYY
    /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/,   // YYYY/MM/DD or YYYY-MM-DD
    /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$/, // DD Month YYYY
  ];
  
  if (datePatterns.some(pattern => pattern.test(sanitized))) {
    return 'date';
  }
  
  return 'text';
}

export function analyzeCSVStructure(content: string): {
  delimiter: string;
  quoteChar: string;
  hasHeaders: boolean;
  rowCount: number;
  columnCount: number;
  sampleData: string[][];
} {
  const result = parseCSVAdvanced(content);
  
  return {
    delimiter: result.delimiter,
    quoteChar: '"',
    hasHeaders: true, // We assume headers for bank statements
    rowCount: result.rows.length,
    columnCount: result.headers.length,
    sampleData: result.rows.slice(0, 5) // First 5 data rows
  };
}