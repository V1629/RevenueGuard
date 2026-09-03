# X.A.V.I.E.R. Architecture

X.A.V.I.E.R. is an intelligent, autonomous multi-agent system designed to recover failed payments and abandoned checkouts using AI-driven root cause diagnosis and personalized recovery strategies.

## System Components

### 1. The Detection Engine (`detector.js`)
Acts as the sensory layer for the agent. It monitors incoming transactions from the payment gateway and identifies anomalies.
- **Rule-Based Detection**: Flags hard failures immediately (e.g., card declined, high friction).
- **Statistical Degradation Detection**: Uses a 1-hour sliding window to calculate success rates by Bank and Card BIN. If the success rate drops below a threshold, it emits a `DEGRADATION_DETECTED` event, triggering the orchestrator.

### 2. The AI Diagnoser (`diagnoser.js` + `groqClient.js`)
Once a transaction or pattern is detected, the Diagnoser determines *why* it failed and *how* to fix it.
- **Groq Llama-3 API**: Fast, intelligent reasoning on the failure context.
- **Heuristic Fallback**: A local `HEURISTIC_MAP` provides deterministic routing if the AI API fails (e.g., API key errors, rate limits).
- **Output**: A structured diagnosis containing the failure reason, a confidence score, and a recommended recovery strategy.

### 3. The Recovery Orchestrator (`orchestrator.js`)
The central state machine that manages the lifecycle of a recovery attempt.
- **States**: `DETECTED` → `DIAGNOSING` → `EXECUTING` → (`SUCCEEDED` | `STOPPED` | `ESCALATED`)
- **Strategy Routing**: Based on the AI diagnosis, it delegates execution to specific Strategy Handlers (e.g., Subscription, Checkout Drop-off).

### 4. Strategy Handlers (`strategies/`)
Complex, multi-step workflows tailored to specific failure types.
- **CheckoutDropoff**: Attempts a simplified checkout link, followed by personalized nudges (SMS/Email).
- **PaymentDegradation**: Routes the transaction to alternative payment processors or alternative payment methods (e.g., UPI instead of Credit Card).
- **SubscriptionRecovery**: Smart retries over an optimal window, escalating to personalized outreach if retries fail.

### 5. Action Handlers (`actions/`)
Atomic recovery actions used by the Strategy Handlers.
- `smartRetry`: Probabilistic retry logic simulating gateway interactions.
- `nudge`: Uses AI to generate personalized, empathetic messaging (or falls back to templates).
- `routeSwitch`: Changes the payment method or processor.
- `escalate`: Packages the context for a human agent.

### 6. The Governance Layer (`governance/`)
Ensures the AI agent operates safely, within compliance, and without wasting resources.
- **Escalation Rules**: High-value transactions or suspected fraud are immediately escalated to humans.
- **Stopping Rules**: Enforces limits like maximum retries (max 3), RBI mandate compliance, or customer opt-outs to prevent harassment.
- **Spend Limits**: Tracks the cost of recovery actions (e.g., SMS fees, gateway retry fees) and halts the agent if the daily budget is exceeded.
- **Kill Switch**: A manual override allowing operators to halt all new agent activity instantly.

### 7. Audit Logger (`auditLogger.js`)
An immutable record of every decision made by the agent. Crucial for compliance, debugging, and performance review.

### 8. The API & Real-time Layer (`routes.js`, `sseManager.js`)
- Provides REST endpoints for metrics, governance controls, and manual agent triggers.
- Server-Sent Events (SSE) stream agent activity (diagnoses, decisions, executions) directly to the frontend for real-time monitoring.

## Application Architecture

- **Backend**: Node.js, Express (Monorepo setup in `/server`)
- **Frontend**: React, Vite, Framer-motion, Anime.js, Vanilla CSS (in `/client`)
- **State/Data**: In-memory data stores simulating a production database. Can be easily swapped for PostgreSQL/MongoDB by implementing the data interfaces.
