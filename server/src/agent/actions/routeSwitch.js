/**
 * Route Switch — Suggest alternate payment methods when primary fails.
 */
const ALT_METHODS = {
  card: ['UPI', 'Net Banking', 'EMI', 'Wallet'],
  upi: ['Card', 'Net Banking', 'Wallet'],
  netbanking: ['UPI', 'Card', 'Wallet'],
  wallet: ['UPI', 'Card', 'Net Banking'],
  default: ['UPI', 'Card', 'Net Banking', 'Wallet'],
};

class RouteSwitch {
  execute(transaction, diagnosis) {
    const currentMethod = transaction.paymentMethod || 'card';
    const alternatives = ALT_METHODS[currentMethod] || ALT_METHODS.default;

    // Pick the best alternative based on amount
    let recommended;
    if (transaction.amount < 2000) {
      recommended = alternatives.includes('UPI') ? 'UPI' : alternatives[0];
    } else if (transaction.amount > 20000) {
      recommended = alternatives.includes('EMI') ? 'EMI' : alternatives.includes('Net Banking') ? 'Net Banking' : alternatives[0];
    } else {
      recommended = alternatives[0];
    }

    const recovered = Math.random() < 0.35;

    return {
      action: 'ROUTE_SWITCH',
      currentMethod,
      recommended,
      alternatives,
      recovered,
      amountRecovered: recovered ? transaction.amount : 0,
      reasoning: recovered
        ? `Customer switched to ${recommended} — payment recovered`
        : `Suggested ${recommended} as alternative to ${currentMethod}. Awaiting customer action.`,
    };
  }
}

module.exports = new RouteSwitch();
