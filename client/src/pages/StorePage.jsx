import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle, ShieldAlert, CreditCard, Zap, Shield, Globe, AlertTriangle } from 'lucide-react';
import { toast } from '../components/Layout/NotificationToast';

// ─── Product tiers, each demonstrates a different X.A.V.I.E.R. feature ───
const PRODUCTS = [
  {
    id: 'starter',
    name: 'Starter Plan',
    price: 999,
    color: '#22c55e',
    icon: Zap,
    tag: 'AI Diagnosis + Smart Retry',
    tagColor: 'var(--success)',
    description: 'Perfect for individual creators who want access to core tools.',
    features: ['Basic dashboard', '5 projects', 'Email support'],
    demoNote: 'Fails → Agent diagnoses the error with AI → Attempts a smart retry → Recovers the payment.',
  },
  {
    id: 'growth',
    name: 'Growth Plan',
    price: 5000,
    color: '#3b82f6',
    icon: CreditCard,
    tag: 'Recovery Nudge Link',
    tagColor: 'var(--info)',
    description: 'For growing teams that need collaboration and automation.',
    features: ['Everything in Starter', 'Unlimited projects', 'Priority support'],
    demoNote: 'Fails → AI diagnoses → Retry fails → Agent sends a recovery nudge link to the customer.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 60000,
    color: '#f59e0b',
    icon: Shield,
    tag: 'Human Escalation Rule',
    tagColor: 'var(--warning)',
    description: 'Mission-critical infrastructure for large organizations.',
    features: ['Everything in Growth', 'Dedicated account manager', 'Custom SLAs'],
    demoNote: 'Fails → Amount exceeds ₹50K threshold → Governance rule triggers → Escalated to human support.',
  },
  {
    id: 'outage',
    name: 'Gateway Stress Test',
    price: 5000,
    color: '#ef4444',
    icon: Globe,
    tag: 'Dynamic Stripe Routing',
    tagColor: 'var(--danger)',
    description: 'Simulates a complete Razorpay server outage mid-checkout.',
    features: ['Bypasses Razorpay entirely', 'Routes to Stripe fallback', 'Zero downtime for customer'],
    demoNote: 'Razorpay timeout → Agent detects degradation → Instantly generates a Stripe checkout link.',
    isOutageTest: true,
  },
];

