# Glossary

- **Agent Status:** The current state of a transaction within the X.A.V.I.E.R. pipeline (e.g., `DETECTED`, `EXECUTING`, `RECOVERED`, `STOPPED`, `ESCALATED`).
- **Diagnoser:** The component responsible for feeding error codes and context into the LLM to determine the true cause of failure.
- **Gateway Degradation:** When a payment provider (like Razorpay) experiences systemic downtime or high latency. X.A.V.I.E.R. detects this across multiple transactions and starts auto-routing to fallbacks (like Stripe).
- **LTV (Lifetime Value):** The total amount of money a customer has spent historically. X.A.V.I.E.R. uses this to classify customers into tiers (VIP, REGULAR, NEW) to determine how aggressively to pursue recovery.
- **Orchestrator:** The central state machine in the backend that governs the flow of a transaction from detection to outcome.
- **SSE (Server-Sent Events):** A unidirectional protocol used to stream real-time JSON updates from the backend to the frontend Agent Terminal.
- **Strategy:** A predefined tactical plan (e.g., `SUBSCRIPTION_RECOVERY`, `CHECKOUT_DROPOFF`) selected by the LLM and executed by the Orchestrator.
