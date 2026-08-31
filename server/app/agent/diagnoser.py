from ..ai.groq_client import groq_client
from ..ai.prompts import DIAGNOSTIC_SYSTEM_PROMPT, generate_diagnostic_prompt
from ..api.sse_manager import sse_manager
from ..ai.kb_retriever import kb_retriever

HEURISTIC_MAP = {
    'INSUFFICIENT_FUNDS': {
        'strategy': 'SUBSCRIPTION_RECOVERY',
        'optimalRetryWindow': '24h',
        'reason': 'Insufficient funds on card'
    },
    'RISK_REJECT': {
        'strategy': 'SUBSCRIPTION_RECOVERY',
        'optimalRetryWindow': 'none',
        'reason': 'Blocked by issuing bank risk engine'
    },
    'ACQUIRER_TIMEOUT': {
        'strategy': 'PAYMENT_DEGRADATION',
        'optimalRetryWindow': 'immediate',
        'reason': 'Acquiring bank timed out'
    },
    'PROCESSOR_DOWN': {
        'strategy': 'PAYMENT_DEGRADATION',
        'optimalRetryWindow': 'immediate',
        'reason': 'Payment processor is currently down'
    },
    'NETWORK_ERROR': {
        'strategy': 'PAYMENT_DEGRADATION',
        'optimalRetryWindow': 'immediate',
        'reason': 'Network error between gateway and bank'
    },
    '3DS_FAILED': {
        'strategy': 'CHECKOUT_DROPOFF',
        'optimalRetryWindow': 'immediate',
        'reason': 'Customer failed 3D Secure authentication'
    },
    'USER_ABANDONED': {
        'strategy': 'CHECKOUT_DROPOFF',
        'optimalRetryWindow': '1h',
        'reason': 'Customer abandoned checkout page'
    }
}

class Diagnoser:
    async def diagnose(self, transaction):
        try:
            # Step 1: Retrieve relevant KB entries
            kb_entries = kb_retriever.retrieve(transaction, top_k=3)
            kb_context = kb_retriever.format_for_prompt(kb_entries)
            
            # Log what we matched for debugging
            matched_ids = [e['id'] for e in kb_entries]
            print(f"[Diagnoser] KB matches for {transaction['id']}: {matched_ids}")
            
            # Step 2: Build the enhanced prompt with KB context
            prompt = generate_diagnostic_prompt(transaction, kb_context=kb_context)
            
            # Step 3: Send to Groq LLM
            diagnosis = await groq_client.analyze(DIAGNOSTIC_SYSTEM_PROMPT, prompt)
            diagnosis['isAI'] = True
            
            # Step 4: Attach KB metadata to the diagnosis for the frontend
            if kb_entries:
                diagnosis['knowledgeBaseMatch'] = kb_entries[0].get('id')
                diagnosis['kbSuccessRate'] = kb_entries[0].get('historicalSuccessRate')
            
            sse_manager.broadcast({
                'type': 'DIAGNOSED',
                'transactionId': transaction['id'],
                'diagnosis': diagnosis
            })
            return diagnosis
            
        except Exception as e:
            print(f"[Diagnoser] AI diagnosis failed for {transaction['id']}, falling back to heuristics: {str(e)}")
            return self._heuristic_fallback(transaction)
            
    def _heuristic_fallback(self, transaction):
        reason_code = transaction.get('errorDetails', {}).get('reason')
        mapping = HEURISTIC_MAP.get(reason_code, {
            'strategy': 'CHECKOUT_DROPOFF',
            'optimalRetryWindow': 'immediate',
            'reason': 'Unknown failure reason'
        })
        
        diagnosis = {
            'reason': mapping['reason'],
            'confidence': 100,
            'strategy': mapping['strategy'],
            'riskFactors': ['Heuristic fallback used', 'AI API unavailable'],
            'recommendedAction': f"Execute {mapping['strategy']}",
            'optimalRetryWindow': mapping['optimalRetryWindow'],
            'isAI': False
        }
        
        sse_manager.broadcast({
            'type': 'DIAGNOSED',
            'transactionId': transaction['id'],
            'diagnosis': diagnosis
        })
        return diagnosis

diagnoser = Diagnoser()
