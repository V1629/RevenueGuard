# Project Structure

X.A.V.I.E.R. follows a clear client-server monorepo structure.

## Root Level
```text
X.A.V.I.E.R./
├── client/           # React frontend (Vite)
├── server/           # FastAPI Python backend
├── docs/             # This documentation
├── package.json      # NPM workspace config (if used)
└── README.md         # Landing page
```

## Backend (`server/`)
The backend follows a domain-driven structure under `server/app/`.

```text
server/
├── app/
│   ├── agent/        # Core AI agent logic
│   │   ├── actions.py         # Specific recovery implementations (Stripe fallback, Resend)
│   │   ├── detector.py        # Gateway degradation monitoring
│   │   ├── diagnoser.py       # LLM inference logic
│   │   ├── orchestrator.py    # The state machine Pipeline
│   │   └── strategies.py      # Logic mapping diagnosis to actions
│   ├── ai/           # LLM clients and prompts
│   │   ├── groq_client.py
│   │   └── prompts.py
│   ├── api/          # FastAPI Routes and SSE logic
│   │   ├── routes.py
│   │   └── sse_manager.py
│   ├── audit/        # Immutable action logging
│   │   └── audit_logger.py
│   ├── data/         # In-memory data store
│   │   └── transaction_store.py
│   └── governance/   # Guardrails and spend limits
│       └── rules.py
├── main.py           # FastAPI application entry point
├── requirements.txt  # Python dependencies
└── .env              # Environment variables (see docs)
```

## Frontend (`client/`)
Standard Vite React structure with custom CSS.

```text
client/
├── public/           # Static assets (favicons)
├── src/
│   ├── components/   # Reusable UI widgets
│   │   ├── Agent/    # Terminal and simulation controls
│   │   ├── Dashboard/# Charts and metrics
│   │   ├── Landing/  # Marketing elements
│   │   └── Layout/   # Navbar, Sidebar, Toast
│   ├── hooks/        # Custom React hooks (e.g., useSSE)
│   ├── pages/        # Top-level route components
│   ├── styles/       # Tailwind + custom CSS (index.css)
│   ├── App.jsx       # React Router setup
│   └── main.jsx      # React DOM entry
├── package.json      # Client dependencies
└── vite.config.js    # Vite builder config
```
