# Frontend Data Flow

X.A.V.I.E.R.'s dashboard is designed to feel alive. It achieves this by combining traditional REST polling on page load with instantaneous Server-Sent Events (SSE) for ongoing operations.

## The `useSSE` Hook

The heart of the frontend's real-time capability is `client/src/hooks/useSSE.js`.

When a component (like `AgentPage.jsx`) mounts, it initializes this hook:
```javascript
const { events, connected } = useSSE('http://localhost:3001/api/events');
```

1. The hook opens a persistent `EventSource` connection to the backend.
2. As the Orchestrator processes transactions, it pushes JSON payloads through this pipe.
3. The hook appends these payloads to the `events` state array, which triggers a React re-render.
4. `AgentTerminal.jsx` instantly displays the new log line.

## Dashboard Data Flow

The `DashboardPage.jsx` aggregates data using a hybrid approach:

1. **Initial Mount:** It fires REST `GET` requests to `/api/metrics/summary` and `/api/gateway/health` to populate the initial UI state.
2. **SSE Listener:** It opens an `EventSource` connection. 
3. **Reactive Updates:** If it receives an event like `RECOVERED` or `BATCH_COMPLETE`, it knows the underlying metrics have changed. Instead of trying to calculate the new metrics on the client-side, it simply re-fires the `GET /api/metrics/summary` REST call to fetch the freshest source-of-truth from the backend.

> **Note:** This pattern (SSE for triggers, REST for state) ensures the UI is always perfectly in sync with the backend, even if an SSE packet drops during a momentary network interruption.
