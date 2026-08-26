const { v4: uuidv4 } = require('uuid');
const auditLogger = require('../audit/auditLogger');
const diagnoser = require('./diagnoser');
const escalationRules = require('../governance/escalationRules');
const stoppingRules = require('../governance/stoppingRules');
const spendLimits = require('../governance/spendLimits');
const killSwitch = require('../governance/killSwitch');
const transactionStore = require('../data/transactionStore');

// Strategy handlers
const subscriptionRecovery = require('./strategies/subscriptionRecovery');
const paymentDegradation = require('./strategies/paymentDegradation');
const checkoutDropoff = require('./strategies/checkoutDropoff');

// Recovery states
const STATES = {
  DETECTED: 'DETECTED',
  DIAGNOSING: 'DIAGNOSING',
  STRATEGY_SELECTED: 'STRATEGY_SELECTED',
  EXECUTING: 'EXECUTING',
  WAITING: 'WAITING',
  SUCCEEDED: 'SUCCEEDED',
  RETRY: 'RETRY',
  ESCALATED: 'ESCALATED',
  STOPPED: 'STOPPED',
};

class RecoveryOrchestrator {
  constructor() {
    this.activeRecoveries = new Map();
    this.completedRecoveries = [];
    this.listeners = [];
    this.metrics = {
      totalDetected: 0,
      totalRecovered: 0,
      totalAmountAtRisk: 0,
      totalAmountRecovered: 0,
      totalEscalated: 0,
      totalStopped: 0,
      byStrategy: {},
    };
  }

