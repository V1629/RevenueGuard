# Realtime Events (SSE)

X.A.V.I.E.R. utilizes Server-Sent Events (SSE) to push real-time state changes from the FastAPI backend to the React dashboard.

The client connects via `GET /api/events`. All events are broadcast by the `sse_manager` (`server/app/api/sse_manager.py`).

## Event Types

### `DETECTED`
Fired when a failed transaction enters the Orchestrator pipeline.
```json
{
  "type": "DETECTED",
  "transactionId": "txn_abcdef",
  "transaction": { /* Full transaction object */ }
}
```

### `CUSTOMER_SEGMENTED`
Fired when the Orchestrator categorizes the customer based on their Lifetime Value (LTV).
```json
{
  "type": "CUSTOMER_SEGMENTED",
  "transactionId": "txn_abcdef",
  "tier": "VIP | REGULAR | NEW",
  "ltv": 50000
}
```

### `EXECUTING`
Fired when the LLM has completed its diagnosis and selected a strategy.
```json
{
  "type": "EXECUTING",
  "transactionId": "txn_abcdef",
  "strategy": "CHECKOUT_DROPOFF"
}
```

### `RECOVERED`
Fired when a strategy successfully recovers a transaction (or a customer clicks the recovery link).
```json
{
  "type": "RECOVERED",
  "transactionId": "txn_abcdef",
  "amount": 5000,
  "action": "LINK_CONVERSION"
}
```

### `ESCALATED`
Fired by the Governance layer if a transaction exceeds safety thresholds (e.g., high value).
```json
{
  "type": "ESCALATED",
  "transactionId": "txn_abcdef",
  "reason": "Escalation rule triggered"
}
```

### `STOPPED`
Fired when a transaction is halted, either by the Kill Switch, budget exhaustion, or an exhausted recovery strategy.
```json
{
  "type": "STOPPED",
  "transactionId": "txn_abcdef",
  "reason": "Agent halted by kill switch"
}
```

### `BATCH_COMPLETE`
Fired when a multi-transaction batch finishes processing.
```json
{
  "type": "BATCH_COMPLETE",
  "results": {
    "detected": 3,
    "recovered": 2,
    "escalated": 1,
    "stopped": 0,
    "amountRecovered": 10000
  }
}
```

### `GOVERNANCE_UPDATE`
Fired asynchronously when system settings change (e.g., Kill Switch toggled).
```json
{
  "type": "GOVERNANCE_UPDATE",
  "killSwitchActive": true
}
```
