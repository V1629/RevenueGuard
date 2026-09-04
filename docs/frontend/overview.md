# Frontend Overview

The client-side of X.A.V.I.E.R. is built using React, Vite, and Tailwind-based custom CSS styling (`client/src/styles`). It uses `react-router-dom` for routing and Framer Motion for complex animations.

## Page Routing Map

The application router is defined in `client/src/App.jsx`.

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/` | `LandingPage.jsx` | The marketing and public-facing landing page containing the Hero and Feature Grid. |
| `/dashboard` | `DashboardPage.jsx` | The main command center displaying aggregated metrics and gateway health. |
| `/agent` | `AgentPage.jsx` | The "Agent Terminal" view, displaying real-time SSE logs of the orchestrator analyzing transactions. |
| `/audit` | `AuditPage.jsx` | A historical, chronological log of every action taken by the AI. |
| `/settings` | `SettingsPage.jsx` | Governance controls (Kill Switch, budget limits). |
| `/store` | `StorePage.jsx` | A mock e-commerce storefront used to test the Razorpay integration and intentionally trigger failures. |

## Component Architecture

All reusable UI elements reside in `client/src/components/`.

- **`/Layout`**: Contains the `Sidebar.jsx`, `Header.jsx`, and `NotificationToast.jsx`. All internal pages (everything except `/`) are wrapped in `AppLayout` which persists these elements across route changes.
- **`/Dashboard`**: Contains localized visual components like `MetricsCards.jsx` and `GatewayHealth.jsx`.
- **`/Agent`**: Contains `AgentTerminal.jsx` (the UI for the scrolling terminal logs) and `BatchSimulator.jsx` (the buttons to seed data and trigger tests).
- **`/Landing`**: Components specific to the root path (Hero, architecture diagrams, bento boxes).
