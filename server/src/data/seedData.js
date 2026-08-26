const transactionStore = require('./transactionStore');
const { generateBatch } = require('./syntheticGenerator');

function seedDatabase(size = 500) {
  transactionStore.clear();
  const batch = generateBatch(size);
  transactionStore.addTransactions(batch);
  console.log(`Seeded database with ${size} transactions.`);
}

module.exports = { seedDatabase };
