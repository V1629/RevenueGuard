const groqClient = require('../ai/groqClient');
const { buildDiagnosisPrompt, buildDegradationPrompt } = require('../ai/prompts');

/**
 * Heuristic fallback — rule-based diagnosis when AI is unavailable.
 * Maps error codes to failure reasons, recoverability scores, and strategies.
 */
const HEURISTIC_MAP = {
  CARD_EXPIRED: {
    failureReason: 'CARD_EXPIRED',
    recoverabilityScore: 75,
    reasoning: 'Card has expired. Customer likely has a replacement card. Recovery depends on customer engagement.',
    suggestedStrategy: 'NUDGE_UPDATE',
    confidence: 90,
    riskFactors: ['Customer may have churned', 'New card may be with different bank'],
  },
  INSUFFICIENT_FUNDS: {
    failureReason: 'INSUFFICIENT_FUNDS',
    recoverabilityScore: 65,
    reasoning: 'Account has insufficient funds. Smart retry after salary credit window (typically 1st or last week of month) has highest success rate.',
    suggestedStrategy: 'SMART_RETRY',
    confidence: 85,
    riskFactors: ['Persistent low balance', 'Customer financial distress'],
  },
  BANK_DECLINE: {
    failureReason: 'BANK_DECLINE',
    recoverabilityScore: 50,
    reasoning: 'Issuing bank declined the transaction. Could be temporary bank-side issue or permanent block. Suggest alternate payment method.',
    suggestedStrategy: 'ALT_METHOD',
    confidence: 60,
    riskFactors: ['Bank may have blocked merchant', 'Card may be restricted'],
  },
  NETWORK_ERROR: {
    failureReason: 'NETWORK_ERROR',
    recoverabilityScore: 90,
    reasoning: 'Transient network failure — high probability of success on immediate retry. This is not a customer issue.',
    suggestedStrategy: 'IMMEDIATE_RETRY',
    confidence: 95,
    riskFactors: ['Persistent infrastructure issue'],
  },
  FRAUD_SUSPECTED: {
    failureReason: 'FRAUD_SUSPECTED',
    recoverabilityScore: 15,
    reasoning: 'Transaction flagged by risk engine. Must be escalated for manual review — automated recovery is not appropriate.',
    suggestedStrategy: 'ESCALATE',
    confidence: 80,
    riskFactors: ['Actual fraud', 'False positive blocking legitimate customer'],
  },
  MANDATE_REVOKED: {
    failureReason: 'MANDATE_REVOKED',
    recoverabilityScore: 30,
    reasoning: 'Customer has revoked the auto-debit mandate. Recovery requires gentle re-engagement — one-time payment link or win-back offer.',
    suggestedStrategy: 'GENTLE_NUDGE',
    confidence: 85,
    riskFactors: ['Customer intentionally cancelled', 'Regulatory restriction'],
  },
  CHECKOUT_ABANDONED: {
    failureReason: 'CHECKOUT_FRICTION',
    recoverabilityScore: 55,
    reasoning: 'Customer abandoned checkout. Could be UX friction, price shock, or distraction. A simplified retry link may recover the purchase.',
    suggestedStrategy: 'SIMPLIFY_RETRY',
    confidence: 50,
    riskFactors: ['Customer lost interest', 'Competitor purchase', 'Price sensitivity'],
  },
  CHECKOUT_FRICTION: {
    failureReason: 'CHECKOUT_FRICTION',
    recoverabilityScore: 55,
    reasoning: 'Checkout experience friction detected. Simplified payment flow may recover this transaction.',
    suggestedStrategy: 'SIMPLIFY_RETRY',
    confidence: 50,
    riskFactors: ['UX issues', 'Payment method unavailability'],
  },
  PRICE_SHOCK: {
    failureReason: 'PRICE_SHOCK',
    recoverabilityScore: 40,
    reasoning: 'Customer likely experienced sticker shock at final price (with taxes/fees). Value reminder or limited discount may help.',
    suggestedStrategy: 'VALUE_REMIND',
    confidence: 45,
    riskFactors: ['True price sensitivity', 'Competitor offering better price'],
  },
};

class Diagnoser {
  constructor() {
    this.useAI = groqClient.isConfigured();
  }

  /**
   * Diagnose a flagged transaction.
   * Attempts AI diagnosis first, falls back to heuristics on failure.
   */
  async diagnose(transaction) {
    if (transaction.riskType === 'DEGRADATION_DETECTED') {
      return this._diagnoseDegradation(transaction);
    }

    // Try AI diagnosis first
    if (this.useAI) {
      try {
        const aiDiagnosis = await this._aiDiagnose(transaction);
        return {
          ...aiDiagnosis,
          source: 'ai',
          transactionId: transaction.id,
        };
      } catch (err) {
        console.warn(`[Diagnoser] AI diagnosis failed for ${transaction.id}, falling back to heuristics:`, err.message);
      }
    }

    // Heuristic fallback
    return this._heuristicDiagnose(transaction);
  }

