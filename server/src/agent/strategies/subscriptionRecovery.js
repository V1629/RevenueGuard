const smartRetry = require('../actions/smartRetry');
const nudge = require('../actions/nudge');
const routeSwitch = require('../actions/routeSwitch');
const escalate = require('../actions/escalate');

/**
 * Subscription Recovery Strategy
 * 
 * Multi-step recovery workflow for failed subscription payments:
 * 1. Based on failure reason, pick initial action
 * 2. If initial action fails, try next action in chain
 * 3. After all actions exhausted, escalate or stop
 * 
 * Strategy chains:
 * - CARD_EXPIRED:      Nudge → Route Switch → Escalate
 * - INSUFFICIENT_FUNDS: Smart Retry (×3) → Nudge → Stop  
 * - NETWORK_ERROR:     Immediate Retry (×3) → Done
 * - BANK_DECLINE:      Route Switch → Nudge → Escalate
 * - MANDATE_REVOKED:   Gentle Nudge → Stop
 * - FRAUD_SUSPECTED:   Escalate immediately
 */
class SubscriptionRecovery {
  async execute(transaction, diagnosis) {
    const actions = [];
    let recovered = false;
    let amountRecovered = 0;
    let escalated = false;
    let reason = '';

    const failureReason = diagnosis.failureReason;

    switch (failureReason) {
      case 'CARD_EXPIRED': {
        // Step 1: Nudge customer to update card
        const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'NUDGE_UPDATE' });
        actions.push({ step: 1, ...nudgeResult });
        if (nudgeResult.recovered) {
          recovered = true;
          amountRecovered = nudgeResult.amountRecovered;
          break;
        }

        // Step 2: Suggest alternate payment method
        const switchResult = routeSwitch.execute(transaction, diagnosis);
        actions.push({ step: 2, ...switchResult });
        if (switchResult.recovered) {
          recovered = true;
          amountRecovered = switchResult.amountRecovered;
          break;
        }

        // Step 3: Escalate
        const escResult = escalate.execute(transaction, diagnosis, 'Card expired, nudge and alt method failed');
        actions.push({ step: 3, ...escResult });
        escalated = true;
        reason = 'All automated recovery methods exhausted for expired card';
        break;
      }

      case 'INSUFFICIENT_FUNDS': {
        // Try smart retry up to 3 times with salary-cycle-aware timing
        for (let attempt = 1; attempt <= 3; attempt++) {
          const retryResult = await smartRetry.execute(transaction, diagnosis, attempt);
          actions.push({ step: attempt, ...retryResult });
          if (retryResult.success) {
            recovered = true;
            amountRecovered = transaction.amount;
            break;
          }
        }

        // If retries failed, send a gentle nudge
        if (!recovered) {
          const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'GENTLE_NUDGE' });
          actions.push({ step: 4, ...nudgeResult });
          if (nudgeResult.recovered) {
            recovered = true;
            amountRecovered = nudgeResult.amountRecovered;
          } else {
            reason = 'Insufficient funds: retries and nudge exhausted';
          }
        }
        break;
      }

      case 'NETWORK_ERROR': {
        // Immediate retry — high success probability
        for (let attempt = 1; attempt <= 3; attempt++) {
          const retryResult = await smartRetry.execute(transaction, { ...diagnosis, suggestedStrategy: 'IMMEDIATE_RETRY' }, attempt);
          actions.push({ step: attempt, ...retryResult });
          if (retryResult.success) {
            recovered = true;
            amountRecovered = transaction.amount;
            break;
          }
        }
        if (!recovered) {
          reason = 'Network error persists after 3 immediate retries';
        }
        break;
      }

      case 'BANK_DECLINE': {
        // Step 1: Try alternate payment method
        const switchResult = routeSwitch.execute(transaction, diagnosis);
        actions.push({ step: 1, ...switchResult });
        if (switchResult.recovered) {
          recovered = true;
          amountRecovered = switchResult.amountRecovered;
          break;
        }

        // Step 2: Nudge customer
        const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'GENTLE_NUDGE' });
        actions.push({ step: 2, ...nudgeResult });
        if (nudgeResult.recovered) {
          recovered = true;
          amountRecovered = nudgeResult.amountRecovered;
          break;
        }

        // Step 3: Escalate
        const escResult = escalate.execute(transaction, diagnosis, 'Bank decline, alt method and nudge failed');
        actions.push({ step: 3, ...escResult });
        escalated = true;
        reason = 'Bank decline: all automated methods exhausted';
        break;
      }

      case 'MANDATE_REVOKED': {
        // Gentle nudge only — do not retry automatically (RBI compliance)
        const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'GENTLE_NUDGE' });
        actions.push({ step: 1, ...nudgeResult });
        if (nudgeResult.recovered) {
          recovered = true;
          amountRecovered = nudgeResult.amountRecovered;
        } else {
          reason = 'Mandate revoked — customer did not respond to gentle nudge';
        }
        break;
      }

      case 'FRAUD_SUSPECTED': {
        // Escalate immediately — never retry fraud-flagged transactions
        const escResult = escalate.execute(transaction, diagnosis, 'Fraud suspected — immediate escalation required');
        actions.push({ step: 1, ...escResult });
        escalated = true;
        reason = 'Fraud suspected — escalated for manual review';
        break;
      }

      default: {
        // Generic: try retry then nudge
        const retryResult = await smartRetry.execute(transaction, diagnosis, 1);
        actions.push({ step: 1, ...retryResult });
        if (retryResult.success) {
          recovered = true;
          amountRecovered = transaction.amount;
        } else {
          const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'GENTLE_NUDGE' });
          actions.push({ step: 2, ...nudgeResult });
          if (nudgeResult.recovered) {
            recovered = true;
            amountRecovered = nudgeResult.amountRecovered;
          } else {
            reason = `Recovery exhausted for ${failureReason}`;
          }
        }
        break;
      }
    }

    return {
      recovered,
      amountRecovered,
      escalated,
      reason,
      actions,
      cost: actions.length * 0.5, // Simulated cost per action
      strategyUsed: `SUBSCRIPTION_RECOVERY:${failureReason}`,
    };
  }
}

module.exports = new SubscriptionRecovery();
