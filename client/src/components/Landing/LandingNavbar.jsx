import { Link } from 'react-router-dom';

export default function LandingNavbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark landing-nav" style={{ width: '100%' }}>
      <div className="landing-container" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="navbar-brand nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
          <div style={{ width: 24, height: 24, background: 'var(--accent-primary)', borderRadius: 6 }}></div>
          X.A.V.I.E.R.
        </Link>
        
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#landingNavbarContent" aria-controls="landingNavbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="landingNavbarContent" style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingLeft: '2rem' }}>
          <ul className="navbar-nav mr-auto" style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link" style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/agent" className="nav-link" style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Agent Console</Link>
            </li>
            <li className="nav-item">
              <Link to="/settings" className="nav-link" style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Governance</Link>
            </li>
          </ul>
          
          <form className="form-inline my-2 my-lg-0" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} onSubmit={(e) => e.preventDefault()}>
            <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" style={{ 
              padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.875rem' 
            }} />
            <button className="btn btn-outline-success my-2 my-sm-0" type="submit" style={{ 
              padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--success)', 
              color: 'var(--success)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 
            }}>Search</button>
            <Link to="/dashboard" className="landing-btn landing-btn-secondary" style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
              Open Platform
            </Link>
          </form>
        </div>
      </div>
    </nav>
  );
}
