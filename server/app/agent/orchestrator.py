import asyncio
from ..data.transaction_store import transaction_store
from ..api.sse_manager import sse_manager
from ..audit.audit_logger import audit_logger
from ..governance.rules import governance
from .detector import detector
from .diagnoser import diagnoser
from .strategies import strategies
from .actions import dispatch_customer_notification

class Orchestrator:
    def _classify_customer(self, transaction):
        """Classify customer into a tier based on LTV."""
        ltv = transaction.get('customerInfo', {}).get('ltv', 0)
        if ltv >= 100000:
            return 'VIP'
        elif ltv >= 25000:
            return 'REGULAR'
        else:
            return 'NEW'

    async def process_batch(self, transactions):
        results = {
            'detected': 0,
            'recovered': 0,
            'escalated': 0,
            'stopped': 0,
            'amountRecovered': 0
        }
        
        # We process transactions concurrently to speed up the batch
        tasks = []
        for txn in transactions:
            tasks.append(self.process_transaction(txn, results))
            
        await asyncio.gather(*tasks)
        return results

    async def process_transaction(self, transaction, results):
        txn_id = transaction['id']
        
        # 1. Detection Phase
        detection = detector.detect(transaction)
        detector.track_and_detect_degradation(transaction)
        
        if not detection['detected']:
            return
            
        results['detected'] += 1
        
        # Inject riskType into transaction so the frontend can read it
        transaction['riskType'] = detection.get('riskType', 'PAYMENT_FAILURE')
        
        sse_manager.broadcast({
            'type': 'DETECTED',
            'transactionId': txn_id,
            'transaction': transaction
        })
        
        # 2. Governance Check (Kill Switch & Escalation)
        if not governance.can_proceed():
            results['stopped'] += 1
            sse_manager.broadcast({
                'type': 'STOPPED',
                'transactionId': txn_id,
                'reason': 'Agent halted by kill switch'
            })
            return
            
        if governance.should_escalate(transaction, detection):
            results['escalated'] += 1
            transaction_store.update_transaction(txn_id, {'agentStatus': 'ESCALATED'})
            sse_manager.broadcast({
                'type': 'ESCALATED',
                'transactionId': txn_id,
                'reason': 'Escalation rule triggered'
            })
            audit_logger.log_action(txn_id, 'ESCALATE', 'Governance Rules', 'Escalated to human due to high value or risk')
            return
            
        # 3. Diagnosis Phase
        diagnosis = await diagnoser.diagnose(transaction)
        
        # 3.5 Customer Segmentation
        tier = self._classify_customer(transaction)
        transaction['customerTier'] = tier
        
        sse_manager.broadcast({
            'type': 'CUSTOMER_SEGMENTED',
            'transactionId': txn_id,
            'tier': tier,
            'ltv': transaction.get('customerInfo', {}).get('ltv', 0)
        })
        
        # 4. Dispatch Email Notification (Guarantees exactly 1 email per failure)
        await dispatch_customer_notification(transaction, diagnosis)
        
        # 5. Strategy Execution Phase
        strategy_name = diagnosis.get('strategy', 'CHECKOUT_DROPOFF')
        strategy_method = None
        
        if strategy_name == 'SUBSCRIPTION_RECOVERY':
            strategy_method = strategies.subscription_recovery
        elif strategy_name == 'PAYMENT_DEGRADATION':
            strategy_method = strategies.payment_degradation
        else:
            strategy_method = strategies.checkout_dropoff
            
        sse_manager.broadcast({
            'type': 'EXECUTING',
            'transactionId': txn_id,
            'strategy': strategy_name
        })
        
        # Run Strategy
        def spend_tracker(category, amount):
            governance.record_spend(category, amount)
            
        outcome = await strategy_method(transaction, diagnosis, spend_tracker)
        
        # 5. Outcome Phase
        if outcome['success']:
            if 'url' in outcome:
                transaction['fallbackUrl'] = outcome['url']
                
            results['recovered'] += 1
            results['amountRecovered'] += transaction['amount']
            transaction_store.update_transaction(txn_id, {
                'status': 'success',
                'agentStatus': 'RECOVERED',
                'recoveredVia': outcome['actionType']
            })
            sse_manager.broadcast({
                'type': 'RECOVERED',
                'transactionId': txn_id,
                'amount': transaction['amount'],
                'action': outcome['actionType']
            })
            audit_logger.log_action(txn_id, outcome['actionType'], 'Success', f"Recovered ₹{transaction['amount']}")
        else:
            results['stopped'] += 1
            transaction_store.update_transaction(txn_id, {'agentStatus': 'STOPPED'})
            sse_manager.broadcast({
                'type': 'STOPPED',
                'transactionId': txn_id,
                'reason': 'Strategy failed'
            })
            audit_logger.log_action(txn_id, outcome['actionType'], 'Failed', "Recovery strategy exhausted")

orchestrator = Orchestrator()
