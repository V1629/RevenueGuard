DIAGNOSTIC_SYSTEM_PROMPT = """You are the X.A.V.I.E.R. agent, an expert payment failure diagnostician for the Indian digital payments ecosystem.

You have access to a curated Knowledge Base (KB) of documented payment failure patterns with historical recovery data. Use the provided KB evidence to ground your diagnosis. Do NOT ignore the KB entries — they contain real-world success rates and RBI compliance guidelines.

Your task:
1. Read the transaction data carefully
2. Study the matching Knowledge Base entries provided
3. Combine the KB evidence with your own reasoning to produce a diagnosis
4. If the KB recommends a strategy, prefer it unless you have strong reason to deviate

You MUST respond in valid JSON format matching this exact schema:
{
  "reason": "Clear, specific explanation of why this payment failed",
  "confidence": 0-100 (integer, higher if KB match is strong),
  "strategy": "One of: SUBSCRIPTION_RECOVERY, PAYMENT_DEGRADATION, CHECKOUT_DROPOFF",
  "riskFactors": ["list", "of", "contributing", "factors"],
  "recommendedAction": "Specific, actionable next step to recover this payment",
  "optimalRetryWindow": "immediate, 1h, 4h, 24h, or none",
  "knowledgeBaseMatch": "The KB entry ID that most closely matches (e.g., KB-001), or null if no match"
}

Strategy Selection Guidelines (from KB patterns):
- INSUFFICIENT_FUNDS, RISK_REJECT, EXPIRED_CARD, mandate/subscription failures -> SUBSCRIPTION_RECOVERY
- GATEWAY_TIMEOUT, PROCESSOR_DOWN, NETWORK_ERROR, routing/settlement failures -> PAYMENT_DEGRADATION
- USER_ABANDONED, 3DS_FAILED, OTP_TIMEOUT, PAGE_CRASH, session/checkout friction -> CHECKOUT_DROPOFF
"""

def generate_diagnostic_prompt(transaction, kb_context=""):
    """
    Build the user prompt for diagnosis.
    Now accepts an optional kb_context string containing formatted KB entries.
    """
    base = f"""## Transaction Data
- Transaction ID: {transaction['id']}
- Amount: ₹{transaction['amount']} {transaction.get('currency', 'INR')}
- Gateway: {transaction.get('gateway', 'Unknown')}
- Bank: {transaction.get('bankName', 'Unknown')}
- Payment Method: {transaction.get('paymentMethod', 'Unknown')}
- Customer Is Repeat: {transaction.get('customerInfo', {}).get('isRepeat', False)}
- Previous Failed Attempts: {transaction.get('customerInfo', {}).get('previousAttempts', 0)}
- Device: {transaction.get('metadata', {}).get('device', 'Unknown')}

## Error Details
- Error Code: {transaction.get('errorDetails', {}).get('code', 'N/A')}
- Error Reason: {transaction.get('errorDetails', {}).get('reason', 'N/A')}
- Error Message: {transaction.get('errorDetails', {}).get('message', 'N/A')}"""

    if kb_context:
        base += f"""

## Relevant Knowledge Base Entries
The following are the most relevant historical failure patterns from our curated database. Use these as evidence to inform your diagnosis:

{kb_context}"""

    base += """

## Task
Analyze this payment failure using both the transaction data and the knowledge base evidence above. Return your JSON diagnosis."""

    return base

NUDGE_SYSTEM_PROMPT = """You are a highly empathetic, high-converting customer success agent.
Write a personalized SMS/Email nudge to recover an abandoned or failed checkout.
Keep it under 160 characters if possible. Be helpful, not pushy.

You MUST respond in valid JSON format matching this schema:
{
  "content": "The actual message text",
  "tone": "empathetic, urgent, or helpful",
  "channel": "sms or email"
}"""

def generate_nudge_prompt(context):
    return f"""Customer ID: {context.get('customer_id')}
Failure Reason: {context.get('reason')}
Amount: {context.get('amount')}
Context: {context.get('context_string')}

Write a recovery nudge for this specific situation."""
