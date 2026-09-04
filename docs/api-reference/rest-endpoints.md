# REST Endpoints

The X.A.V.I.E.R. orchestrator runs a FastAPI server (`server/app/api/routes.py`). Below is the complete reference of all exposed endpoints.

## Core Agent API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | **[SSE]** Opens a Server-Sent Events stream for real-time orchestrator updates. |
| `GET` | `/api/transactions` | Returns a list of all transactions currently held in the in-memory store. |
| `POST` | `/api/agent/run-batch` | **Body:** `{ transactions: list }`. Feeds transactions into the orchestrator pipeline concurrently. |
| `POST` | `/api/agent/seed` | Wipes the current store and populates it with 3 mock failed transactions (for testing). |

## Data & Analytics API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/metrics/summary` | Returns aggregated metrics: total transactions, success rate, AI recovery count, active fallback strategies. |
| `GET` | `/api/audit/entries` | Returns the complete chronological audit log of all decisions made by the agent. |
| `GET` | `/api/gateway/health` | Returns current latencies and uptime statuses for Razorpay and Stripe. |

## Governance API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/governance/status` | Returns the current state of the Kill Switch, daily spend limits, and active escalation rules. |
| `POST` | `/api/governance/kill-switch` | **Body:** `{ active: bool }`. Instantly halts or resumes all autonomous agent operations. |

## Payment Gateway Integrations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/payment/create-order` | **Body:** `{ amount: int }`. Generates a Razorpay `order_id` for checkout. |
| `POST` | `/api/payment/create-stripe-session`| **Body:** `{ amount: int }`. Generates a Stripe Checkout session ID (used when Razorpay is degraded). |
| `POST` | `/api/webhooks/razorpay` | Listens for `payment.failed` webhook events from Razorpay to automatically trigger the orchestrator. |
| `POST` | `/api/payment/report-failure` | **Body:** `{ razorpay_payment_id: str, amount: int, error_code: str, ... }`. Directly reports a failure from the frontend and triggers the agent. |
| `GET` | `/api/recover/{txn_id}` | The recovery link dispatched to customers via email/SMS. Clicking it marks the transaction as recovered. |
