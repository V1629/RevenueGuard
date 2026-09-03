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
            'spendLimits': {
                'dailyLimit': self.daily_budget,
                'currentSpend': self.current_spend,
                'utilizationPercent': round((self.current_spend / self.daily_budget) * 100) if self.daily_budget > 0 else 0
            },
            'killSwitch': {
                'active': self.kill_switch_active,
                'killedBy': 'System Admin' if self.kill_switch_active else '',
                'reason': 'Manual Override via UI' if self.kill_switch_active else ''
            },
            'escalationRules': [
                {'id': 1, 'name': 'High Value Transaction', 'priority': 'High', 'reason': f'Amount >= ₹{self.escalation_threshold_amount}'},
                {'id': 2, 'name': 'Critical Degradation', 'priority': 'Critical', 'reason': 'System-wide gateway outage detected'},
                {'id': 3, 'name': 'Fraud Suspicion', 'priority': 'Medium', 'reason': '>= 4 previous failed attempts by customer'}
            ],
            'stoppingRules': [
                {'id': 1, 'name': 'Budget Exhaustion', 'reason': f'Daily AI spend exceeds ₹{self.daily_budget}'},
                {'id': 2, 'name': 'Global Kill Switch', 'reason': 'Agent manually halted by operator'}
            ]
        }

governance = Governance()
