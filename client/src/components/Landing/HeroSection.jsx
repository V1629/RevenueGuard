import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="section" style={{ paddingTop: '12rem', textAlign: 'center' }}>
      <div className="landing-container">
        <h1 className="landing-title">
          Stop losing revenue to<br />failed payments.
        </h1>
        <p className="landing-subtitle">
          X.A.V.I.E.R. is an autonomous AI agent that sits between your payment gateways. 
          When a transaction fails, it instantly diagnoses the issue, routes around downtime, 
          and intelligently recovers lost customers—all without human intervention.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/dashboard" className="landing-btn landing-btn-primary">
            Enter Dashboard
          </Link>
          <a href="#features" className="landing-btn landing-btn-secondary">
            See How It Works
          </a>
        </div>
        
        {/* Placeholder for the user's dashboard screenshot */}
        <div style={{ marginTop: '5rem', position: 'relative' }}>
          <div className="image-placeholder" style={{ height: '500px', fontSize: '1.2rem' }}>
            [User will insert beautiful Dashboard screenshot here]
          </div>
          {/* Subtle glow behind the image */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%',
            background: 'var(--accent-primary)',
            filter: 'blur(120px)',
            opacity: 0.15,
            zIndex: -1
          }}></div>
        </div>
      </div>
    </section>
  );
}
