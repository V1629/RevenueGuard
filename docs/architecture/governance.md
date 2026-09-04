# Governance

The Governance layer (`server/app/governance/rules.py`) ensures that the autonomous agent operates safely and predictably.

## Core Protections

### 1. Global Kill Switch
An override toggle available via the API (`/api/governance/kill-switch`) and the UI dashboard. When active, all transactions are immediately halted in the `Orchestrator` before any LLM inference or strategy execution occurs.

### 2. Daily Spend Limits
To prevent runaway LLM costs or API charges, X.A.V.I.E.R. enforces a daily budget.
- **Current Default:** ₹1000.0 max daily spend.
- **Enforcement:** If `current_spend` exceeds `daily_budget`, the agent halts further processing.

### 3. Escalation Rules
Certain transactions are too sensitive for fully autonomous handling. The agent escalates these to human account managers.
- **High Value:** Transactions ≥ ₹50,000 are immediately escalated.
- **Critical Degradation:** If a system-wide gateway outage is detected, transactions are escalated to prevent spamming failing systems.
- **Fraud Suspicion:** If a customer has ≥ 4 previous failed attempts, they are flagged and escalated.

### 4. Stopping Rules
Rules that dictate when the agent should give up on a transaction.
- **Budget Exhaustion:** Stops when daily limits are hit.
- **Kill Switch:** Stops when manually halted.

## Modifying Defaults
To modify the thresholds (like the ₹50,000 escalation limit), you must directly edit the `Governance` class initialization in `server/app/governance/rules.py`.
