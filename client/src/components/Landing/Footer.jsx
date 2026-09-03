export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 0 2rem 0', marginTop: '4rem' }}>
      <div className="landing-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#fff' }}>
          <div style={{ width: 16, height: 16, background: 'var(--accent-primary)', borderRadius: 4 }}></div>
          X.A.V.I.E.R.
        </div>
        <p style={{ color: '#52525b', fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} Revenue Recovery Agent. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
