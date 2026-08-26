const routeSwitch = require('../actions/routeSwitch');
const escalate = require('../actions/escalate');

/**
 * Payment Degradation Recovery Strategy
 * 
 * When success rates drop for a specific bank/BIN/overall:
 * 1. If severity is MEDIUM → monitor and retry with route switch
 * 2. If severity is HIGH → route switch + alert merchant
 * 3. If severity is CRITICAL → escalate to human
 */
class PaymentDegradation {
  async execute(transaction, diagnosis) {
    const actions = [];
    let recovered = false;
    let amountRecovered = 0;
    let escalated = false;
    let reason = '';

    const severity = diagnosis.severity || this._assessSeverity(transaction.successRate);

    switch (severity) {
      case 'CRITICAL': {
        const escResult = escalate.execute(transaction, diagnosis,
          `Critical payment degradation: ${transaction.dimension}=${transaction.dimensionValue} at ${(transaction.successRate * 100).toFixed(1)}%`
        );
        actions.push({ step: 1, action: 'ALERT_MERCHANT', severity, ...escResult });
        escalated = true;
        reason = `Critical degradation on ${transaction.dimension} — requires immediate human intervention`;
        break;
      }

      case 'HIGH': {
        // Route switch + alert
        const switchResult = routeSwitch.execute(
          { ...transaction, paymentMethod: 'card' },
          diagnosis
        );
        actions.push({
          step: 1,
          action: 'ROUTE_SWITCH',
          severity,
          recommendation: `Route away from ${transaction.dimensionValue}`,
          ...switchResult,
        });

        // Simulate partial recovery from routing
        const routeRecoveryRate = 0.4 + Math.random() * 0.3;
        amountRecovered = Math.floor((transaction.failedAmount || transaction.amount || 0) * routeRecoveryRate);
        recovered = amountRecovered > 0;

        actions.push({
          step: 2,
          action: 'MERCHANT_ALERT',
          message: `Payment success rate for ${transaction.dimension}=${transaction.dimensionValue} has dropped to ${(transaction.successRate * 100).toFixed(1)}%. Automatic route switching enabled.`,
        });

        reason = recovered
          ? `Routed around degradation, recovered ₹${amountRecovered}`
          : 'Route switch applied but recovery pending';
        break;
      }

      case 'MEDIUM':
      default: {
        // Monitor + light route switch
        actions.push({
          step: 1,
          action: 'MONITOR',
          severity,
          message: `Monitoring ${transaction.dimension}=${transaction.dimensionValue} (${(transaction.successRate * 100).toFixed(1)}% success rate)`,
        });

        const switchResult = routeSwitch.execute(
          { ...transaction, paymentMethod: 'card' },
          diagnosis
        );
        actions.push({ step: 2, action: 'ROUTE_SWITCH', ...switchResult });

        const recoveryRate = 0.2 + Math.random() * 0.3;
        amountRecovered = Math.floor((transaction.failedAmount || transaction.amount || 0) * recoveryRate);
        recovered = amountRecovered > 0;
        reason = 'Monitoring and light route switching applied';
        break;
      }
    }

    return {
      recovered,
      amountRecovered,
      escalated,
      reason,
      actions,
      cost: actions.length * 0.2,
      strategyUsed: `DEGRADATION_RECOVERY:${severity}`,
    };
  }

  _assessSeverity(successRate) {
    if (!successRate || successRate < 0.5) return 'CRITICAL';
    if (successRate < 0.7) return 'HIGH';
    return 'MEDIUM';
  }
}

module.exports = new PaymentDegradation();
