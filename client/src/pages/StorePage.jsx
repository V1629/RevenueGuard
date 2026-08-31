import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle, ShieldAlert, CreditCard } from 'lucide-react';
import { toast } from '../components/Layout/NotificationToast';

export default function StorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // New state for customer contact info
  const [customerEmail, setCustomerEmail] = useState('gaurav.kumar@example.com');
  const [customerPhone, setCustomerPhone] = useState('9000090000');

  useEffect(() => {
    // Load Razorpay Checkout Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async () => {
    if (!scriptLoaded) {
      toast('Razorpay SDK is still loading...', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create order on our backend
      const res = await fetch('http://localhost:3001/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5000, currency: 'INR' })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error("Failed to create order");

      // 2. Open Razorpay Checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Acme Corp (Demo)",
        description: "Premium Subscription",
        image: "https://example.com/your_logo",
        order_id: data.orderId,
        handler: function (response) {
          // This only runs on SUCCESS
          toast(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`, 'success');
        },
        prefill: {
          name: "Gaurav Kumar",
          email: customerEmail,
          contact: customerPhone
        },
        notes: {
          address: "Razorpay Corporate Office"
        },
        theme: {
          color: "#7289da" // Primary brand color
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', async function (response){
        // This runs on FAILURE — send the failure directly to our backend
        console.error("Payment Failed", response.error);
        toast(`Payment Failed: ${response.error.reason}. Agent triggered!`, 'error');
        
        // Report the failure directly to our backend (no webhook tunnel needed!)
        try {
          await fetch('http://localhost:3001/api/payment/report-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.error.metadata?.payment_id || '',
              error_code: response.error.code || 'BAD_REQUEST_ERROR',
              error_reason: response.error.reason || 'payment_failed',
              error_description: response.error.description || 'Payment processing failed',
              amount: data.amount, // amount in paise from the order
              method: response.error.metadata?.method || 'card',
              bank: response.error.metadata?.bank || 'Unknown',
              email: customerEmail,
              phone: customerPhone
            })
          });
          console.log("Failure reported to backend — agent triggered!");
          
          // Instantly redirect to the Agent Console so they can watch it happen live!
          navigate('/agent');
          
        } catch (err) {
          console.error("Failed to report to backend:", err);
        }
      });
      
      rzp.open();
    } catch (e) {
      console.error(e);
      toast('Could not initiate checkout. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      
      <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h1>Acme Corp Storefront</h1>
          <p className="subtitle">This is a simulated customer-facing website.</p>
        </div>

        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={24} /> Premium Subscription
            </h2>
            <h2 style={{ color: 'var(--success)' }}>₹5,000</h2>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="var(--success)" /> Unlimited access to all features</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="var(--success)" /> Priority 24/7 support</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="var(--success)" /> Advanced analytics</li>
          </ul>

          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
              <input 
                type="email" 
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number</label>
              <input 
                type="tel" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#fff' }}
              />
            </div>
          </div>

          <button 
            className="button-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Buy Now with Razorpay'}
          </button>
        </motion.div>
      </div>

      <div style={{ flex: '1 1 300px' }}>
        <motion.div 
          className="glass-panel"
          style={{ border: '1px solid var(--warning)', padding: '1.5rem', position: 'sticky', top: '100px' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginTop: 0 }}>
            <ShieldAlert size={20} /> Tester Cheat Sheet
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            To demonstrate RevenueGuard AI, click Buy Now and use one of these Test Cards to force a failure.
          </p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>Insufficient Funds (Code 51)</div>
              <code style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '1px' }}>4111 1111 1111 1111</code>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Any CVV, Any Future Expiry</div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--warning)', marginBottom: '0.25rem' }}>Bank Timeout / Decline</div>
              <code style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '1px' }}>4356 2011 1111 1111</code>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Any CVV, Any Future Expiry</div>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Demo Flow:</strong> Force a failure here, then instantly switch to the Dashboard tab to watch the AI catch the webhook and recover it!
          </div>
        </motion.div>
      </div>

    </div>
  );
}