  /**
   * Register a listener for real-time events (SSE).
   */
  onEvent(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _emit(event) {
    for (const listener of this.listeners) {
      try { listener(event); } catch (e) { /* ignore listener errors */ }
    }
  }

  /**
   * Process a batch of flagged transactions through the recovery pipeline.
   * This is the main entry point for the orchestrator.
   */
  async processBatch(flaggedTransactions) {
    const results = [];

    for (const txn of flaggedTransactions) {
      // Check kill switch before each transaction
      if (killSwitch.isKilled()) {
        const reason = 'Kill switch activated — halting all recoveries';
        auditLogger.log(txn.id || txn.id, 'KILL_SWITCH', { reason });
        this._emit({ type: 'KILL_SWITCH', transactionId: txn.id, reason });
        break;
      }

      try {
        const result = await this._processOne(txn);
        results.push(result);
      } catch (err) {
        console.error(`[Orchestrator] Error processing ${txn.id}:`, err.message);
        auditLogger.log(txn.id, 'ERROR', { error: err.message });
        results.push({
          transactionId: txn.id,
          state: 'ERROR',
          error: err.message,
        });
      }

      // Small delay between transactions to avoid overwhelming downstream
      await this._sleep(100);
    }

    return {
      processed: results.length,
      results,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Process a single flagged transaction through the state machine.
   */
  async _processOne(txn) {
    const recoveryId = `rec_${uuidv4().slice(0, 8)}`;
    const recovery = {
      id: recoveryId,
      transactionId: txn.id,
      transaction: txn,
      state: STATES.DETECTED,
      diagnosis: null,
      strategy: null,
      actions: [],
      startTime: Date.now(),
      endTime: null,
      amountRecovered: 0,
    };

    this.activeRecoveries.set(recoveryId, recovery);
    this.metrics.totalDetected++;
    this.metrics.totalAmountAtRisk += txn.amount || 0;

    // Log detection
    auditLogger.log(txn.id, 'DETECTED', {
      riskType: txn.riskType,
      amount: txn.amount,
      recoveryId,
    });
    this._emit({ type: 'DETECTED', recoveryId, transaction: txn });

    // === STATE: DIAGNOSING ===
    recovery.state = STATES.DIAGNOSING;
    this._emit({ type: 'STATE_CHANGE', recoveryId, state: STATES.DIAGNOSING });

    const diagnosis = await diagnoser.diagnose(txn);
    recovery.diagnosis = diagnosis;

    auditLogger.log(txn.id, 'DIAGNOSED', {
      recoveryId,
      failureReason: diagnosis.failureReason,
      recoverabilityScore: diagnosis.recoverabilityScore,
      reasoning: diagnosis.reasoning,
      suggestedStrategy: diagnosis.suggestedStrategy,
      confidence: diagnosis.confidence,
      source: diagnosis.source,
    });
    this._emit({ type: 'DIAGNOSED', recoveryId, diagnosis });

    // === GOVERNANCE CHECK: Should we stop before even trying? ===
    const stopCheck = stoppingRules.shouldStop({
      transaction: txn,
      diagnosis,
      previousAttempts: txn.customerInfo?.previousAttempts || 0,
    });

    if (stopCheck.shouldStop) {
      recovery.state = STATES.STOPPED;
      recovery.endTime = Date.now();
      this.metrics.totalStopped++;
      this._finalizeRecovery(recovery);

      auditLogger.log(txn.id, 'STOPPED', {
        recoveryId,
        reason: stopCheck.reason,
        rule: stopCheck.rule,
      });
      this._emit({ type: 'STOPPED', recoveryId, reason: stopCheck.reason });

      return this._buildResult(recovery);
    }

    // === GOVERNANCE CHECK: Should we escalate? ===
    const escalateCheck = escalationRules.shouldEscalate({
      transaction: txn,
      diagnosis,
    });

    if (escalateCheck.shouldEscalate) {
      recovery.state = STATES.ESCALATED;
      recovery.endTime = Date.now();
      this.metrics.totalEscalated++;
      this._finalizeRecovery(recovery);

      auditLogger.log(txn.id, 'ESCALATED', {
        recoveryId,
        reason: escalateCheck.reason,
        rule: escalateCheck.rule,
      });
      this._emit({ type: 'ESCALATED', recoveryId, reason: escalateCheck.reason });

      return this._buildResult(recovery);
    }

    // === STATE: STRATEGY_SELECTED ===
    recovery.state = STATES.STRATEGY_SELECTED;
    recovery.strategy = diagnosis.suggestedStrategy;
    this._emit({ type: 'STRATEGY_SELECTED', recoveryId, strategy: diagnosis.suggestedStrategy });

    // === GOVERNANCE CHECK: Spend limits ===
    const spendCheck = spendLimits.canSpend(txn.amount || 0);
    if (!spendCheck.allowed) {
      recovery.state = STATES.STOPPED;
      recovery.endTime = Date.now();
      this.metrics.totalStopped++;
      this._finalizeRecovery(recovery);

      auditLogger.log(txn.id, 'STOPPED', {
        recoveryId,
        reason: spendCheck.reason,
      });
      this._emit({ type: 'STOPPED', recoveryId, reason: spendCheck.reason });

      return this._buildResult(recovery);
    }

    // === STATE: EXECUTING ===
    recovery.state = STATES.EXECUTING;
    this._emit({ type: 'EXECUTING', recoveryId, strategy: recovery.strategy });

    const executionResult = await this._executeStrategy(txn, diagnosis, recovery);

    // === FINALIZE ===
    if (executionResult.recovered) {
      recovery.state = STATES.SUCCEEDED;
      recovery.amountRecovered = executionResult.amountRecovered || txn.amount || 0;
      this.metrics.totalRecovered++;
      this.metrics.totalAmountRecovered += recovery.amountRecovered;

      // Track by strategy
      const stratKey = recovery.strategy || 'UNKNOWN';
      if (!this.metrics.byStrategy[stratKey]) {
        this.metrics.byStrategy[stratKey] = { count: 0, amountRecovered: 0 };
      }
      this.metrics.byStrategy[stratKey].count++;
      this.metrics.byStrategy[stratKey].amountRecovered += recovery.amountRecovered;

      auditLogger.log(txn.id, 'RECOVERED', {
        recoveryId,
        amountRecovered: recovery.amountRecovered,
        strategy: recovery.strategy,
        actionsCount: executionResult.actions?.length || 0,
      });
      this._emit({ type: 'RECOVERED', recoveryId, amountRecovered: recovery.amountRecovered });

      // Update transaction status in store
      transactionStore.updateTransaction(txn.id, { status: 'recovered', recoveryId });
    } else {
      recovery.state = executionResult.escalated ? STATES.ESCALATED : STATES.STOPPED;
      if (executionResult.escalated) this.metrics.totalEscalated++;
      else this.metrics.totalStopped++;

      auditLogger.log(txn.id, executionResult.escalated ? 'ESCALATED' : 'STOPPED', {
        recoveryId,
        reason: executionResult.reason || 'Strategy exhausted',
        actions: executionResult.actions,
      });
      this._emit({
        type: executionResult.escalated ? 'ESCALATED' : 'STOPPED',
        recoveryId,
        reason: executionResult.reason,
      });
    }

    recovery.endTime = Date.now();
    recovery.actions = executionResult.actions || [];
    spendLimits.recordSpend(executionResult.cost || 0);
    this._finalizeRecovery(recovery);

    return this._buildResult(recovery);
  }

  /**
   * Execute the selected recovery strategy.
   */
  async _executeStrategy(txn, diagnosis, recovery) {
    const strategy = diagnosis.suggestedStrategy;

    switch (txn.riskType) {
      case 'SUBSCRIPTION_FAILURE':
        return subscriptionRecovery.execute(txn, diagnosis);
      case 'CHECKOUT_DROPOUT':
        return checkoutDropoff.execute(txn, diagnosis);
      case 'DEGRADATION_DETECTED':
        return paymentDegradation.execute(txn, diagnosis);
      default:
        // For generic FAILED_PAYMENT, route based on strategy
        switch (strategy) {
          case 'SMART_RETRY':
          case 'IMMEDIATE_RETRY':
            return subscriptionRecovery.execute(txn, diagnosis);
          case 'SIMPLIFY_RETRY':
          case 'VALUE_REMIND':
            return checkoutDropoff.execute(txn, diagnosis);
          case 'ESCALATE':
            return { recovered: false, escalated: true, reason: 'Immediate escalation required', actions: ['ESCALATED_TO_HUMAN'], cost: 0 };
          default:
            return subscriptionRecovery.execute(txn, diagnosis);
        }
    }
  }

  _finalizeRecovery(recovery) {
    this.activeRecoveries.delete(recovery.id);
    this.completedRecoveries.push(recovery);
  }

  _buildResult(recovery) {
    return {
      recoveryId: recovery.id,
      transactionId: recovery.transactionId,
      state: recovery.state,
      diagnosis: recovery.diagnosis,
      strategy: recovery.strategy,
      amountRecovered: recovery.amountRecovered,
      duration: recovery.endTime ? recovery.endTime - recovery.startTime : null,
      actions: recovery.actions,
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      recoveryRate: this.metrics.totalDetected > 0
        ? Math.round((this.metrics.totalRecovered / this.metrics.totalDetected) * 100)
        : 0,
      activeRecoveries: this.activeRecoveries.size,
    };
  }

  getCompletedRecoveries() {
    return this.completedRecoveries;
  }

  reset() {
    this.activeRecoveries.clear();
    this.completedRecoveries = [];
    this.metrics = {
      totalDetected: 0,
      totalRecovered: 0,
      totalAmountAtRisk: 0,
      totalAmountRecovered: 0,
      totalEscalated: 0,
      totalStopped: 0,
      byStrategy: {},
    };
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new RecoveryOrchestrator();
