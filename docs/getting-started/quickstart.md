# Quickstart

Once you have completed the [Installation](installation.md) and [Configuration](configuration.md), you can see X.A.V.I.E.R. in action end-to-end.

## 1. Run the Stack
Ensure both the FastAPI backend and the Vite frontend are running:
- **Terminal 1**: `cd server && source venv/bin/activate && uvicorn main:app --port 3001 --reload`
- **Terminal 2**: `cd client && npm run dev`

## 2. Seed Data
Open the **Dashboard** at `http://localhost:5173/dashboard`. To give the agent something to analyze, we provide a Batch Simulator.
1. Click on the **Agent Status** tab in the sidebar (or navigate to `/agent`).
2. At the top of the Agent Terminal, click **Seed Mock Data**.
   *This fires a request to `GET /api/agent/seed`, wiping the in-memory store and populating it with 3 sample transactions.*

## 3. Trigger the Agent
In the same Agent Terminal, click **Run Batch Simulation**.
*This fires a request to `POST /api/agent/run-batch`. The backend will instantly feed the 3 seeded transactions into the `Orchestrator`.*

## 4. Observe the Flow
As the Orchestrator runs, you will see real-time SSE events stream into the Agent Terminal:
1. `DETECTED`: The agent acknowledges the failure.
2. `CUSTOMER_SEGMENTED`: The agent calculates LTV (e.g., VIP, REGULAR, NEW).
3. `EXECUTING`: The LLM diagnoses the issue and selects a strategy (e.g., `CHECKOUT_DROPOFF`).
4. `RECOVERED` or `ESCALATED`: The final outcome of the transaction.

You can verify the final state of all transactions by checking the **Audit Logs** at `/audit`.
