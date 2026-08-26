class TransactionStore {
  constructor() {
    this.transactions = new Map();
  }

  addTransaction(transaction) {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  addTransactions(transactions) {
    transactions.forEach(txn => this.addTransaction(txn));
  }

  getTransaction(id) {
    return this.transactions.get(id);
  }

  updateTransaction(id, updates) {
    const txn = this.getTransaction(id);
    if (!txn) return null;
    const updatedTxn = { ...txn, ...updates };
    this.transactions.set(id, updatedTxn);
    return updatedTxn;
  }

  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  getTransactionsByStatus(status) {
    return this.getAllTransactions().filter(txn => txn.status === status);
  }

  clear() {
    this.transactions.clear();
  }
}

const transactionStore = new TransactionStore();

module.exports = transactionStore;
