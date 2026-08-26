/**
 * Structured prompts for AI-powered payment diagnosis.
 * Each prompt is designed to extract structured JSON from the LLM
 * with failure classification, recoverability scoring, and strategy selection.
 */

const SYSTEM_PROMPT = `You are an expert payment recovery analyst working for an Indian fintech platform. 
You analyze failed payment transactions and diagnose the root cause with high accuracy.
You understand Indian banking infrastructure: UPI mandates, NACH/eNACH, RBI regulations on auto-debit, 
card network behaviors (Visa/Mastercard/RuPay), and common failure patterns across Indian issuing banks.

Your responses must ALWAYS be valid JSON matching the exact schema requested.
Never include explanatory text outside the JSON object.`;

function buildDiagnosisPrompt(transaction) {
  const { amount, type, errorCode, bank, cardBin, timestamp, customerInfo } = transaction;

  return {
    system: SYSTEM_PROMPT,
    user: `Analyze this failed payment transaction and provide a diagnosis:

TRANSACTION DETAILS:
- Amount: ₹${amount}
- Type: ${type} (${type === 'subscription' ? 'recurring charge' : 'one-time payment'})
- Failure Code: ${errorCode || 'UNKNOWN'}
- Issuing Bank: ${bank}
- Card BIN: ${cardBin}
- Timestamp: ${timestamp}
- Customer Type: ${customerInfo?.historySummary || 'UNKNOWN'}
- Previous Failed Attempts: ${customerInfo?.previousAttempts || 0}

Respond with this exact JSON structure:
{
  "failureReason": "one of: CARD_EXPIRED | INSUFFICIENT_FUNDS | BANK_DECLINE | NETWORK_ERROR | FRAUD_SUSPECTED | MANDATE_REVOKED | CHECKOUT_FRICTION | PRICE_SHOCK",
  "recoverabilityScore": <number 0-100, where 100 = highly recoverable>,
  "reasoning": "<2-3 sentence human-readable explanation of why you classified it this way and what signals you used>",
  "suggestedStrategy": "one of: SMART_RETRY | NUDGE_UPDATE | ALT_METHOD | IMMEDIATE_RETRY | ESCALATE | GENTLE_NUDGE | SIMPLIFY_RETRY | VALUE_REMIND",
  "optimalRetryWindow": "<ISO timestamp for best retry time, or null if not applicable>",
  "confidence": <number 0-100>,
  "riskFactors": ["<list of risk factors that could prevent recovery>"]
}`
  };
}

function buildDegradationPrompt(degradationData) {
  return {
    system: SYSTEM_PROMPT,
    user: `Analyze this payment degradation pattern:

DEGRADATION DETAILS:
- Dimension: ${degradationData.dimension} = ${degradationData.dimensionValue}
- Current Success Rate: ${(degradationData.successRate * 100).toFixed(1)}%
- Sample Size: ${degradationData.sampleSize} transactions
- Total Failed Amount: ₹${degradationData.failedAmount}

Respond with this exact JSON structure:
{
  "rootCause": "<most likely root cause of the degradation>",
  "severity": "one of: LOW | MEDIUM | HIGH | CRITICAL",
  "suggestedAction": "one of: ROUTE_SWITCH | RETRY_TIMING | ALERT_MERCHANT | MONITOR | ESCALATE",
  "reasoning": "<2-3 sentence explanation>",
  "estimatedRecoveryTime": "<estimated time for the issue to resolve, e.g., '2 hours', '1 day'>",
  "confidence": <number 0-100>
}`
  };
}

function buildNudgePrompt(transaction, strategy) {
  return {
    system: `You are a customer communication specialist for an Indian payments platform. 
Write empathetic, concise recovery messages in a professional yet friendly tone. 
The message should feel personal, not automated. Use Hinglish sparingly if the customer context suggests it.
Keep SMS messages under 160 characters. Keep email subjects under 60 characters.`,
    user: `Generate a recovery nudge for this transaction:

CONTEXT:
- Customer Type: ${transaction.customerInfo?.historySummary || 'RETURNING_CUSTOMER'}
- Amount: ₹${transaction.amount}
- Failure Reason: ${transaction.errorCode}
- Recovery Strategy: ${strategy}
- Previous Attempts: ${transaction.customerInfo?.previousAttempts || 0}

Respond with this exact JSON structure:
{
  "sms": "<SMS message, max 160 chars>",
  "emailSubject": "<email subject, max 60 chars>",
  "emailBody": "<email body, 2-3 sentences>",
  "tone": "one of: URGENT | FRIENDLY | EMPATHETIC | PROFESSIONAL",
  "includesIncentive": <boolean>,
  "incentiveDetails": "<if applicable, describe the incentive>"
}`
  };
}

module.exports = {
  SYSTEM_PROMPT,
  buildDiagnosisPrompt,
  buildDegradationPrompt,
  buildNudgePrompt,
};
