import os
import time
import uuid
import razorpay
import stripe
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ..data.transaction_store import transaction_store
from ..data.seed_data import seed_database
from ..data.audit_store import audit_store
from ..governance.rules import governance
from ..agent.orchestrator import orchestrator
from .sse_manager import sse_manager

router = APIRouter(prefix="/api")

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "secret_placeholder")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

class CreateOrderRequest(BaseModel):
    amount: int
    currency: str = "INR"

class RunBatchRequest(BaseModel):
    batchSize: int = 10

class KillSwitchRequest(BaseModel):
    active: bool

@router.get("/events")
async def sse_endpoint(request: Request):
    """Server-Sent Events endpoint for real-time updates"""
    async def event_generator():
        queue = sse_manager.connect()
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {data}\n\n"
        finally:
            sse_manager.disconnect(queue)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/transactions")
def get_transactions():
    return {"transactions": transaction_store.get_all_transactions()}

@router.post("/agent/run-batch")
async def run_batch(req: RunBatchRequest, background_tasks: BackgroundTasks):
    txns = transaction_store.get_all_transactions()
    failed_or_abandoned = [t for t in txns if t['status'] in ['failed', 'abandoned'] and t.get('agentStatus') not in ['RECOVERED', 'ESCALATED', 'STOPPED']]
    
    batch = failed_or_abandoned[:req.batchSize]
    
    if not batch:
        return {"success": False, "message": "No failed transactions to process"}
        
    # Run the batch asynchronously so we don't block the API response
    async def process():
        results = await orchestrator.process_batch(batch)
        sse_manager.broadcast({
            'type': 'BATCH_COMPLETE',
            'results': results
        })
        
    background_tasks.add_task(process)
    
    return {
        "success": True, 
        "message": f"Batch of {len(batch)} started", 
        "transactionsProcessed": len(batch)
    }

@router.post("/agent/seed")
def seed_endpoint():
    batch = seed_database(50)
    audit_store.clear()
    return {"success": True, "message": "Database seeded with 50 transactions", "transactions": len(batch)}

@router.get("/metrics/summary")
def get_metrics():
    txns = transaction_store.get_all_transactions()
    
    failed = [t for t in txns if t['status'] != 'success' and t.get('agentStatus') != 'RECOVERED']
    recovered = [t for t in txns if t.get('agentStatus') == 'RECOVERED']
    successes = [t for t in txns if t['status'] == 'success']
    escalated = [t for t in txns if t.get('agentStatus') == 'ESCALATED']
    stopped = [t for t in txns if t.get('agentStatus') == 'STOPPED']
    
    total_amount_at_risk = sum(t['amount'] for t in failed)
    total_amount_recovered = sum(t['amount'] for t in recovered)
    
    by_strategy = {}
    for t in recovered:
        strat = t.get('recoveredVia', 'UNKNOWN')
        if strat not in by_strategy:
            by_strategy[strat] = {'count': 0, 'amountRecovered': 0}
        by_strategy[strat]['count'] += 1
        by_strategy[strat]['amountRecovered'] += t['amount']
        
    active_recoveries = len([t for t in failed if t.get('agentStatus') not in ['RECOVERED', 'ESCALATED', 'STOPPED'] and 'agentStatus' in t])
    
    # Calculate genuine Gateway Success Rate
    gateway_success_rate = 100
    if len(txns) > 0:
        # success transactions + recovered transactions over total
        gateway_success_rate = round(((len(successes) + len(recovered)) / len(txns)) * 100)
        
    # Generate real Timeline for the graph
    # Group by HH:MM
    from collections import OrderedDict
    timeline_dict = OrderedDict()
    
    # Sort transactions by timestamp chronologically
    sorted_txns = sorted(txns, key=lambda x: float(x['timestamp']))
    
    cumulative_recovered = 0
    cumulative_failed = 0
    
    for t in sorted_txns:
        dt = time.localtime(float(t['timestamp']))
        time_str = time.strftime('%H:%M', dt)
        
        if time_str not in timeline_dict:
            timeline_dict[time_str] = {'time': time_str, 'recovered': cumulative_recovered, 'failed': cumulative_failed}
            
        if t.get('agentStatus') == 'RECOVERED':
            cumulative_recovered += t['amount']
        elif t['status'] != 'success':
            cumulative_failed += t['amount']
            
        timeline_dict[time_str]['recovered'] = cumulative_recovered
        timeline_dict[time_str]['failed'] = cumulative_failed
        
    timeline_array = list(timeline_dict.values())
    if not timeline_array:
        # Empty state graph
        now_str = time.strftime('%H:%M')
        timeline_array = [{'time': now_str, 'recovered': 0, 'failed': 0}]
    
    return {
        "totalDetected": len(failed) + len(recovered) + len(escalated) + len(stopped),
        "totalRecovered": len(recovered),
        "totalAmountAtRisk": total_amount_at_risk,
        "totalAmountRecovered": total_amount_recovered,
        "totalEscalated": len(escalated),
        "totalStopped": len(stopped),
        "byStrategy": by_strategy,
        "recoveryRate": round((len(recovered) / (len(failed) + len(recovered) + len(escalated) + len(stopped))) * 100) if (len(failed) + len(recovered)) > 0 else 0,
        "activeRecoveries": active_recoveries,
        "totalTransactions": len(txns),
        "totalRevenue": sum(t['amount'] for t in txns),
        "failedRevenue": total_amount_at_risk,
        "recoveredPercent": round((total_amount_recovered / sum(t['amount'] for t in txns)) * 100) if txns else 0,
        "gatewaySuccessRate": gateway_success_rate,
        "timeline": timeline_array
    }

@router.get("/audit/entries")
def get_audit_trail():
    return {"entries": audit_store.get_entries()}

