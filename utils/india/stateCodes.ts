const GST_STATE_CODES: Record<string, string> = {
  'jammu and kashmir': '01',
  'himachal pradesh': '02',
  'punjab': '03',
  'chandigarh': '04',
  'uttarakhand': '05',
  'haryana': '06',
  'delhi': '07',
  'nct of delhi': '07',
  'national capital territory of delhi': '07',
  'rajasthan': '08',
  'uttar pradesh': '09',
  'bihar': '10',
  'sikkim': '11',
  'arunachal pradesh': '12',
  'nagaland': '13',
  'manipur': '14',
  'mizoram': '15',
  'tripura': '16',
  'meghalaya': '17',
  'assam': '18',
  'west bengal': '19',
  'jharkhand': '20',
  'odisha': '21',
  'orissa': '21',
  'chhattisgarh': '22',
  'madhya pradesh': '23',
  'gujarat': '24',
  'dadra and nagar haveli and daman and diu': '26',
  'daman and diu': '25',
  'dadra and nagar haveli': '26',
  'maharashtra': '27',
  'andhra pradesh': '28',
  'karnataka': '29',
  'goa': '30',
  'lakshadweep': '31',
  'kerala': '32',
  'tamil nadu': '33',
  'puducherry': '34',
  'pondicherry': '34',
  'andaman and nicobar islands': '35',
  'telangana': '36',
  'andhra pradesh (new)': '37',
  'ladakh': '38',
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('&', 'and')
    .replaceAll(/[^a-z\s]/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

export function getIndiaGSTStateCode(stateOrPlaceOfSupply?: string | null) {
  if (!stateOrPlaceOfSupply) {
    return null;
  }

  const normalized = normalize(stateOrPlaceOfSupply);
  return GST_STATE_CODES[normalized] ?? null;
}
