import asyncio
from fastapi import APIRouter, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..data.transaction_store import transaction_store
from ..data.seed_data import seed_database
from ..data.audit_store import audit_store
from ..governance.rules import governance
from ..agent.orchestrator import orchestrator
from .sse_manager import sse_manager

router = APIRouter(prefix="/api")

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
    batch = seed_database(500)
    audit_store.clear()
    return {"success": True, "message": "Database seeded with 500 transactions", "transactions": len(batch)}

@router.get("/metrics/summary")
def get_metrics():
    txns = transaction_store.get_all_transactions()
    
    failed = [t for t in txns if t['status'] != 'success']
    recovered = [t for t in txns if t.get('agentStatus') == 'RECOVERED']
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
    
    return {
        "totalDetected": len(failed),
        "totalRecovered": len(recovered),
        "totalAmountAtRisk": total_amount_at_risk,
        "totalAmountRecovered": total_amount_recovered,
        "totalEscalated": len(escalated),
        "totalStopped": len(stopped),
        "byStrategy": by_strategy,
        "recoveryRate": round((len(recovered) / len(failed)) * 100) if failed else 0,
        "activeRecoveries": active_recoveries,
        "totalTransactions": len(txns),
        "totalRevenue": sum(t['amount'] for t in txns),
        "failedRevenue": total_amount_at_risk,
        "recoveredPercent": round((total_amount_recovered / sum(t['amount'] for t in txns)) * 100) if txns else 0
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
