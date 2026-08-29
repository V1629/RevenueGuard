class TransactionStore:
    def __init__(self):
        self.transactions = {}
        
    def add_transactions(self, txns):
        for txn in txns:
            self.transactions[txn['id']] = txn
            
    def get_all_transactions(self):
        return list(self.transactions.values())
        
    def get_transaction(self, id):
        return self.transactions.get(id)
        
    def get_transactions_by_status(self, status):
        return [t for t in self.transactions.values() if t['status'] == status]
        
    def update_transaction(self, id, updates):
        if id in self.transactions:
            self.transactions[id].update(updates)
            return self.transactions[id]
        return None

# Singleton instance
transaction_store = TransactionStore()
