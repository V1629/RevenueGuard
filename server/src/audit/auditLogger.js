const auditStore = require('./auditStore');

/**
 * Audit Logger — Structured logging for every agent action.
 * Every action includes: what happened, why, what governance checks passed/failed.
 */
class AuditLogger {
  log(transactionId, actionType, details = {}) {
    const entry = {
      transactionId,
      actionType,
      details,
      governanceContext: {
        killSwitchActive: false, // populated at log time
      },
    };

    return auditStore.addEntry(entry);
  }

  getByTransaction(transactionId) {
    return auditStore.getEntriesByTransactionId(transactionId);
  }

  getAll() {
    return auditStore.getEntries();
  }

  getSummary() {
    const entries = auditStore.getEntries();
    const byType = {};
    for (const entry of entries) {
      byType[entry.actionType] = (byType[entry.actionType] || 0) + 1;
    }
    return {
      totalEntries: entries.length,
      byActionType: byType,
      latestTimestamp: entries.length > 0 ? entries[entries.length - 1].timestamp : null,
    };
  }

  clear() {
    auditStore.clear();
  }
}

module.exports = new AuditLogger();
