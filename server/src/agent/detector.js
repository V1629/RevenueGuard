const EventEmitter = require('events');

class Detector extends EventEmitter {
  constructor() {
    super();
    this.degradationThreshold = 0.85; // 85% success rate threshold
  }

  detect(transactionBatch) {
    const flagged = [];
    
    for (const txn of transactionBatch) {
      let riskType = null;
      
      if (txn.status === 'failed' && txn.type === 'subscription') {
        riskType = 'SUBSCRIPTION_FAILURE';
      } else if (txn.status === 'failed') {
        riskType = 'FAILED_PAYMENT';
      } else if (txn.status === 'abandoned' && txn.stage === 'checkout') {
        riskType = 'CHECKOUT_DROPOUT';
      }

      if (riskType) {
        const flaggedTxn = { ...txn, riskType };
        flagged.push(flaggedTxn);
        this.emit('flagged', flaggedTxn);
      }
    }

    // Task 2.2 placeholder (to be implemented by Opus)
    // this.detectDegradation(transactionBatch, flagged);

    return flagged;
  }
}

module.exports = new Detector();
