import asyncio
import random
from ..ai.groq_client import groq_client
from ..ai.prompts import generate_nudge_prompt, NUDGE_SYSTEM_PROMPT
from ..api.sse_manager import sse_manager

async def simulate_delay(ms):
    await asyncio.sleep(ms / 1000.0)

async def action_smart_retry(transaction, diagnosis, spend_tracker):
    spend_tracker('gateway_fee', 5)
    await simulate_delay(800)
    
    base_chance = 0.4
    if diagnosis.get('confidence', 0) > 80:
        base_chance += 0.2
        
    success = random.random() < base_chance
    return {
        'actionType': 'SMART_RETRY',
        'success': success,
        'cost': 5
    }

async def action_nudge(transaction, diagnosis, spend_tracker):
    spend_tracker('sms_fee', 2)
    
    try:
        prompt = generate_nudge_prompt({
            'customer_id': transaction['customerInfo']['id'],
            'reason': diagnosis['reason'],
            'amount': transaction['amount'],
            'context_string': "Failed subscription renewal"
        })
        nudge = await groq_client.analyze(NUDGE_SYSTEM_PROMPT, prompt)
    except Exception as e:
        print(f"[Nudge] AI generation failed, using template: {e}")
        nudge = {
            'content': f"Hi, your payment of ₹{transaction['amount']} failed. Please update your card.",
            'channel': 'sms',
            'tone': 'helpful'
        }
        
    await simulate_delay(500)
    
    # 60% chance the nudge converts
    success = random.random() < 0.6
    
    return {
        'actionType': 'GENTLE_NUDGE',
        'success': success,
        'cost': 2,
        'nudgeData': nudge
    }

async def action_route_switch(transaction, diagnosis, spend_tracker):
    spend_tracker('routing_fee', 10)
    await simulate_delay(1200)
    
    # Switching gateways is highly successful for gateway degradation
    success = random.random() < 0.85
    
    return {
        'actionType': 'ROUTE_SWITCH',
        'success': success,
        'cost': 10,
        'newGateway': 'Backup_Gateway_1'
    }

async def action_escalate(transaction, diagnosis, spend_tracker):
    await simulate_delay(300)
    return {
        'actionType': 'ESCALATE',
        'success': False,
        'cost': 0,
        'message': "Escalated to human queue"
    }
