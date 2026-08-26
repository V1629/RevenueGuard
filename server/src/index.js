require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./api/routes');
const { errorHandler, requestLogger } = require('./api/middleware');
const { seedDatabase } = require('./data/seedData');
const orchestrator = require('./agent/orchestrator');
const sseManager = require('./api/sseManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    sseClients: sseManager.getClientCount(),
  });
});

// Error handler
app.use(errorHandler);

// Wire orchestrator events to SSE
orchestrator.onEvent((event) => {
  sseManager.broadcast(event);
});

// Seed database on startup
seedDatabase(500);
console.log('Database seeded with 500 transactions');

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   RevenueGuard AI — Agent Engine         ║
  ║   Running on http://localhost:${PORT}        ║
  ║   SSE endpoint: /api/events              ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
