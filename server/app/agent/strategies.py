import asyncio
from .actions import action_smart_retry, action_nudge, action_route_switch, action_escalate

class Strategies:
    @staticmethod
    async def subscription_recovery(transaction, diagnosis, spend_tracker):
        tier = transaction.get('customerTier', 'NEW')
        
        if tier == 'VIP':
            # VIP customers: try smart retry first, then escalate to human (no automated nudge)
            result = await action_smart_retry(transaction, diagnosis, spend_tracker)
            if result['success']:
                return result
            return await action_escalate(transaction, diagnosis, spend_tracker)
        else:
            # Regular/New customers: try smart retry, then send nudge
            result = await action_smart_retry(transaction, diagnosis, spend_tracker)
            if result['success']:
                return result
            return await action_nudge(transaction, diagnosis, spend_tracker)

    @staticmethod
    async def payment_degradation(transaction, diagnosis, spend_tracker):
        # Switch route immediately
        result = await action_route_switch(transaction, diagnosis, spend_tracker)
        if result['success']:
            return result
            
        return await action_escalate(transaction, diagnosis, spend_tracker)

    @staticmethod
    async def checkout_dropoff(transaction, diagnosis, spend_tracker):
        # Abandoned checkout gets a personalized nudge
        return await action_nudge(transaction, diagnosis, spend_tracker)
        
strategies = Strategies()
