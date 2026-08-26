const { v4: uuidv4 } = require('uuid');

const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank'];
const BINS = ['431522', '414709', '512345', '552199', '601100', '462134'];
const FAILURE_REASONS = [
  'CARD_EXPIRED',
  'INSUFFICIENT_FUNDS',
  'BANK_DECLINE',
  'NETWORK_ERROR',
  'FRAUD_SUSPECTED',
  'MANDATE_REVOKED',
  'CHECKOUT_FRICTION',
  'PRICE_SHOCK'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransaction(overrides = {}) {
  const type = Math.random() > 0.5 ? 'subscription' : 'one-time';
  const amount = Math.floor(Math.random() * 50000) + 500; // ₹500 to ₹50,500
  
  // Create a realistic failure code/status mapping
  let status = 'success';
  let errorCode = null;
  let stage = type === 'one-time' ? 'checkout' : 'recurring';
  
  // Decide if this should be a failure (30% failure rate for seed data)
  if (Math.random() < 0.3) {
    if (type === 'one-time' && Math.random() < 0.5) {
      status = 'abandoned';
      stage = 'checkout';
      errorCode = 'CHECKOUT_ABANDONED';
    } else {
      status = 'failed';
      errorCode = randomChoice(FAILURE_REASONS);
    }
  }

  const transaction = {
    id: `txn_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
    amount: amount,
    currency: 'INR',
    type: type,
    status: status,
    stage: stage,
    errorCode: errorCode,
    bank: randomChoice(BANKS),
    cardBin: randomChoice(BINS),
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Last 7 days
    customerInfo: {
      historySummary: Math.random() > 0.8 ? 'NEW_CUSTOMER' : 'RETURNING_CUSTOMER',
      previousAttempts: status === 'failed' ? Math.floor(Math.random() * 3) : 0
    },
    ...overrides
  };

  return transaction;
}

function generateBatch(size = 100) {
  const batch = [];
  for (let i = 0; i < size; i++) {
    batch.push(generateTransaction());
  }
  return batch;
}

module.exports = {
  generateTransaction,
  generateBatch
};
