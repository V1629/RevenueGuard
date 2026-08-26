const groqClient = require('../../ai/groqClient');
const { buildNudgePrompt } = require('../../ai/prompts');

/**
 * Recovery Nudge — Generate and simulate sending personalized recovery messages.
 * Uses AI for personalization when available, falls back to templates.
 */

const TEMPLATES = {
  NUDGE_UPDATE: {
    sms: 'Hi! Your card on file has expired. Update it in 30 seconds to continue your subscription: {link}',
    emailSubject: 'Quick action needed — update your payment method',
    emailBody: 'We noticed your card ending in {last4} has expired. To avoid any interruption to your subscription, please update your payment method. It only takes 30 seconds.',
    tone: 'FRIENDLY',
  },
  GENTLE_NUDGE: {
    sms: 'We miss you! Complete your payment of ₹{amount} with this secure link: {link}',
    emailSubject: 'Complete your payment — we\'ve saved your cart',
    emailBody: 'Your recent transaction of ₹{amount} couldn\'t be completed. We\'ve saved everything for you — just click below to finish in one tap.',
    tone: 'EMPATHETIC',
  },
  SIMPLIFY_RETRY: {
    sms: 'Your order of ₹{amount} is waiting! Pay securely in 1 tap: {link}',
    emailSubject: 'Your order is saved — complete checkout',
    emailBody: 'You were so close! Your order of ₹{amount} is still saved. We\'ve simplified the checkout — just one tap to complete your purchase.',
    tone: 'FRIENDLY',
  },
  VALUE_REMIND: {
    sms: '₹{amount} — your {product} subscription saves you {savings}/yr. Continue? {link}',
    emailSubject: 'Don\'t miss out on your savings',
    emailBody: 'Your subscription of ₹{amount} offers significant value. Here\'s what you\'d be getting — and what you\'d miss without it.',
    tone: 'PROFESSIONAL',
  },
};

class Nudge {
  async execute(transaction, diagnosis) {
    const strategy = diagnosis.suggestedStrategy;
    let nudgeContent;

    // Try AI-generated nudge first
    if (groqClient.isConfigured()) {
      try {
        const prompt = buildNudgePrompt(transaction, strategy);
        const response = await groqClient.chat(
          [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          { jsonMode: true, temperature: 0.6 }
        );
        nudgeContent = JSON.parse(response.content);
        nudgeContent.source = 'ai';
      } catch (err) {
        console.warn('[Nudge] AI nudge generation failed, using template:', err.message);
      }
    }

    // Fallback to template
    if (!nudgeContent) {
      const template = TEMPLATES[strategy] || TEMPLATES.GENTLE_NUDGE;
      nudgeContent = {
        sms: template.sms
          .replace('{amount}', transaction.amount)
          .replace('{link}', 'https://pay.example.com/r/' + (transaction.id || '').slice(-8))
          .replace('{last4}', (transaction.cardBin || '0000').slice(-4)),
        emailSubject: template.emailSubject,
        emailBody: template.emailBody
          .replace('{amount}', transaction.amount)
          .replace('{last4}', (transaction.cardBin || '0000').slice(-4)),
        tone: template.tone,
        source: 'template',
        includesIncentive: false,
      };
    }

    // Simulate sending (in production: actual SMS/email API calls)
    const sendResult = {
      smsDelivered: Math.random() > 0.1, // 90% delivery rate
      emailDelivered: Math.random() > 0.05, // 95% delivery rate
    };

    // Simulate customer response (probabilistic)
    const responseProb = this._responseProb(strategy, transaction);
    const customerResponded = Math.random() < responseProb;

    return {
      action: 'NUDGE_SENT',
      nudgeContent,
      delivery: sendResult,
      customerResponded,
      recovered: customerResponded,
      amountRecovered: customerResponded ? transaction.amount : 0,
      reasoning: customerResponded
        ? `Customer responded to ${nudgeContent.tone.toLowerCase()} nudge — payment recovered`
        : `Nudge delivered but customer has not responded yet`,
    };
  }

  _responseProb(strategy, transaction) {
    const base = {
      NUDGE_UPDATE: 0.45,
      GENTLE_NUDGE: 0.25,
      SIMPLIFY_RETRY: 0.40,
      VALUE_REMIND: 0.30,
    };
    let prob = base[strategy] || 0.25;

    // Returning customers are more likely to respond
    if (transaction.customerInfo?.historySummary === 'RETURNING_CUSTOMER') {
      prob += 0.15;
    }

    return Math.min(prob, 0.8);
  }
}

module.exports = new Nudge();
