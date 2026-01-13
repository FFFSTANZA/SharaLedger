import * as XLSX from 'xlsx';
import { parseCSV } from 'utils/csvParser';

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export async function parseStatementFile(fileName: string, data: Uint8Array): Promise<string[][]> {
  const extension = getFileExtension(fileName);

  if (extension === 'csv') {
    const text = new TextDecoder().decode(data);
    return parseCSV(text);
  }

  if (['xlsx', 'xls', 'ods'].includes(extension)) {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];
  }

  throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
}
