# Data Model

X.A.V.I.E.R. currently relies on an in-memory data store for speed and simplicity during the MVP phase. 

> **Important Caveat:** Because the `TransactionStore` (`server/app/data/transaction_store.py`) is held entirely in memory as a Python dictionary, **all data is lost when the server restarts**. For production environments, this module must be refactored to connect to PostgreSQL or Redis.

## Transaction Schema

When a payment failure is reported via a webhook, it is normalized into the following dictionary structure:

```python
{
    "id": "txn_abcdef12345678",        # Unique internal ID
    "razorpayPaymentId": "pay_...",    # Gateway reference ID
    "amount": 5000,                    # Amount in integer (e.g., INR, not paise)
    "currency": "INR",
    "status": "failed",                # Current gateway status
    "agentStatus": "RECOVERED",        # Current X.A.V.I.E.R. orchestrator status
    "timestamp": "1710000000.123",
    "paymentMethod": "card",
    "bankName": "HDFC",
    "gateway": "Razorpay",
    "customerInfo": {
        "id": "user@example.com",
        "phone": "+919999999999",
        "isRepeat": False,
        "previousAttempts": 1,
        "ltv": 50000                   # Lifetime value (used for tiering)
    },
    "errorDetails": {
        "code": "BAD_REQUEST",
        "reason": "payment_failed",
        "message": "Insufficient funds"
    },
    "riskType": "PAYMENT_FAILURE",     # Injected by the Detector
    "customerTier": "REGULAR",         # Injected by the Orchestrator
    "fallbackUrl": "http://...",       # Injected by the Strategy Executor
    "recoveredVia": "LINK_CONVERSION"  # Injected upon recovery
}
```

## Audit Entry Schema

The `AuditLogger` (`server/app/audit/audit_logger.py`) records actions taken by the agent. These are also stored in-memory.

```python
{
    "id": "log_a1b2c3d4",
    "transactionId": "txn_abcdef12345678",
    "timestamp": "2024-03-10T12:00:00Z",
    "action": "SEND_RECOVERY_EMAIL",
    "status": "Success",
    "details": "Sent nudge email via Resend"
}
```
