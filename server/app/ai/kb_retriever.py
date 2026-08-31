import json
import os

class KBRetriever:
    def __init__(self):
        self.entries = []
        self._load()
    
    def _load(self):
        """Load knowledge_base.json from the data directory into memory."""
        # Build the path relative to THIS file's location
        # This file is at: server/app/ai/kb_retriever.py
        # KB file is at:   server/app/data/knowledge_base.json
        kb_path = os.path.join(
            os.path.dirname(__file__),  # server/app/ai/
            '..', 'data', 'knowledge_base.json'  # server/app/data/knowledge_base.json
        )
        kb_path = os.path.abspath(kb_path)
        
        with open(kb_path, 'r') as f:
            data = json.load(f)
            self.entries = data.get('patterns', [])
        
        print(f"[KB] Loaded {len(self.entries)} knowledge base entries")
    
    def retrieve(self, transaction, top_k=3):
        """
        Retrieve the most relevant KB entries for a given transaction.
        
        Matching priority:
        1. EXACT MATCH on both errorCode AND reason (highest relevance)
        2. PARTIAL MATCH on just reason (medium relevance)
        3. PARTIAL MATCH on just errorCode (medium relevance)  
        4. TAG MATCH — check if any of the transaction's keywords appear 
           in the entry's tags (lowest relevance)
        
        Returns: list of up to top_k entries, sorted by relevance score descending.
        """
        error_details = transaction.get('errorDetails', {})
        txn_error_code = error_details.get('code', '')        # e.g., "card_declined"
        txn_reason = error_details.get('reason', '')          # e.g., "INSUFFICIENT_FUNDS"
        txn_message = error_details.get('message', '').lower()  # for tag matching
        
        scored = []
        
        for entry in self.entries:
            score = 0
            
            # Priority 1: Exact match on both errorCode AND reason
            if entry.get('errorCode') == txn_error_code and entry.get('reason') == txn_reason:
                score = 100
            # Priority 2: Match on reason only
            elif entry.get('reason') == txn_reason:
                score = 75
            # Priority 3: Match on errorCode only
            elif entry.get('errorCode') == txn_error_code:
                score = 50
            # Priority 4: Tag-based matching
            else:
                entry_tags = entry.get('tags', [])
                # Build search terms from the transaction
                search_terms = txn_reason.lower().replace('_', ' ').split()
                search_terms += txn_message.split()
                
                matching_tags = sum(1 for tag in entry_tags if tag in search_terms)
                if matching_tags > 0:
                    score = 10 * matching_tags  # More matching tags = higher score
            
            if score > 0:
                scored.append((score, entry))
        
        # Sort by score descending, take top_k
        scored.sort(key=lambda x: x[0], reverse=True)
        results = [entry for _, entry in scored[:top_k]]
        
        return results
    
    def format_for_prompt(self, entries):
        """
        Convert a list of KB entries into a formatted string 
        suitable for injection into the LLM prompt.
        
        Example output:
        
        ### KB-001 | INSUFFICIENT_FUNDS (Card Declined)
        - Description: Cardholder's account has insufficient balance
        - Root Cause: Issuing bank returned code 51...
        - Best Strategy: SUBSCRIPTION_RECOVERY
        - Recommended Actions: 1) Wait 24h... 2) Send nudge...
        - Historical Success Rate: 35%
        - Retry Window: 24h
        - RBI Guideline: RBI mandates max 3 retries...
        """
        if not entries:
            return "No matching patterns found in knowledge base."
        
        formatted_parts = []
        
        for entry in entries:
            actions = "\n    ".join(
                f"{i+1}. {a}" for i, a in enumerate(entry.get('recommendedActions', []))
            )
            
            rbi = entry.get('rbiGuideline') or 'None applicable'
            
            part = f"""### {entry['id']} | {entry.get('reason', 'UNKNOWN')} ({entry.get('category', '')})
- Description: {entry.get('description', 'N/A')}
- Root Cause: {entry.get('rootCause', 'N/A')}
- Best Strategy: {entry.get('bestStrategy', 'N/A')}
- Recommended Actions:
    {actions}
- Historical Success Rate: {entry.get('historicalSuccessRate', 'N/A')}%
- Optimal Retry Window: {entry.get('retryWindow', 'N/A')}
- Max Retries: {entry.get('maxRetries', 'N/A')}
- RBI Guideline: {rbi}"""
            
            formatted_parts.append(part)
        
        return "\n\n".join(formatted_parts)


# Singleton instance — loaded once at import time
kb_retriever = KBRetriever()
