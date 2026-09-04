# Frequently Asked Questions (FAQ)

### What is X.A.V.I.E.R. actually doing?
It acts as a smart middleware. Instead of a payment failure just resulting in a generic "Payment Failed" UI, X.A.V.I.E.R. intercepts the failure, uses an LLM to understand *why* it failed, and then either routes the payment to a backup gateway or emails the user a personalized recovery link.

### Does X.A.V.I.E.R. store credit card data?
**No.** X.A.V.I.E.R. only receives the webhook/callback payload from your gateway (Razorpay/Stripe), which contains non-sensitive metadata (Error codes, Amount, Customer Email, Bank Name). It never sees or stores PANs (Primary Account Numbers) or CVVs.

### What happens if the Groq LLM goes down?
The `Diagnoser` catches the timeout/exception and falls back to a deterministic heuristic based on standard bank error codes, ensuring the orchestrator never stalls.

### Is the data persisted?
Currently, X.A.V.I.E.R. uses an in-memory dictionary for transaction state to enable zero-config local testing. For production deployments, you must swap `server/app/data/transaction_store.py` to use a database like PostgreSQL or Redis.
