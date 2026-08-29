class Governance:
    def __init__(self):
        self.kill_switch_active = False
        
        self.daily_budget = 1000.0  # ₹1000 max daily spend on recovery APIs
        self.current_spend = 0.0
        
        # Max retries per customer per day
        self.max_retries_per_customer = 3
        
        # Escalation threshold
        self.escalation_threshold_amount = 50000  # ₹50,000
        
    # --- Kill Switch ---
    def toggle_kill_switch(self, active: bool):
        self.kill_switch_active = active
        
    def can_proceed(self):
        if self.kill_switch_active:
            return False
        if self.current_spend >= self.daily_budget:
            return False
        return True
        
    # --- Spend Limits ---
    def record_spend(self, category, amount):
        self.current_spend += amount
        
    # --- Escalation Rules ---
    def should_escalate(self, transaction, detection):
        # 1. High value transactions
        if transaction['amount'] >= self.escalation_threshold_amount:
            return True
            
        # 2. Critical degradation
        if detection.get('priority') == 'CRITICAL':
            return True
            
        # 3. Fraud suspicion (multiple failures)
        customer = transaction.get('customerInfo', {})
        if customer.get('previousAttempts', 0) >= 4:
            return True
            
        return False

    def get_status(self):
        return {
            'killSwitchActive': self.kill_switch_active,
            'budget': self.daily_budget,
            'spend': self.current_spend,
            'spendPercent': (self.current_spend / self.daily_budget) * 100 if self.daily_budget > 0 else 0
        }

governance = Governance()
