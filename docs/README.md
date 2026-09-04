# X.A.V.I.E.R. Documentation

Welcome to the official documentation for **X.A.V.I.E.R.** (RevenueGuard). 

X.A.V.I.E.R. is an orchestrator that operates much like a state machine or workflow engine, specifically tailored for e-commerce payment failure recovery. It uses LLMs to diagnose cryptic bank error codes, routes traffic around degraded gateways, and dispatches hyper-personalized recovery nudges to customers based on their Lifetime Value (LTV).

## Table of Contents

### Getting Started
* [Installation](getting-started/installation.md) - Exact server and client setup.
* [Configuration](getting-started/configuration.md) - Full, verified `.env` reference.
* [Quickstart](getting-started/quickstart.md) - Run both servers and trigger the agent end-to-end.

### Architecture
* [Overview](architecture/overview.md) - High-level system diagram and component summary.
* [Agent Pipeline](architecture/agent-pipeline.md) - The transaction lifecycle through the orchestrator.
* [Governance](architecture/governance.md) - Kill switches, spend limits, and escalation rules.
* [Data Model](architecture/data-model.md) - Schemas for transactions and audit entries.

### API Reference
* [REST Endpoints](api-reference/rest-endpoints.md) - All FastAPI routes, methods, and payloads.
* [Realtime Events](api-reference/realtime-events.md) - SSE event types and payload shapes.

### Frontend
* [Overview](frontend/overview.md) - Pages, routing, and component layout.
* [Data Flow](frontend/data-flow.md) - How React hooks and SSE drive the dashboard.

### Development
* [Project Structure](development/project-structure.md) - Annotated repository tree.
* [Troubleshooting](development/troubleshooting.md) - Common setup and runtime errors.
* [Extending X.A.V.I.E.R.](development/extending.md) - Adding new strategies and actions.

* [FAQ](../faq.md)
* [Glossary](../glossary.md)
* [Contributing](../contributing.md)
