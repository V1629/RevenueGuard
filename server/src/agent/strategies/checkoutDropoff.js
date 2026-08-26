const nudge = require('../actions/nudge');
const routeSwitch = require('../actions/routeSwitch');

/**
 * Checkout Drop-off Recovery Strategy
 * 
 * When a customer abandons checkout:
 * 1. Diagnose likely cause (friction, price shock, distraction)
 * 2. Send context-aware recovery nudge
 * 3. Offer simplified checkout or alternate payment method
 * 4. If price shock, optionally offer value reminder
 */
class CheckoutDropoff {
  async execute(transaction, diagnosis) {
    const actions = [];
    let recovered = false;
    let amountRecovered = 0;
    let reason = '';

    const failureReason = diagnosis.failureReason;

    switch (failureReason) {
      case 'PRICE_SHOCK': {
        // Step 1: Value reminder nudge
        const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'VALUE_REMIND' });
        actions.push({ step: 1, ...nudgeResult });
        if (nudgeResult.recovered) {
          recovered = true;
          amountRecovered = nudgeResult.amountRecovered;
          break;
        }

        // Step 2: Simplified checkout link
        const simplifyResult = await this._simplifiedCheckout(transaction);
        actions.push({ step: 2, ...simplifyResult });
        if (simplifyResult.recovered) {
          recovered = true;
          amountRecovered = simplifyResult.amountRecovered;
        } else {
          reason = 'Price shock — customer did not respond to value reminder or simplified checkout';
        }
        break;
      }

      case 'CHECKOUT_FRICTION':
      default: {
        // Step 1: Send simplified checkout link
        const simplifyResult = await this._simplifiedCheckout(transaction);
        actions.push({ step: 1, ...simplifyResult });
        if (simplifyResult.recovered) {
          recovered = true;
          amountRecovered = simplifyResult.amountRecovered;
          break;
        }

        // Step 2: Nudge with friendly tone
        const nudgeResult = await nudge.execute(transaction, { ...diagnosis, suggestedStrategy: 'SIMPLIFY_RETRY' });
        actions.push({ step: 2, ...nudgeResult });
        if (nudgeResult.recovered) {
          recovered = true;
          amountRecovered = nudgeResult.amountRecovered;
          break;
        }

        // Step 3: Suggest alternate payment method
        const switchResult = routeSwitch.execute(transaction, diagnosis);
        actions.push({ step: 3, ...switchResult });
        if (switchResult.recovered) {
          recovered = true;
          amountRecovered = switchResult.amountRecovered;
        } else {
          reason = 'Checkout dropout: simplified link, nudge, and alt method all exhausted';
        }
        break;
      }
    }

    return {
      recovered,
      amountRecovered,
      escalated: false,
      reason,
      actions,
      cost: actions.length * 0.3,
      strategyUsed: `CHECKOUT_RECOVERY:${failureReason}`,
    };
  }

  async _simplifiedCheckout(transaction) {
    // Simulate sending a simplified one-tap checkout link
    await new Promise(resolve => setTimeout(resolve, 500));

    const recovered = Math.random() < 0.35;
    return {
      action: 'SIMPLIFIED_CHECKOUT',
      link: `https://pay.example.com/quick/${(transaction.id || '').slice(-8)}`,
      recovered,
      amountRecovered: recovered ? transaction.amount : 0,
      reasoning: recovered
        ? 'Customer completed purchase via simplified one-tap checkout link'
        : 'Simplified checkout link sent, awaiting customer action',
    };
  }
}

module.exports = new CheckoutDropoff();
