/**
 * Stopping Rules Engine
 * 
 * Determines when the agent should STOP pursuing a recovery —
 * prevents harassment, wasted resources, and compliance violations.
 * 
 * Rules are evaluated with short-circuit logic: first match stops.
 */

const RULES = [
  {
    id: 'MAX_RETRIES',
    name: 'Maximum Retries Exceeded',
    condition: (ctx) => ctx.previousAttempts >= 3,
    reason: 'Maximum of 3 retry attempts reached — further retries unlikely to succeed',
  },
  {
    id: 'LOW_RECOVERABILITY',
    name: 'Low Recoverability Score',
    condition: (ctx) => ctx.diagnosis.recoverabilityScore < 15,
    reason: 'Recoverability score below 15% — recovery not worth the cost',
  },
  {
    id: 'CUSTOMER_OPTOUT',
    name: 'Customer Opted Out',
    condition: (ctx) => ctx.transaction.customerOptedOut === true,
    reason: 'Customer has explicitly opted out of recovery attempts',
  },
  {
    id: 'RECOVERY_WINDOW_EXPIRED',
    name: 'Recovery Window Expired',
    condition: (ctx) => {
      const txnDate = new Date(ctx.transaction.timestamp);
      const daysSince = (Date.now() - txnDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    },
    reason: 'Transaction is older than 7 days — recovery window expired',
  },
  {
    id: 'MANDATE_COMPLIANCE',
    name: 'RBI Mandate Compliance',
    condition: (ctx) => {
      // Per RBI rules, cannot auto-retry after mandate revocation
      return ctx.diagnosis.failureReason === 'MANDATE_REVOKED' && ctx.previousAttempts >= 1;
    },
    reason: 'RBI compliance: mandate revoked, cannot retry after initial nudge',
  },
];

class StoppingRules {
  constructor() {
    this.rules = RULES;
    this.stopCount = 0;
  }

  /**
   * Evaluate stopping rules. Short-circuits on first match.
   */
  shouldStop(context) {
    for (const rule of this.rules) {
      try {
        if (rule.condition(context)) {
          this.stopCount++;
          return {
            shouldStop: true,
            rule: rule.id,
            ruleName: rule.name,
            reason: rule.reason,
          };
        }
      } catch (err) {
        console.warn(`[StoppingRules] Error evaluating rule ${rule.id}:`, err.message);
      }
    }

    return { shouldStop: false };
  }

  getRules() {
    return this.rules.map(r => ({
      id: r.id,
      name: r.name,
      reason: r.reason,
    }));
  }

  getStats() {
    return { totalStopped: this.stopCount };
  }

  reset() {
    this.stopCount = 0;
  }
}

module.exports = new StoppingRules();
