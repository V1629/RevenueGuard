# Contributing

We welcome contributions to X.A.V.I.E.R.! Whether it's adding support for a new payment gateway, tweaking the LLM prompts, or polishing the UI.

## Process

1. **Fork and Branch:** Create a fork and branch off of `main`.
2. **Develop:** Follow the setup instructions in the [Installation Guide](getting-started/installation.md) to test your changes locally.
3. **Verify:** Ensure that your changes do not break the orchestrator pipeline. Test the Agent Terminal via the Dashboard.
4. **Pull Request:** Submit a PR with a clear description of the problem solved or feature added.

## Coding Conventions

- **Python (Backend):** 
  - We use standard `PEP 8`.
  - All asynchronous orchestrator logic should remain non-blocking.
  - Do not introduce blocking HTTP calls inside `app/agent/actions.py` without `await` or `asyncio.to_thread`.
- **React (Frontend):** 
  - Functional components with hooks only.
  - Follow the existing Tailwind-like inline styles or `index.css` classes.
  - Never mutate `useSSE` events array directly.
