# Agent Pipeline

The X.A.V.I.E.R. Orchestrator operates as a sophisticated state machine. Every failed transaction passes through a strict, linear pipeline defined in `server/app/agent/orchestrator.py`.

## The Transaction Lifecycle

```mermaid
sequenceDiagram
    participant Webhook as Gateway Webhook
    participant Orch as Orchestrator
    participant Gov as Governance
    participant Diag as Diagnoser (LLM)
    participant Strat as Strategy Executor
    participant Audit as Audit Log & SSE

    Webhook->>Orch: Report Failed Transaction
    Orch->>Orch: 1. Detection Phase (Track Degradation)
    
    Orch->>Gov: 2. Governance Check
    alt Kill switch or Budget Exceeded
        Gov-->>Orch: HALT
        Orch->>Audit: Broadcast STOPPED
    else Escalate (High Value / Fraud)
        Gov-->>Orch: ESCALATE
        Orch->>Audit: Broadcast ESCALATED
    else Proceed
        Gov-->>Orch: OK
    end
    
    Orch->>Diag: 3. Diagnosis Phase
    Diag-->>Orch: Return Recovery Strategy
    
    Orch->>Orch: 4. Customer Segmentation (VIP/REGULAR/NEW)
    Orch->>Audit: Broadcast CUSTOMER_SEGMENTED
    
    Orch->>Strat: 5. Dispatch Notification & Execute Strategy
    Strat-->>Orch: Return Outcome (Success/Failed)
    
    alt Success
        Orch->>Audit: Log Action & Broadcast RECOVERED
    else Failed
        Orch->>Audit: Log Action & Broadcast STOPPED
    end
```

## Pipeline Stages Explained

1. **Detection Phase:** The transaction is analyzed for immediate gateway degradation patterns.
2. **Governance Check:** Before calling expensive LLMs or APIs, X.A.V.I.E.R. checks the `Governance` module to ensure kill switches are off and budgets are intact.
3. **Diagnosis Phase:** The transaction details are fed into the LLM, which determines the root cause.
4. **Customer Segmentation:** The customer's LTV is evaluated to determine if they get white-glove treatment (VIP) or automated nudges.
5. **Strategy Execution:** The selected strategy is executed. This usually involves generating a personalized recovery link and dispatching an email via Resend.
6. **Outcome:** The final state is written to the in-memory store and broadcast to the dashboard.
