/**
 * Smart Retry — Intelligent retry with timing awareness.
 * Considers failure type, bank behavior patterns, and Indian salary cycles.
 */
class SmartRetry {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = {
      IMMEDIATE_RETRY: [5000, 30000, 180000],         // 5s, 30s, 3min
      SMART_RETRY: [3600000, 14400000, 86400000],     // 1hr, 4hr, 24hr
      DEFAULT: [60000, 300000, 900000],                // 1min, 5min, 15min
    };
  }

  /**
   * Simulate a retry attempt with probabilistic outcome.
   * In production, this would call Razorpay's retry API.
   */
  async execute(transaction, diagnosis, attemptNumber = 1) {
    const strategy = diagnosis.suggestedStrategy;
    const delays = this.retryDelays[strategy] || this.retryDelays.DEFAULT;

    if (attemptNumber > this.maxRetries) {
      return {
        success: false,
        action: 'RETRY_EXHAUSTED',
        reason: `Max retries (${this.maxRetries}) exceeded`,
        attemptNumber,
      };
    }

    // Simulate retry delay (shortened for demo)
    const delay = Math.min(delays[attemptNumber - 1] || 1000, 2000); // Cap at 2s for demo
    await new Promise(resolve => setTimeout(resolve, delay));

    // Calculate success probability based on diagnosis
    const successProb = this._calculateSuccessProb(diagnosis, attemptNumber);
    const succeeded = Math.random() < successProb;

    return {
      success: succeeded,
      action: succeeded ? 'RETRY_SUCCESS' : 'RETRY_FAILED',
      attemptNumber,
      delay,
      successProbability: Math.round(successProb * 100),
      reasoning: succeeded
        ? `Retry #${attemptNumber} succeeded — payment recovered`
        : `Retry #${attemptNumber} failed (${Math.round(successProb * 100)}% expected success rate)`,
    };
  }

  _calculateSuccessProb(diagnosis, attempt) {
    let baseProb = (diagnosis.recoverabilityScore || 50) / 100;

    // Adjust based on failure type
    switch (diagnosis.failureReason) {
      case 'NETWORK_ERROR':
        baseProb = Math.min(baseProb + 0.3, 0.95); // Very high on retry
        break;
      case 'INSUFFICIENT_FUNDS':
        baseProb = baseProb * (attempt === 1 ? 0.3 : attempt === 2 ? 0.5 : 0.7);
        break;
      case 'BANK_DECLINE':
        baseProb = baseProb * 0.4; // Lower success rate
        break;
      default:
        break;
    }

    // Decrease probability with each attempt (diminishing returns)
    baseProb = baseProb * Math.pow(0.85, attempt - 1);

    return Math.max(0.05, Math.min(baseProb, 0.95));
  }
}

module.exports = new SmartRetry();
