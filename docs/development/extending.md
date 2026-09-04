# Extending X.A.V.I.E.R.

Because X.A.V.I.E.R. is built with a highly modular architecture, extending it to support new recovery strategies or payment gateways is straightforward.

## Adding a New Recovery Action

Actions are the specific API integrations (like sending an email or generating a Stripe session) located in `server/app/agent/actions.py`.

1. **Define the Action:**
   Create a new async function in `actions.py`. It must accept `(transaction, diagnosis, spend_tracker)`.

   ```python
   async def action_whatsapp_nudge(transaction, diagnosis, spend_tracker):
       spend_tracker('whatsapp_fee', 1.5)
       
       # ... implement WhatsApp API logic here ...
       
       return {
           'actionType': 'WHATSAPP_NUDGE',
           'success': True,
           'cost': 1.5
       }
   ```

2. **Map it to a Strategy:**
   In `server/app/agent/strategies.py`, use your new action inside an existing or new strategy.

   ```python
   @staticmethod
   async def checkout_dropoff(transaction, diagnosis, spend_tracker):
       # If VIP, use WhatsApp instead of Email
       if transaction.get('customerTier') == 'VIP':
           return await action_whatsapp_nudge(transaction, diagnosis, spend_tracker)
       return await action_nudge(transaction, diagnosis, spend_tracker)
   ```

## Adding a New Governance Rule

If you want to add a new safety constraint (e.g., "Do not send nudges after 10 PM"):

1. Open `server/app/governance/rules.py`.
2. Add your logic to `can_proceed()` or `should_escalate()`.

   ```python
   def can_proceed(self):
       if self.kill_switch_active: return False
       if self.current_spend >= self.daily_budget: return False
       
       # New Rule
       from datetime import datetime
       if datetime.now().hour >= 22:
           return False # Too late to nudge
           
       return True
   ```
