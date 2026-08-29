from .synthetic_generator import generate_batch
from .transaction_store import transaction_store

def seed_database(size=500):
    transaction_store.transactions.clear()
    batch = generate_batch(size)
    transaction_store.add_transactions(batch)
    return batch
