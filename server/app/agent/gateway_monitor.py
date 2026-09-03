import asyncio
import time
import os
import httpx
from ..api.sse_manager import sse_manager

class GatewayMonitor:
    def __init__(self):
        self.status = {
            'razorpay': {'healthy': True, 'lastChecked': None, 'latencyMs': 0, 'errorRate': 0},
            'stripe': {'healthy': True, 'lastChecked': None, 'latencyMs': 0, 'errorRate': 0}
        }
        self._running = False
    
    async def check_razorpay(self):
        """Ping Razorpay's API to check if it's responding."""
        try:
            start = time.time()
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Use Razorpay's public API endpoint that doesn't need auth
                resp = await client.get("https://api.razorpay.com/v1/", auth=(
                    os.getenv("RAZORPAY_KEY_ID", ""),
                    os.getenv("RAZORPAY_KEY_SECRET", "")
                ))
            latency = round((time.time() - start) * 1000)
            # Razorpay returns 406 or 401 if bad key, but the server IS responding
            healthy = resp.status_code in [200, 401, 403, 406]
            return {'healthy': healthy, 'latencyMs': latency, 'statusCode': resp.status_code}
        except Exception as e:
            print(f"[GatewayMonitor] Razorpay health check failed: {e}", flush=True)
            return {'healthy': False, 'latencyMs': -1, 'error': str(e)}
    
    async def check_stripe(self):
        """Ping Stripe's API to check if it's responding."""
        try:
            start = time.time()
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://api.stripe.com/v1/balance", headers={
                    "Authorization": f"Bearer {os.getenv('STRIPE_SECRET_KEY', '')}"
                })
            latency = round((time.time() - start) * 1000)
            healthy = resp.status_code in [200, 401, 403]
            return {'healthy': healthy, 'latencyMs': latency, 'statusCode': resp.status_code}
        except Exception as e:
            print(f"[GatewayMonitor] Stripe health check failed: {e}", flush=True)
            return {'healthy': False, 'latencyMs': -1, 'error': str(e)}
    
    async def run_check(self):
        """Run health checks on all gateways and broadcast results."""
        rzp_result, stripe_result = await asyncio.gather(
            self.check_razorpay(),
            self.check_stripe()
        )
        
        now = time.strftime('%H:%M:%S')
        
        self.status['razorpay'].update({
            'healthy': rzp_result['healthy'],
            'lastChecked': now,
            'latencyMs': rzp_result['latencyMs']
        })
        self.status['stripe'].update({
            'healthy': stripe_result['healthy'],
            'lastChecked': now,
            'latencyMs': stripe_result['latencyMs']
        })
        
        # Broadcast to frontend
        sse_manager.broadcast({
            'type': 'GATEWAY_HEALTH',
            'gateways': self.status
        })
        
        # Log warnings
        if not rzp_result['healthy']:
            print(f"[GatewayMonitor] ⚠️ Razorpay is DOWN at {now}", flush=True)
        if not stripe_result['healthy']:
            print(f"[GatewayMonitor] ⚠️ Stripe is DOWN at {now}", flush=True)
    
    async def start_monitoring(self, interval_seconds=30):
        """Background loop that checks gateway health every N seconds."""
        self._running = True
        print(f"[GatewayMonitor] Started health monitoring (every {interval_seconds}s)", flush=True)
        while self._running:
            await self.run_check()
            await asyncio.sleep(interval_seconds)
    
    def stop(self):
        self._running = False
    
    def get_status(self):
        return self.status

gateway_monitor = GatewayMonitor()
