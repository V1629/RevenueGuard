const EventEmitter = require('events');

class Detector extends EventEmitter {
  constructor() {
    super();
    this.degradationThreshold = 0.85; // 85% success rate threshold
    this.windowSizeMs = 60 * 60 * 1000; // 1-hour sliding window
    this.minSampleSize = 5; // minimum txns in a window to evaluate
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

    // Sliding-window degradation detection across multiple dimensions
    const degradations = this.detectDegradation(transactionBatch);
    for (const deg of degradations) {
      flagged.push(deg);
      this.emit('flagged', deg);
    }

    return flagged;
  }

  /**
   * Sliding-window degradation detection.
   * Groups transactions by bank and BIN, calculates success rates
   * per dimension, and flags when any dimension drops below threshold.
   */
  detectDegradation(batch) {
    const degradations = [];
    const now = Date.now();

    // Filter to recent window
    const recentTxns = batch.filter(txn => {
      const txnTime = new Date(txn.timestamp).getTime();
      return (now - txnTime) <= this.windowSizeMs;
    });

    if (recentTxns.length < this.minSampleSize) return degradations;

    // Analyze by multiple dimensions
    const dimensions = [
      { name: 'bank', keyFn: txn => txn.bank },
      { name: 'cardBin', keyFn: txn => txn.cardBin },
    ];

    for (const dim of dimensions) {
      const groups = this._groupBy(recentTxns, dim.keyFn);

      for (const [key, txns] of Object.entries(groups)) {
        if (txns.length < this.minSampleSize) continue;

        const successCount = txns.filter(t => t.status === 'success').length;
        const successRate = successCount / txns.length;

        if (successRate < this.degradationThreshold) {
          degradations.push({
            id: `deg_${dim.name}_${key}_${Date.now()}`,
            riskType: 'DEGRADATION_DETECTED',
            dimension: dim.name,
            dimensionValue: key,
            successRate: Math.round(successRate * 100) / 100,
            sampleSize: txns.length,
            failedAmount: txns
              .filter(t => t.status === 'failed')
              .reduce((sum, t) => sum + t.amount, 0),
            timestamp: new Date().toISOString(),
            status: 'detected',
            amount: txns.reduce((sum, t) => sum + t.amount, 0),
          });
        }
      }
    }

    // Overall success rate check
    const overallSuccess = recentTxns.filter(t => t.status === 'success').length / recentTxns.length;
    if (overallSuccess < this.degradationThreshold) {
      degradations.push({
        id: `deg_overall_${Date.now()}`,
        riskType: 'DEGRADATION_DETECTED',
        dimension: 'overall',
        dimensionValue: 'all',
        successRate: Math.round(overallSuccess * 100) / 100,
        sampleSize: recentTxns.length,
        failedAmount: recentTxns
          .filter(t => t.status === 'failed')
          .reduce((sum, t) => sum + t.amount, 0),
        timestamp: new Date().toISOString(),
        status: 'detected',
        amount: recentTxns.reduce((sum, t) => sum + t.amount, 0),
      });
    }

    return degradations;
  }

  _groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
      const key = keyFn(item);
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }
}

module.exports = new Detector();
