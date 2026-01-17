import { Fyo } from 'fyo';

export type TaxType = 'GST' | 'IGST' | 'Exempt-GST' | 'Exempt-IGST';

export async function createIndianRecords(fyo: Fyo) {
  await createTaxes(fyo);
  await createTDSSections(fyo);
  await createTDSCategories(fyo);
}

async function createTaxes(fyo: Fyo) {
  const GSTs = {
    GST: [28, 18, 12, 5, 3],
    IGST: [28, 18, 12, 5, 3],
    'Exempt-GST': [0],
    'Exempt-IGST': [0],
  };

  for (const type of Object.keys(GSTs)) {
    for (const percent of GSTs[type as TaxType]) {
      const name = `${type}-${percent}`;
      const details = getTaxDetails(type as TaxType, percent);

      const newTax = fyo.doc.getNewDoc('Tax', { name, details });
      await newTax.sync();
    }
  }
}

function getTaxDetails(type: TaxType, percent: number) {
  if (type === 'GST') {
    return [
      {
        account: 'CGST',
        rate: percent / 2,
      },
      {
        account: 'SGST',
        rate: percent / 2,
      },
    ];
  }

  return [
    {
      account: type.toString().split('-')[0],
      rate: percent,
    },
  ];
}

async function createTDSSections(fyo: Fyo) {
  const tdsSections = [
    {
      name: '194C',
      description: 'Payment to contractors and sub-contractors',
      rate: 1,
      rateWithoutPan: 20,
      threshold: 30000,
      cumulativeThreshold: 100000,
      isActive: true,
    },
    {
      name: '194J',
      description:
        'Fee for professional or technical services, royalty, and non-compete fee',
      rate: 10,
      rateWithoutPan: 20,
      threshold: 30000,
      cumulativeThreshold: 0,
      isActive: true,
    },
    {
      name: '194H',
      description: 'Commission or brokerage',
      rate: 5,
      rateWithoutPan: 20,
      threshold: 15000,
      cumulativeThreshold: 0,
      isActive: true,
    },
    {
      name: '194I',
      description: 'Rent - Plant & Machinery',
      rate: 2,
      rateWithoutPan: 20,
      threshold: 240000,
      cumulativeThreshold: 0,
      isActive: true,
    },
    {
      name: '194I-Land',
      description: 'Rent - Land or Building',
      rate: 10,
      rateWithoutPan: 20,
      threshold: 240000,
      cumulativeThreshold: 0,
      isActive: true,
    },
    {
      name: '194A',
      description: 'Interest other than interest on securities',
      rate: 10,
      rateWithoutPan: 20,
      threshold: 5000,
      cumulativeThreshold: 0,
      isActive: true,
    },
  ];

  for (const section of tdsSections) {
    if (await fyo.db.exists('TDSSection', section.name)) {
      continue;
    }

    const newSection = fyo.doc.getNewDoc('TDSSection', section);
    await newSection.sync();
  }
}

async function createTDSCategories(fyo: Fyo) {
  const tdsCategories = [
    {
      name: 'Contractor Payment',
      tdsSection: '194C',
      notes: 'Payments to contractors for work contracts',
    },
    {
      name: 'Professional Services',
      tdsSection: '194J',
      notes: 'Fees for professional or technical services',
    },
    {
      name: 'Commission',
      tdsSection: '194H',
      notes: 'Commission or brokerage payments',
    },
    {
      name: 'Rent - Machinery',
      tdsSection: '194I',
      notes: 'Rent for plant and machinery',
    },
    {
      name: 'Rent - Property',
      tdsSection: '194I-Land',
      notes: 'Rent for land or building or both',
    },
    {
      name: 'Interest Payment',
      tdsSection: '194A',
      notes: 'Interest payments (other than interest on securities)',
    },
  ];

  for (const category of tdsCategories) {
    if (await fyo.db.exists('TDSCategory', category.name)) {
      continue;
    }

    const newCategory = fyo.doc.getNewDoc('TDSCategory', category);
    await newCategory.sync();
  }
}
