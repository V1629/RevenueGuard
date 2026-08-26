/**
 * Spend Limits — Track and enforce per-day spend limits for the agent.
 * Prevents runaway costs from excessive retries or nudges.
 */

class SpendLimits {
  constructor() {
    this.dailyLimit = 100000; // ₹1,00,000 daily retry budget
    this.currentDaySpend = 0;
    this.currentDay = this._today();
  }

  canSpend(amount) {
    this._resetIfNewDay();

    if (this.currentDaySpend + amount > this.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily spend limit of ₹${this.dailyLimit.toLocaleString('en-IN')} reached (current: ₹${this.currentDaySpend.toLocaleString('en-IN')})`,
        remaining: Math.max(0, this.dailyLimit - this.currentDaySpend),
      };
    }

    return { allowed: true, remaining: this.dailyLimit - this.currentDaySpend - amount };
  }

  recordSpend(amount) {
    this._resetIfNewDay();
    this.currentDaySpend += amount;
  }

  getStatus() {
    this._resetIfNewDay();
    return {
      dailyLimit: this.dailyLimit,
      currentSpend: this.currentDaySpend,
      remaining: Math.max(0, this.dailyLimit - this.currentDaySpend),
      utilizationPercent: Math.round((this.currentDaySpend / this.dailyLimit) * 100),
    };
  }

  _resetIfNewDay() {
    const today = this._today();
    if (today !== this.currentDay) {
      this.currentDaySpend = 0;
      this.currentDay = today;
    }
  }

  _today() {
    return new Date().toISOString().split('T')[0];
  }

  reset() {
    this.currentDaySpend = 0;
  }
}

module.exports = new SpendLimits();
