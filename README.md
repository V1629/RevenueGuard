# X.A.V.I.E.R.

X.A.V.I.E.R. is an autonomous AI agent system that detects payment failures, diagnoses the root cause using Llama-3 (via Groq), and orchestrates personalized recovery strategies — all bound by strict operational guardrails (Governance Layer).

Built for the **Google Deepmind Advanced Agentic Coding Assessment**.

## Features
- **Intelligent Diagnosis**: Fast AI reasoning via Groq with local heuristic fallback.
- **State Machine Orchestrator**: Deterministic lifecycle management of automated recoveries.
- **Robust Governance**: Built-in escalation rules, stopping rules, daily spend limits, and a Kill Switch.
- **Real-Time Dashboard**: Monitor the agent's thought process, actions, and recovery funnel live via SSE.
- **Premium UI**: Framer-motion, Anime.js, and dark-mode glassmorphism styling.

## Getting Started

### 1. Install Dependencies
Ensure you have Node.js v18+ installed.

```bash
# In the root directory
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables
You need a Groq API key for the AI diagnosis engine.

Create a `.env` file in the `server` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
NODE_ENV=development
```

### 3. Run the Application

You need two terminal windows to run both the client and the server.

**Terminal 1 (Backend Server):**
```bash
cd server
source venv/bin/activate
uvicorn main:app --port 3001 --reload
```
*The server will start on http://localhost:3001 and automatically seed 500 test transactions.*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*The React app will start on http://localhost:5173.*

### 4. Using the System
1. Open the UI at `http://localhost:5173`.
2. Navigate to the **Agent Console** via the sidebar.
3. Use the **Batch Simulator** to trigger the agent.
4. Watch the Activity Feed as the agent detects failures, queries the AI for a diagnosis, and executes recovery strategies.
5. Check the **Dashboard** to see the Recovery Funnel and Metrics update in real-time.
6. Visit **Governance** to view active guardrails and toggle the Kill Switch.
7. Visit **Audit Trail** to see the immutable log of every agent action and governance check.

## Architecture

Please see [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive into the system design, agent layers, and state machine.