@router.get("/governance/status")
def get_governance_status():
    return {"status": governance.get_status()}

@router.post("/governance/kill-switch")
def toggle_kill_switch(req: KillSwitchRequest):
    governance.toggle_kill_switch(req.active)
    
    sse_manager.broadcast({
        'type': 'GOVERNANCE_UPDATE',
        'killSwitchActive': req.active
    })
    
    return {"success": True, "killSwitchActive": req.active}

@router.post("/payment/create-order")
def create_razorpay_order(req: CreateOrderRequest):
    """Creates a Razorpay order for the frontend checkout."""
    try:
        order_data = {
            "amount": req.amount * 100, # Razorpay expects paise
            "currency": req.currency,
            "receipt": f"receipt_{int(time.time())}",
            "payment_capture": 1
        }
        order = rzp_client.order.create(data=order_data)
        
        return {
            "success": True,
            "orderId": order['id'],
            "keyId": RAZORPAY_KEY_ID,
            "amount": order['amount']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateStripeSessionRequest(BaseModel):
    amount: int
    currency: str = "inr"
    transaction_id: str

@router.post("/payment/create-stripe-session")
def create_stripe_session(req: CreateStripeSessionRequest):
    """Creates a Stripe Checkout Session for dynamic fallback routing."""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': req.currency,
                    'unit_amount': req.amount * 100, # Stripe expects paise/cents
                    'product_data': {
                        'name': 'Premium Subscription (Fallback)',
                        'description': f'Retry for failed transaction {req.transaction_id}',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url="http://localhost:5173/?success=true",
            cancel_url="http://localhost:5173/agent",
            metadata={'original_transaction_id': req.transaction_id}
        )
        return {"success": True, "sessionId": session.id, "url": session.url}
    except Exception as e:
        print(f"[Stripe] Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhooks/razorpay")
async def razorpay_webhook(request: Request, background_tasks: BackgroundTasks):
    """Listens for Razorpay webhooks (specifically payment.failed)."""
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    
    print(f"[Webhook] Received webhook. Signature: {signature}")
    
    # Verify the webhook signature
    try:
        rzp_client.utility.verify_webhook_signature(
            payload.decode('utf-8'), 
            signature, 
            RAZORPAY_WEBHOOK_SECRET
        )
        print("[Webhook] Signature verified successfully!")
    except razorpay.errors.SignatureVerificationError:
        print("[Webhook] Signature verification failed!")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"[Webhook] Error during verification: {e}")
        raise HTTPException(status_code=500, detail="Server Error")

    event = await request.json()
    print(f"[Webhook] Event type received: {event.get('event')}")
    
    # We only care about failed payments for the agent
    if event.get("event") == "payment.failed":
        payment_entity = event["payload"]["payment"]["entity"]
        
        # Extract Razorpay error details
        error_code = payment_entity.get("error_code", "unknown_error")
        error_reason = payment_entity.get("error_reason", "unknown_reason")
        error_description = payment_entity.get("error_description", "Payment failed")
        
        amount_inr = payment_entity.get("amount", 0) / 100
        
        # We now handle failure reporting directly from the frontend (StorePage.jsx -> /payment/report-failure)
        # This provides richer customer data (phone/email typed in the form) and avoids double-processing.
        print(f"[Webhook] Payment failed ({error_reason}), but ignoring here to prevent duplicate processing. Frontend will handle it.")
        
    return {"status": "ok"}

class ReportFailureRequest(BaseModel):
    razorpay_payment_id: str = ""
    error_code: str = "unknown_error"
    error_reason: str = "unknown_reason"
    error_description: str = "Payment failed"
    amount: int = 0
    method: str = "card"
    bank: str = "Unknown"
    email: str = "guest@example.com"
    phone: str = "9000090000"

@router.post("/payment/report-failure")
async def report_payment_failure(req: ReportFailureRequest):
    """
    Called directly by the frontend when Razorpay JS SDK fires payment.failed callback.
    This bypasses the webhook entirely — no tunnel needed.
    """
    print(f"[ReportFailure] Payment failed! ID: {req.razorpay_payment_id}, Reason: {req.error_reason}")
    
    amount_inr = req.amount / 100 if req.amount > 0 else 5000  # Razorpay sends in paise
    
    # Transform into our RevenueGuard transaction format
    txn = {
        'id': f"txn_{uuid.uuid4().hex[:14]}",
        'razorpayPaymentId': req.razorpay_payment_id,
        'amount': amount_inr,
        'currency': 'INR',
        'status': 'failed',
        'timestamp': str(time.time()),
        'paymentMethod': req.method,
        'bankName': req.bank,
        'gateway': 'Razorpay',
        'customerInfo': {
            'id': req.email,
            'phone': req.phone,
            'isRepeat': False,
            'previousAttempts': 1
        },
        'errorDetails': {
            'code': req.error_code,
            'reason': req.error_reason,
            'message': req.error_description
        }
    }
    
    # 1. Store the transaction
    transaction_store.add_entry(txn)
    
    # 2. Trigger the AI Agent Orchestrator (run inline so we can return the URL immediately)
    try:
        print(f"[ReportFailure] Starting orchestrator for {txn['id']}...", flush=True)
        results = await orchestrator.process_batch([txn])
        print(f"[ReportFailure] Orchestrator completed! Results: {results}", flush=True)
        sse_manager.broadcast({
            'type': 'BATCH_COMPLETE',
            'results': results
        })
    except Exception as e:
        print(f"[ReportFailure] ❌ Orchestrator error: {e}", flush=True)
        import traceback
        traceback.print_exc()
    
    return {
        "success": True, 
        "message": "Failure reported — agent triggered!", 
        "transactionId": txn['id'],
        "fallbackUrl": txn.get('fallbackUrl')
    }

