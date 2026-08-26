class AuditStore {
  constructor() {
    this.entries = [];
  }

  addEntry(entry) {
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.entries.push(auditEntry);
    return auditEntry;
  }

  getEntries() {
    return this.entries;
  }

  getEntriesByTransactionId(transactionId) {
    return this.entries.filter(entry => entry.transactionId === transactionId);
  }

  clear() {
    this.entries = [];
  }
}

const auditStore = new AuditStore();

module.exports = auditStore;
