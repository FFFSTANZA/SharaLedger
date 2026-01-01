import { DateTime } from 'luxon';

export function prefixFormat(value: number, isIndian = false): string {
  /*
  Standard:
  1,000,000,000,000 = 1 T (Trillion)
  1,000,000,000 = 1 B (Billion)
  1,000,000 = 1 M (Million)
  1,000 = 1 K (Thousand)

  Indian:
  10,00,00,000 = 10 Cr (Crore)
  1,00,00,000 = 1 Cr (Crore)
  1,00,000 = 1 L (Lakh)
  1,000 = 1 K (Thousand)
  */
  const absValue = Math.abs(value);
  if (absValue < 1000) {
    return Math.round(value).toString();
  }

  if (isIndian) {
    if (absValue >= 10000000) {
      return `${(value / 10000000).toFixed(1)} Cr`;
    } else if (absValue >= 100000) {
      return `${(value / 100000).toFixed(1)} L`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(1)} K`;
    }
  }

  const ten = Math.floor(Math.log10(absValue));
  const three = Math.floor(ten / 3);
  const num = (value / Math.pow(10, three * 3)).toFixed(1);
  const suffix = ['', 'K', 'M', 'B', 'T', 'Q', 'P'][three];
  return `${num.endsWith('.0') ? num.slice(0, -2) : num} ${suffix}`;
}

export function euclideanDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dsq = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  return Math.sqrt(dsq);
}

function getRoundingConst(val: number): number {
  const pow = Math.max(Math.log10(Math.abs(val)) - 1, 0);
  return 10 ** Math.floor(pow);
}

function getVal(minOrMaxVal: number): number {
  const rc = getRoundingConst(minOrMaxVal);
  const sign = minOrMaxVal >= 0 ? 1 : -1;
  if (sign === 1) {
    return Math.ceil(minOrMaxVal / rc) * rc;
  }
  return Math.floor(minOrMaxVal / rc) * rc;
}

export function getYMax(points: number[][]): number {
  const maxVal = Math.max(...points.flat());
  if (maxVal === 0) {
    return 0;
  }

  return getVal(maxVal);
}

export function getYMin(points: number[][]): number {
  const minVal = Math.min(...points.flat());
  if (minVal === 0) {
    return minVal;
  }

  return getVal(minVal);
}

export function formatXLabels(label: string) {
  return DateTime.fromISO(label).toFormat('MMM yy');
}