  async _aiDiagnose(transaction) {
    const prompt = buildDiagnosisPrompt(transaction);

    const response = await groqClient.chat(
      [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      { jsonMode: true, temperature: 0.2 }
    );

    try {
      const diagnosis = JSON.parse(response.content);
      return {
        ...diagnosis,
        optimalRetryWindow: diagnosis.optimalRetryWindow || this._calculateRetryWindow(diagnosis.failureReason),
        riskFactors: diagnosis.riskFactors || [],
      };
    } catch (parseErr) {
      console.error('[Diagnoser] Failed to parse AI response:', response.content);
      throw new Error('AI response was not valid JSON');
    }
  }

  async _diagnoseDegradation(degradation) {
    if (this.useAI) {
      try {
        const prompt = buildDegradationPrompt(degradation);
        const response = await groqClient.chat(
          [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          { jsonMode: true, temperature: 0.2 }
        );
        const analysis = JSON.parse(response.content);
        return {
          ...analysis,
          source: 'ai',
          transactionId: degradation.id,
          failureReason: 'DEGRADATION',
          recoverabilityScore: analysis.severity === 'CRITICAL' ? 30 : analysis.severity === 'HIGH' ? 50 : 70,
          suggestedStrategy: analysis.suggestedAction,
        };
      } catch (err) {
        console.warn('[Diagnoser] AI degradation analysis failed:', err.message);
      }
    }

    // Heuristic degradation diagnosis
    const severity = degradation.successRate < 0.5 ? 'CRITICAL' : degradation.successRate < 0.7 ? 'HIGH' : 'MEDIUM';
    return {
      rootCause: `Payment success rate dropped to ${(degradation.successRate * 100).toFixed(1)}% for ${degradation.dimension}=${degradation.dimensionValue}`,
      severity,
      suggestedStrategy: severity === 'CRITICAL' ? 'ESCALATE' : 'ROUTE_SWITCH',
      reasoning: `Detected ${severity.toLowerCase()} degradation in ${degradation.dimension}. ${degradation.sampleSize} transactions analyzed.`,
      failureReason: 'DEGRADATION',
      recoverabilityScore: severity === 'CRITICAL' ? 30 : severity === 'HIGH' ? 50 : 70,
      confidence: 70,
      source: 'heuristic',
      transactionId: degradation.id,
    };
  }

  _heuristicDiagnose(transaction) {
    const errorCode = transaction.errorCode || 'UNKNOWN';
    const heuristic = HEURISTIC_MAP[errorCode];

    if (heuristic) {
      return {
        ...heuristic,
        optimalRetryWindow: this._calculateRetryWindow(heuristic.failureReason),
        source: 'heuristic',
        transactionId: transaction.id,
      };
    }

    // Unknown error — conservative approach
    return {
      failureReason: 'UNKNOWN',
      recoverabilityScore: 30,
      reasoning: `Unknown error code "${errorCode}". Taking conservative approach with alternate payment method suggestion.`,
      suggestedStrategy: 'ALT_METHOD',
      optimalRetryWindow: null,
      confidence: 20,
      riskFactors: ['Unknown failure mode', 'Cannot determine recoverability'],
      source: 'heuristic',
      transactionId: transaction.id,
    };
  }

  /**
   * Calculate optimal retry window based on failure reason.
   * Uses Indian salary cycle patterns (1st and last week of month).
   */
  _calculateRetryWindow(failureReason) {
    const now = new Date();

    switch (failureReason) {
      case 'INSUFFICIENT_FUNDS': {
        // Retry near salary credit — 1st or 28th of month
        const dayOfMonth = now.getDate();
        const retryDate = new Date(now);
        if (dayOfMonth < 15) {
          // Closer to start of month — wait for potential mid-month credit
          retryDate.setDate(Math.min(dayOfMonth + 3, 28));
        } else {
          // Closer to end — wait for next month's salary
          retryDate.setMonth(retryDate.getMonth() + 1);
          retryDate.setDate(2); // 2nd of next month
        }
        retryDate.setHours(10, 0, 0, 0); // 10 AM IST
        return retryDate.toISOString();
      }
      case 'NETWORK_ERROR':
        // Retry in 5 minutes
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      case 'BANK_DECLINE':
        // Retry next day at a different time
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'CARD_EXPIRED':
        // No auto-retry — wait for customer action
        return null;
      default:
        return null;
    }
  }
}

module.exports = new Diagnoser();
