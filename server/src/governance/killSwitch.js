/**
 * Kill Switch — Emergency halt for the recovery agent.
 * 
 * When activated:
 * - Halts all new recovery processing immediately
 * - In-flight operations complete but no new ones start
 * - Logs the reason and requires manual re-activation
 */

class KillSwitch {
  constructor() {
    this.killed = false;
    this.killedAt = null;
    this.killedBy = null;
    this.reason = null;
    this.history = [];
  }

  /**
   * Activate the kill switch.
   */
  activate(reason = 'Manual kill switch activated', activatedBy = 'operator') {
    this.killed = true;
    this.killedAt = new Date().toISOString();
    this.killedBy = activatedBy;
    this.reason = reason;

    this.history.push({
      action: 'KILLED',
      timestamp: this.killedAt,
      reason,
      activatedBy,
    });

    console.warn(`[KillSwitch] ⚠️ ACTIVATED by ${activatedBy}: ${reason}`);
    return this.getStatus();
  }

  /**
   * Deactivate the kill switch (resume agent).
   */
  deactivate(resumedBy = 'operator') {
    if (!this.killed) return this.getStatus();

    this.history.push({
      action: 'RESUMED',
      timestamp: new Date().toISOString(),
      previousKillReason: this.reason,
      resumedBy,
    });

    this.killed = false;
    this.killedAt = null;
    this.killedBy = null;
    this.reason = null;

    console.log(`[KillSwitch] ✅ Deactivated by ${resumedBy} — agent resuming`);
    return this.getStatus();
  }

  isKilled() {
    return this.killed;
  }

  getStatus() {
    return {
      active: this.killed,
      killedAt: this.killedAt,
      killedBy: this.killedBy,
      reason: this.reason,
    };
  }

  getHistory() {
    return this.history;
  }

  reset() {
    this.killed = false;
    this.killedAt = null;
    this.killedBy = null;
    this.reason = null;
    this.history = [];
  }
}

module.exports = new KillSwitch();
