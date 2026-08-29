from datetime import datetime

class AuditStore:
    def __init__(self):
        self.entries = []
        
    def add_entry(self, entry):
        full_entry = {
            **entry,
            'timestamp': datetime.now().isoformat() + "Z"
        }
        self.entries.append(full_entry)
        return full_entry
        
    def get_entries(self):
        return self.entries
        
    def get_entries_by_transaction_id(self, txn_id):
        return [e for e in self.entries if e.get('transactionId') == txn_id]
        
    def clear(self):
        self.entries = []

audit_store = AuditStore()
