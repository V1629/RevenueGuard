import random
import uuid
from datetime import datetime, timedelta

# Realistic distributions for a payment gateway
ERROR_CODES = {
    'card_declined': {'weight': 40, 'reasons': ['INSUFFICIENT_FUNDS', 'RISK_REJECT', 'EXPIRED_CARD']},
    'gateway_timeout': {'weight': 25, 'reasons': ['ACQUIRER_TIMEOUT', 'PROCESSOR_DOWN', 'NETWORK_ERROR']},
    'authentication_failed': {'weight': 15, 'reasons': ['3DS_FAILED', 'OTP_TIMEOUT', 'INVALID_PIN']},
    'checkout_friction': {'weight': 20, 'reasons': ['USER_ABANDONED', 'PAGE_CRASH', 'PAYMENT_METHOD_UNAVAILABLE']}
}

BANKS = [
    {'name': 'HDFC Bank', 'weight': 35},
    {'name': 'ICICI Bank', 'weight': 25},
    {'name': 'SBI', 'weight': 20},
    {'name': 'Axis Bank', 'weight': 15},
    {'name': 'Kotak Mahindra', 'weight': 5}
]

PAYMENT_METHODS = [
    {'type': 'UPI', 'weight': 55},
    {'type': 'Credit Card', 'weight': 25},
    {'type': 'Debit Card', 'weight': 15},
    {'type': 'NetBanking', 'weight': 5}
]

GATEWAYS = ['Razorpay', 'Cashfree', 'PayU', 'Stripe']

def weighted_choice(choices):
    total = sum(c['weight'] for c in choices)
    r = random.uniform(0, total)
    upto = 0
    for c in choices:
        if upto + c['weight'] >= r:
            return c
        upto += c['weight']
    return choices[-1]

def generate_transaction(status):
    """
    Generate a single synthetic transaction with realistic attributes.
    status can be 'success', 'failed', or 'abandoned'.
    """
    is_failed = status == 'failed'
    is_abandoned = status == 'abandoned'
    
    bank = weighted_choice(BANKS)['name']
    method = weighted_choice(PAYMENT_METHODS)['type']
    # Keep amounts small so the ₹5000 Razorpay test causes a huge visible spike
    amount = random.randint(1, 10) * 100
    
    # Generate timestamp within the last 24 hours
    timestamp = datetime.now() - timedelta(hours=random.uniform(0, 24))
    
    txn = {
        'id': f"txn_{uuid.uuid4().hex[:14]}",
        'amount': amount,
        'currency': 'INR',
        'status': status,
        'timestamp': str(timestamp.timestamp()),
        'paymentMethod': method,
        'bankName': bank,
        'cardBin': f"{random.randint(400000, 599999)}" if 'Card' in method else None,
        'gateway': random.choice(GATEWAYS),
        'customerInfo': {
            'id': f"cus_{uuid.uuid4().hex[:8]}",
            'isRepeat': random.random() > 0.6,
            'previousAttempts': random.randint(1, 4) if is_failed else 0,
            'ltv': random.choice([5000, 12000, 25000, 50000, 80000, 150000]),
        },
        'metadata': {
            'device': random.choice(['mobile', 'desktop', 'tablet']),
            'os': random.choice(['iOS', 'Android', 'Windows', 'macOS'])
        }
    }
    
    if is_failed:
        error_category = list(ERROR_CODES.keys())[random.randint(0, len(ERROR_CODES)-1)]
        error_category_obj = ERROR_CODES[error_category]
        reason = random.choice(error_category_obj['reasons'])
        
        txn['errorDetails'] = {
            'code': error_category,
            'message': f"Transaction failed due to {reason.replace('_', ' ').lower()}",
            'reason': reason
        }
        
    if is_abandoned:
        txn['errorDetails'] = {
            'code': 'checkout_abandoned',
            'message': 'User dropped off at payment page without completing',
            'reason': 'USER_ABANDONED'
        }
        
    return txn

def generate_batch(size=50):
    """
    Generate a batch of transactions with a realistic status distribution.
    ~60% success, ~25% failed, ~15% abandoned.
    """
    batch = []
    for _ in range(size):
        r = random.random()
        if r < 0.60:
            status = 'success'
        elif r < 0.85:
            status = 'failed'
        else:
            status = 'abandoned'
            
        batch.append(generate_transaction(status))
        
    return batch