export default function StorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // track which product is loading
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('gaurav.kumar@example.com');
  const [customerPhone, setCustomerPhone] = useState('9000090000');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleCheckout = async (product) => {
    if (product.isOutageTest) {
      return handleSimulateOutage(product);
    }

    if (!scriptLoaded) {
      toast('Razorpay SDK is still loading...', 'error');
      return;
    }

    setLoading(product.id);
    try {
      const res = await fetch('http://localhost:3001/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: product.price, currency: 'INR' })
      });

      const data = await res.json();
      if (!data.success) throw new Error("Failed to create order");

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "X.A.V.I.E.R. (Demo)",
        description: product.name,
        order_id: data.orderId,
        handler: function (response) {
          toast(`Payment Successful! ID: ${response.razorpay_payment_id}`, 'success');
        },
        prefill: { name: "Gaurav Kumar", email: customerEmail, contact: customerPhone },
        theme: { color: product.color }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async function (response) {
        console.error("Payment Failed", response.error);
        toast(`Payment Failed: ${response.error.reason}. Agent triggered!`, 'error');
        rzp.close();

        try {
          await fetch('http://localhost:3001/api/payment/report-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.error.metadata?.payment_id || '',
              error_code: response.error.code || 'BAD_REQUEST_ERROR',
              error_reason: response.error.reason || 'payment_failed',
              error_description: response.error.description || 'Payment processing failed',
              amount: data.amount,
              method: response.error.metadata?.method || 'card',
              bank: response.error.metadata?.bank || 'Unknown',
              email: customerEmail,
              phone: customerPhone
            })
          });
        } catch (err) {
          console.error("Failed to report to backend:", err);
        }

        setTimeout(() => { window.location.href = '/agent'; }, 600);
      });

      rzp.open();
    } catch (e) {
      console.error(e);
      toast('Could not initiate checkout. Is the backend running?', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleSimulateOutage = async (product) => {
    setLoading(product.id);
    toast('Simulating a Razorpay server outage...', 'warning');

    try {
      const response = await fetch('http://localhost:3001/api/payment/report-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: 'pay_demo_timeout_' + Math.floor(Math.random() * 1000),
          error_code: 'gateway_timeout',
          error_reason: 'ACQUIRER_TIMEOUT',
          error_description: 'The payment request timed out between the gateway and the acquiring bank servers.',
          amount: product.price * 100,
          method: 'card',
          bank: 'HDFC',
          email: customerEmail,
          phone: customerPhone
        })
      });

      const data = await response.json();

      if (data.fallbackUrl) {
        window.location.href = data.fallbackUrl;
      } else {
        toast('Agent triggered! Check the Agent Console.', 'info');
        setTimeout(() => { window.location.href = '/agent'; }, 600);
      }
    } catch (err) {
      console.error("Failed to report outage:", err);
      toast('Failed to reach backend API', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1>X.A.V.I.E.R. Subscription Plans</h1>
      </div>

      {/* Customer Info */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customer Email</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customer Phone</label>
            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }} />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {PRODUCTS.map((product, i) => {
          const Icon = product.icon;
          const isLoading = loading === product.id;

          return (
            <motion.div
              key={product.id}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column', borderTop: `3px solid ${product.color}`, padding: '1.5rem' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Tag */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '100px',
                background: `${product.color}15`, color: product.tagColor, fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', width: 'fit-content' }}>
                <AlertTriangle size={12} />
                {product.tag}
              </div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Icon size={20} color={product.color} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{product.name}</h3>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: product.color, marginBottom: '0.5rem' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>{product.description}</p>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                {product.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <CheckCircle size={14} color={product.color} /> {f}
                  </li>
                ))}
              </ul>

              {/* Demo Note */}
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `3px solid ${product.color}`, marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: product.tagColor, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What happens on failure</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{product.demoNote}</div>
              </div>

              {/* Buy Button */}
              <button
                onClick={() => handleCheckout(product)}
                disabled={isLoading || loading !== null}
                style={{
                  width: '100%', padding: '0.75rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: product.isOutageTest ? `${product.color}20` : product.color,
                  color: product.isOutageTest ? product.color : '#fff',
                  border: product.isOutageTest ? `1px solid ${product.color}50` : 'none',
                  fontWeight: 600, fontSize: '0.9rem', transition: 'opacity 0.2s',
                  opacity: (loading !== null && !isLoading) ? 0.5 : 1,
                }}
              >
                {isLoading ? 'Processing...' : product.isOutageTest ? '⚡ Simulate Gateway Outage' : `Buy Now — ₹${product.price.toLocaleString('en-IN')}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Cheat Sheet */}
      <motion.div
        className="glass-card"
        style={{ border: '1px solid var(--warning)', padding: '1.5rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginTop: 0 }}>
          <ShieldAlert size={20} /> Tester Cheat Sheet
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Click any plan above and use these Razorpay test cards to force a payment failure. The AI agent will kick in automatically.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>Insufficient Funds</div>
            <code style={{ fontSize: '1rem', color: '#fff', letterSpacing: '1px' }}>4111 1111 1111 1111</code>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Any CVV · Any Future Expiry</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '0.25rem' }}>Bank Timeout / Decline</div>
            <code style={{ fontSize: '1rem', color: '#fff', letterSpacing: '1px' }}>4356 2011 1111 1111</code>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Any CVV · Any Future Expiry</div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong>Demo Flow:</strong> Pick a plan → Fail the payment → You'll be auto-redirected to the Agent Console to watch X.A.V.I.E.R. diagnose and recover in real-time.
        </div>
      </motion.div>
    </div>
  );
}
