import time
from collections import deque
from ..api.sse_manager import sse_manager

class Detector:
    def __init__(self):
        self.degradation_windows = {
            'by_bank': {},
            'by_bin': {}
        }
        # Keep 1 hour of history
        self.window_ms = 60 * 60 * 1000
        
    def detect(self, transaction):
        """
        Rule-based detection for hard failures.
        """
        txn_id = transaction['id']
        status = transaction['status']
        
        # 1. Hard failures
        if status == 'failed':
            error_details = transaction.get('errorDetails', {})
            reason = error_details.get('reason')
            code = error_details.get('code')
            
            if reason == 'INSUFFICIENT_FUNDS':
                return { 'detected': True, 'riskType': 'SUBSCRIPTION_RISK', 'priority': 'HIGH' }
            
            if code == 'gateway_timeout' or reason == 'PROCESSOR_DOWN':
                return { 'detected': True, 'riskType': 'GATEWAY_DEGRADATION', 'priority': 'CRITICAL' }
                
            return { 'detected': True, 'riskType': 'PAYMENT_FAILURE', 'priority': 'MEDIUM' }
            
        # 2. Abandoned checkouts
        if status == 'abandoned':
            return { 'detected': True, 'riskType': 'CHECKOUT_DROPOFF', 'priority': 'MEDIUM' }
            
        return { 'detected': False }
        
    def track_and_detect_degradation(self, transaction):
        """
        Statistical anomaly detection using sliding windows.
        """
        now = int(time.time() * 1000)
        status = transaction['status']
        bank = transaction.get('bankName')
        bin = transaction.get('cardBin')
        
        self._record('by_bank', bank, status, now)
        if bin:
            self._record('by_bin', bin, status, now)
            
        bank_stats = self._get_stats('by_bank', bank, now)
        if bank_stats and bank_stats['total'] >= 10 and bank_stats['successRate'] < 50:
            sse_manager.broadcast({
                'type': 'DEGRADATION_DETECTED',
                'dimension': 'bank',
                'value': bank,
                'stats': bank_stats
            })
            
    def _record(self, category, key, status, now):
        if not key:
            return
            
        if key not in self.degradation_windows[category]:
            self.degradation_windows[category][key] = deque()
            
        self.degradation_windows[category][key].append({'status': status, 'time': now})
        
        # Cleanup old entries
        while self.degradation_windows[category][key] and (now - self.degradation_windows[category][key][0]['time'] > self.window_ms):
            self.degradation_windows[category][key].popleft()
            
    def _get_stats(self, category, key, now):
        if not key or key not in self.degradation_windows[category]:
            return None
            
        window = self.degradation_windows[category][key]
        if not window:
            return None
            
        successes = sum(1 for x in window if x['status'] == 'success')
        total = len(window)
        
        return {
            'successRate': (successes / total) * 100 if total > 0 else 0,
            'total': total,
            'successes': successes
        }

detector = Detector()
