export function autoCategorize(description: string, type: 'Deposit' | 'Withdrawal') {
  const desc = description.toLowerCase();
  
  // Basic patterns for Indian Banks
  if (desc.includes('atm-wdl') || desc.includes('cash wdl') || desc.includes('cash-wdl')) {
    return { account: 'Cash' };
  }

  if (desc.includes('interest')) {
    return { account: type === 'Deposit' ? 'Interest Income' : 'Interest Expense' };
  }
  
  if (desc.includes('charges') || desc.includes('chgs')) {
    return { account: 'Bank Charges' };
  }

  if (desc.includes('pos wdl') || desc.includes('pos-wdl')) {
     // Often shopping/expenses
  }

  if (desc.includes('upi')) {
    // UPI transactions often have the recipient name
    // e.g., UPI-SMART-MART-1234@okaxis
    const upiMatch = description.match(/UPI-([^-]+)-/);
    if (upiMatch) {
       // Could try to lookup party by this name
    }
  }

  return {};
}

export function dedupeKey(date: string, description: string, amount: number, balance: number) {
    return `${date}|${description}|${amount}|${balance}`;
}
