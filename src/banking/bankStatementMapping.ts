export type BankStatementField =
  | 'date'
  | 'description'
  | 'debit'
  | 'credit'
  | 'balance'
  | 'bankReference';

const fieldKeywords: Record<BankStatementField, string[]> = {
  date: [
    'date',
    'txn date',
    'transaction date',
    'value date',
    'posting date',
    'txn dt',
    'trans date',
    'tran date',
    'cheque date',
    'value dt',
    'booking date',
    'post date',
    'dt',
  ],
  description: [
    'narration',
    'description',
    'remarks',
    'particulars',
    'details',
    'transaction details',
    'transaction particulars',
    'chq details',
    'mode',
    'transaction remarks',
    'narr',
    'desc',
    'remark',
  ],
  debit: [
    'debit',
    'dr amount',
    'withdrawal',
    'withdraw',
    'dr',
    'paid out',
    'withdrawal amt',
    'withdrawals',
    'amount dr',
    'debit amount',
    'debit amt',
    'amt dr',
    'payment',
    'payments',
  ],
  credit: [
    'credit',
    'cr amount',
    'deposit',
    'cr',
    'paid in',
    'receipt',
    'deposit amt',
    'deposits',
    'amount cr',
    'credit amount',
    'credit amt',
    'amt cr',
    'receipts',
  ],
  balance: [
    'balance',
    'running balance',
    'closing balance',
    'available balance',
    'ledger balance',
    'balance amt',
    'balance amount',
    'bal',
    'closing bal',
    'available bal',
  ],
  bankReference: [
    'reference',
    'ref no',
    'ref',
    'utr',
    'rrn',
    'chq',
    'cheque',
    'instrument',
    'transaction id',
    'txn id',
    'ref number',
    'reference no',
    'cheque no',
    'instrument no',
    'reference number',
    'chq no',
    'transaction no',
    'txn no',
  ],
};

export function detectHeaderRowIndex(rows: string[][]): number {
  const limit = Math.min(rows.length, 20);

  let bestIndex = 0;
  let bestScore = -1;

  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? [];
    
    // Skip completely empty rows
    const hasContent = row.some((cell) => String(cell ?? '').trim() !== '');
    if (!hasContent) {
      continue;
    }

    const score = getHeaderScore(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestScore < 2) {
    return 0;
  }

  return bestIndex;
}

export function getHeaderSignature(headerRow: string[]): string {
  return headerRow.map((h) => normalizeHeader(h)).join('|');
}

export function autoMapColumns(headerRow: string[]): {
  fieldIndexMap: Partial<Record<BankStatementField, number>>;
  confidence: number;
  normalizedHeaders: string[];
} {
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const scored: {
    field: BankStatementField;
    index: number;
    score: number;
  }[] = [];

  for (let i = 0; i < normalizedHeaders.length; i++) {
    const header = normalizedHeaders[i];
    if (!header) {
      continue;
    }

    for (const field of Object.keys(fieldKeywords) as BankStatementField[]) {
      const score = keywordScore(header, fieldKeywords[field]);
      if (score <= 0) {
        continue;
      }

      scored.push({ field, index: i, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const used = new Set<number>();
  const fieldIndexMap: Partial<Record<BankStatementField, number>> = {};

  for (const s of scored) {
    if (fieldIndexMap[s.field] != null) {
      continue;
    }

    if (used.has(s.index)) {
      continue;
    }

    fieldIndexMap[s.field] = s.index;
    used.add(s.index);
  }

  const requiredFields: BankStatementField[] = ['date', 'description'];
  const foundRequired = requiredFields.filter((f) => fieldIndexMap[f] != null);
  const hasAmount = fieldIndexMap.debit != null || fieldIndexMap.credit != null;
  const hasBalance = fieldIndexMap.balance != null;
  const hasReference = fieldIndexMap.bankReference != null;

  let confidence = 0;
  confidence += foundRequired.length / requiredFields.length;
  confidence += hasAmount ? 1 : 0;
  
  // Bonus points for having balance and reference columns
  if (hasBalance) confidence += 0.2;
  if (hasReference) confidence += 0.1;
  
  confidence = Math.min(confidence / 2, 1);

  return { fieldIndexMap, confidence, normalizedHeaders };
}

export function normalizeHeader(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function keywordScore(normalizedHeader: string, keywords: string[]): number {
  let score = 0;
  for (const keyword of keywords) {
    const k = normalizeHeader(keyword);
    if (!k) {
      continue;
    }

    if (normalizedHeader === k) {
      score += 3;
      continue;
    }

    if (normalizedHeader.includes(k)) {
      score += 2;
      continue;
    }

    if (k.includes(normalizedHeader)) {
      score += 1;
    }
  }

  return score;
}

function getHeaderScore(row: string[]): number {
  const normalized = row.map(normalizeHeader);
  let score = 0;

  for (const cell of normalized) {
    if (!cell) {
      continue;
    }

    for (const field of Object.keys(fieldKeywords) as BankStatementField[]) {
      score += keywordScore(cell, fieldKeywords[field]);
    }
  }

  return score;
}
