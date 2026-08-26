/**
 * Escalation Rules Engine
 * 
 * Evaluates whether a transaction should be escalated to a human
 * before the agent attempts automated recovery.
 * 
 * Rules are evaluated in priority order — first match wins.
 */

const RULES = [
  {
    id: 'HIGH_VALUE',
    name: 'High-Value Transaction',
    priority: 1,
    condition: (ctx) => ctx.transaction.amount > 50000,
    reason: 'Transaction amount exceeds ₹50,000 — requires human review',
  },
  {
    id: 'FRAUD_FLAG',
    name: 'Fraud Suspected',
    priority: 2,
    condition: (ctx) => ctx.diagnosis.failureReason === 'FRAUD_SUSPECTED',
    reason: 'Fraud suspected — automated recovery not appropriate',
  },
  {
    id: 'LOW_CONFIDENCE',
    name: 'Low AI Confidence',
    priority: 3,
    condition: (ctx) => ctx.diagnosis.confidence < 25,
    reason: 'AI confidence too low — diagnosis may be unreliable',
  },
  {
    id: 'REPEATED_ESCALATION',
    name: 'Repeated Escalations',
    priority: 4,
    condition: (ctx) => {
      // Check if this customer has been escalated before
      return ctx.transaction.customerInfo?.previousAttempts >= 3;
    },
    reason: 'Customer has 3+ previous failed attempts — escalating for personal attention',
  },
];

class EscalationRules {
  constructor() {
    this.rules = [...RULES].sort((a, b) => a.priority - b.priority);
    this.escalationCount = 0;
    this.escalationWindow = [];
  }

  /**
   * Evaluate all escalation rules against the current context.
   * Returns the first matching rule, or null if no rules match.
   */
  shouldEscalate(context) {
    // Meta-rule: if too many escalations in a short window, pause agent
    this._recordEscalationCheck();

    for (const rule of this.rules) {
      try {
        if (rule.condition(context)) {
          this.escalationCount++;
          return {
            shouldEscalate: true,
            rule: rule.id,
            ruleName: rule.name,
            reason: rule.reason,
          };
        }
      } catch (err) {
        console.warn(`[EscalationRules] Error evaluating rule ${rule.id}:`, err.message);
      }
    }

    return { shouldEscalate: false };
  }

  _recordEscalationCheck() {
    const now = Date.now();
    this.escalationWindow.push(now);
    // Keep only last hour
    this.escalationWindow = this.escalationWindow.filter(t => now - t < 3600000);
  }

  getRules() {
    return this.rules.map(r => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
      reason: r.reason,
    }));
  }

  getStats() {
    return {
      totalEscalations: this.escalationCount,
      recentEscalations: this.escalationWindow.length,
    };
  }

  reset() {
    this.escalationCount = 0;
    this.escalationWindow = [];
  }
}

module.exports = new EscalationRules();
