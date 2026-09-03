export default function ArchitectureSection() {
  return (
    <section className="section" style={{ background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="landing-container">
        <h2 className="section-title text-gradient">How the Agent operates.</h2>
        <p className="landing-subtitle" style={{ margin: '0 0 3rem 0', textAlign: 'left' }}>
          An orchestration layer built with the Google Antigravity framework.
        </p>

        <div className="arch-timeline">
          <div className="arch-step">
            <div className="arch-dot">1</div>
            <div className="arch-content">
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 600 }}>The Detector</h4>
              <p style={{ color: '#A1A1AA', fontSize: '0.95rem' }}>
                Hooks into your payment webhook feeds. It ingests thousands of events and filters out the noise to identify true checkout failures or gateway degradation events.
              </p>
            </div>
          </div>

          <div className="arch-step">
            <div className="arch-dot">2</div>
            <div className="arch-content">
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 600 }}>The Diagnoser (LLM)</h4>
              <p style={{ color: '#A1A1AA', fontSize: '0.95rem' }}>
                Takes the raw failure trace and parses it through a Groq-accelerated LLM. It maps obscure bank codes (like 'ERR_59_DS') to real-world reasons (e.g., "Card Expired").
              </p>
            </div>
          </div>

          <div className="arch-step">
            <div className="arch-dot">3</div>
            <div className="arch-content">
              <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 600 }}>The Orchestrator</h4>
              <p style={{ color: '#A1A1AA', fontSize: '0.95rem' }}>
                The brain of the system. Based on the diagnosis and the customer's LTV tier, the Orchestrator executes a recovery strategy. It can trigger smart retries, human escalations, or automated AI nudges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
