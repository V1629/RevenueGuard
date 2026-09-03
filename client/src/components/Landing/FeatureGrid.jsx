import React from 'react';

export default function FeatureGrid() {
  return (
    <section id="features" className="section">
      <div className="landing-container">
        <h2 className="section-title text-gradient">Engineered for recovery.</h2>
        <p className="landing-subtitle" style={{ margin: '0 0 3rem 0', textAlign: 'left' }}>
          Traditional payment infrastructure is static. X.A.V.I.E.R. is dynamic, making real-time decisions to save your conversions before the customer leaves.
        </p>

        <div className="bento-grid">
          <div className="bento-item large">
            <div className="bento-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="bento-title">Multi-Gateway Health Monitor</h3>
            <p className="bento-desc">
              X.A.V.I.E.R. constantly monitors the pulse of your payment gateways. If Razorpay experiences latency spikes or downtime, traffic is instantly and seamlessly routed to Stripe. No dropped checkouts, no lost revenue.
            </p>
            <div className="image-placeholder" style={{ height: '150px' }}>
              [Insert Gateway Health Banner Screenshot]
            </div>
          </div>

          <div className="bento-item">
            <div className="bento-icon" style={{ color: 'var(--success)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10M18 20V4M6 20v-4"/>
              </svg>
            </div>
            <h3 className="bento-title">VIP Customer Segmentation</h3>
            <p className="bento-desc">
              Not all failed payments are equal. We calculate Customer Lifetime Value (LTV) on the fly. When a high-ticket enterprise client fails a payment, X.A.V.I.E.R. escalates to a human account manager instead of sending an automated SMS.
            </p>
          </div>

          <div className="bento-item">
            <div className="bento-icon" style={{ color: 'var(--accent-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="bento-title">Hyper-Personalized Nudges</h3>
            <p className="bento-desc">
              For regular failures, the AI generates personalized email and SMS nudges. It provides exactly the right context and a one-click recovery link, tracking conversion rates in real-time.
            </p>
          </div>

          <div className="bento-item large">
            <div className="bento-icon" style={{ color: '#8b5cf6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 className="bento-title">Agentic Diagnosis Engine</h3>
            <p className="bento-desc">
              Powered by LLMs, the engine reads cryptic bank error codes and translates them into actionable intelligence. It knows the difference between "Insufficient Funds" and "Gateway Timeout" and applies the exact right recovery strategy.
            </p>
            <div className="image-placeholder" style={{ height: '150px' }}>
              [Insert Agent Console LLM Analysis Screenshot]
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
