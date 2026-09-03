import asyncio
import random
import os
import resend
import stripe
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
            'context_string': f"Failed subscription renewal. Give them this exact recovery link to retry their payment: http://localhost:3001/api/recover/{transaction['id']}"
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
    
    # (Resend integration moved to dispatch_customer_notification so it only fires once per failure)
    
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
    
    # Generate a real Stripe Checkout Session for dynamic frontend fallback
    try:
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'unit_amount': int(transaction['amount']) * 100,
                    'product_data': {
                        'name': 'Premium Subscription (Fallback)',
                        'description': f'Auto-routing failed transaction {transaction["id"]} away from Razorpay',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url="http://localhost:5173/?success=true",
            cancel_url="http://localhost:5173/agent",
            metadata={'original_transaction_id': transaction['id']}
        )
        print(f"[Stripe Fallback] Generated Checkout Session: {session.id}")
        
        # Broadcast the session ID to the frontend to trigger the UI intercept!
        sse_manager.broadcast({
            'type': 'STRIPE_FALLBACK',
            'transactionId': transaction['id'],
            'sessionId': session.id,
            'url': session.url
        })
        success = True
    except Exception as e:
        print(f"[Stripe Fallback] Failed to generate session: {e}")
        success = False
        
    return {
        'actionType': 'ROUTE_SWITCH',
        'success': success,
        'cost': 10,
        'newGateway': 'Stripe',
        'url': session.url if success else None
    }

async def action_escalate(transaction, diagnosis, spend_tracker):
    await simulate_delay(300)
    return {
        'actionType': 'ESCALATE',
        'success': False,
        'cost': 0,
        'message': "Escalated to human queue"
    }

async def dispatch_customer_notification(transaction, diagnosis):
    """
    Called by the orchestrator to ensure exactly 1 email is sent per failure,
    regardless of which recovery strategy is chosen.
    """
    phone = transaction.get('customerInfo', {}).get('phone', 'Unknown')
    email = transaction.get('customerInfo', {}).get('id', 'Unknown')
    
    # Dynamically change the link based on the strategy!
    if diagnosis.get('strategy') == 'PAYMENT_DEGRADATION':
        context_string = f"Razorpay is currently down. Give them this secure Stripe backup link to seamlessly complete their payment: http://localhost:3001/api/recover/{transaction['id']}"
    else:
        context_string = f"Failed subscription renewal. Give them this exact recovery link to retry their payment: http://localhost:3001/api/recover/{transaction['id']}"
        
    try:
        prompt = generate_nudge_prompt({
            'customer_id': transaction['customerInfo']['id'],
            'reason': diagnosis['reason'],
            'amount': transaction['amount'],
            'context_string': context_string
        })
        nudge = await groq_client.analyze(NUDGE_SYSTEM_PROMPT, prompt)
    except Exception as e:
        print(f"[Nudge] AI generation failed, using template: {e}")
        nudge = {
            'content': f"Hi, your payment of ₹{transaction['amount']} failed. Please update your card.",
            'channel': 'sms',
            'tone': 'helpful'
        }

    print("\n" + "="*50)
    print("🚀 DISPATCHING FAILURE NOTIFICATION")
    print(f"📧 TO EMAIL: {email}")
    print(f"📱 TO PHONE: {phone}")
    print("-" * 50)
    print(f"MESSAGE: {nudge.get('content')}")
    print("="*50 + "\n")
    
    if email and email != 'Unknown' and '@' in email:
        try:
            resend.api_key = os.environ.get("RESEND_API_KEY")
            params = {
                "from": "onboarding@resend.dev",
                "to": email,
                "subject": "Payment Failed - Action Required",
                "html": f"<p>{nudge.get('content')}</p>"
            }
            # Temporarily disabled actual email sending for testing
            # resend.Emails.send(params)
            print(f"[Resend] (MOCKED) Successfully simulated sending email to {email}!")
        except Exception as e:
            print(f"[Resend] Failed to send email: {e}")
            
    sse_manager.broadcast({
        'type': 'NOTIFICATION',
        'level': 'success',
        'message': f"Sent failure notification to {email}: '{nudge.get('content')}'"
    })

