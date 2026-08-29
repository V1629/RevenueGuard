from ..data.audit_store import audit_store

class AuditLogger:
    def log_action(self, txn_id, action_type, result, details):
        entry = {
            'transactionId': txn_id,
            'action': action_type,
            'result': result,
            'details': details
        }
        return audit_store.add_entry(entry)

audit_logger = AuditLogger()
