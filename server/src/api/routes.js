const express = require('express');
const router = express.Router();

const transactionStore = require('../data/transactionStore');
const { generateBatch } = require('../data/syntheticGenerator');
const { seedDatabase } = require('../data/seedData');
const detector = require('../agent/detector');
const orchestrator = require('../agent/orchestrator');
const auditLogger = require('../audit/auditLogger');
const escalationRules = require('../governance/escalationRules');
const stoppingRules = require('../governance/stoppingRules');
const spendLimits = require('../governance/spendLimits');
const killSwitch = require('../governance/killSwitch');
const sseManager = require('./sseManager');

// ==================== SSE ====================

router.get('/events', (req, res) => {
  sseManager.addClient(req, res);
});

// ==================== TRANSACTIONS ====================

router.get('/transactions', (req, res) => {
  const transactions = transactionStore.getAllTransactions();
  const { status, type, limit } = req.query;

  let filtered = transactions;
  if (status) filtered = filtered.filter(t => t.status === status);
  if (type) filtered = filtered.filter(t => t.type === type);

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (limit) filtered = filtered.slice(0, parseInt(limit));

  res.json({
    total: filtered.length,
    transactions: filtered,
  });
});

router.get('/transactions/:id', (req, res) => {
  const txn = transactionStore.getTransaction(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  res.json(txn);
});

// ==================== AGENT CONTROL ====================

/**
 * Run the agent on current failed/abandoned transactions.
 */
router.post('/agent/run-batch', async (req, res) => {
  if (killSwitch.isKilled()) {
    return res.status(403).json({
      error: 'Agent is halted',
      killSwitch: killSwitch.getStatus(),
    });
  }

  const { batchSize = 50, generateNew = false } = req.body;

  // Optionally generate new transactions
  if (generateNew) {
    const batch = generateBatch(parseInt(batchSize));
    transactionStore.addTransactions(batch);
  }

  // Get all failed/abandoned transactions
  const allTxns = transactionStore.getAllTransactions();
  const atRisk = allTxns.filter(t =>
    t.status === 'failed' || t.status === 'abandoned'
  ).slice(0, parseInt(batchSize));

  if (atRisk.length === 0) {
    return res.json({
      message: 'No at-risk transactions found',
      metrics: orchestrator.getMetrics(),
    });
  }

  // Step 1: Detect
  sseManager.broadcast({ type: 'BATCH_START', batchSize: atRisk.length });
  const flagged = detector.detect(atRisk);

  // Step 2: Process through orchestrator
  const results = await orchestrator.processBatch(flagged);

  sseManager.broadcast({
    type: 'BATCH_COMPLETE',
    ...results.metrics,
  });

  res.json({
    message: `Processed ${results.processed} transactions`,
    ...results,
  });
});

/**
 * Seed/reset the database with fresh data.
 */
router.post('/agent/seed', (req, res) => {
  const { size = 500 } = req.body;
  orchestrator.reset();
  auditLogger.clear();
  escalationRules.reset();
  stoppingRules.reset();
  spendLimits.reset();
  seedDatabase(parseInt(size));

  res.json({
    message: `Database seeded with ${size} transactions`,
    summary: {
      total: transactionStore.getAllTransactions().length,
      failed: transactionStore.getTransactionsByStatus('failed').length,
      abandoned: transactionStore.getTransactionsByStatus('abandoned').length,
      success: transactionStore.getTransactionsByStatus('success').length,
    },
  });
});

// ==================== METRICS ====================

router.get('/metrics/summary', (req, res) => {
  const metrics = orchestrator.getMetrics();
  const allTxns = transactionStore.getAllTransactions();

  const totalRevenue = allTxns.reduce((s, t) => s + t.amount, 0);
  const failedRevenue = allTxns
    .filter(t => t.status === 'failed' || t.status === 'abandoned')
    .reduce((s, t) => s + t.amount, 0);

  res.json({
    ...metrics,
    totalTransactions: allTxns.length,
    totalRevenue,
    failedRevenue,
    recoveredPercent: failedRevenue > 0
      ? Math.round((metrics.totalAmountRecovered / failedRevenue) * 100)
      : 0,
  });
});

router.get('/metrics/by-strategy', (req, res) => {
  const metrics = orchestrator.getMetrics();
  res.json(metrics.byStrategy);
});

// ==================== AUDIT ====================

router.get('/audit/entries', (req, res) => {
  const { transactionId, actionType, limit = 100 } = req.query;
  let entries = auditLogger.getAll();

  if (transactionId) {
    entries = entries.filter(e => e.transactionId === transactionId);
  }
  if (actionType) {
    entries = entries.filter(e => e.actionType === actionType);
  }

  // Sort newest first
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  entries = entries.slice(0, parseInt(limit));

  res.json({ total: entries.length, entries });
});

router.get('/audit/summary', (req, res) => {
  res.json(auditLogger.getSummary());
});

// ==================== GOVERNANCE ====================

router.get('/governance/status', (req, res) => {
  res.json({
    killSwitch: killSwitch.getStatus(),
    spendLimits: spendLimits.getStatus(),
    escalationRules: escalationRules.getRules(),
    escalationStats: escalationRules.getStats(),
    stoppingRules: stoppingRules.getRules(),
    stoppingStats: stoppingRules.getStats(),
  });
});

router.post('/governance/kill-switch', (req, res) => {
  const { action, reason } = req.body;

  if (action === 'activate') {
    const status = killSwitch.activate(reason || 'Manual activation', 'dashboard');
    sseManager.broadcast({ type: 'KILL_SWITCH_ACTIVATED', ...status });
    res.json(status);
  } else if (action === 'deactivate') {
    const status = killSwitch.deactivate('dashboard');
    sseManager.broadcast({ type: 'KILL_SWITCH_DEACTIVATED', ...status });
    res.json(status);
  } else {
    res.status(400).json({ error: 'Invalid action. Use "activate" or "deactivate".' });
  }
});

router.get('/governance/kill-switch/history', (req, res) => {
  res.json(killSwitch.getHistory());
});

// ==================== RECOVERIES ====================

router.get('/recoveries', (req, res) => {
  const recoveries = orchestrator.getCompletedRecoveries();
  const { state, limit = 50 } = req.query;

  let filtered = recoveries;
  if (state) filtered = filtered.filter(r => r.state === state);

  filtered.sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
  filtered = filtered.slice(0, parseInt(limit));

  res.json({ total: filtered.length, recoveries: filtered });
});

module.exports = router;
