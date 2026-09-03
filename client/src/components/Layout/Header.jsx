import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertOctagon, RefreshCw, LayoutDashboard, Activity, FileText, Settings, ShieldAlert, ShoppingCart } from 'lucide-react';
import '../../styles/components.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agent', label: 'Console', icon: Activity },
  { path: '/settings', label: 'Governance', icon: Settings },
  { path: '/store', label: 'Store', icon: ShoppingCart },
];

export default function Header({ title = "X.A.V.I.E.R.", onKillSwitch, killSwitchActive, onResume }) {
  const location = useLocation();
  return (
    <nav className="navbar navbar-expand-lg navbar-light" style={{ 
      display: 'flex', alignItems: 'center', padding: '0 4rem', height: '80px', width: '100%',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
      background: 'rgba(30, 30, 42, 0.95)', /* Distinct shade from landing page */
      backdropFilter: 'blur(24px)', position: 'sticky', top: 0, zIndex: 40,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
    }}>
      <Link className="navbar-brand" to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none' }}>
        <div style={{ width: 28, height: 28, background: 'var(--accent-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Activity size={18} />
        </div>
        {title}
      </Link>
      
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarSupportedContent" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <ul className="navbar-nav mr-auto" style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0, marginLeft: '4rem' }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path} className={`nav-item ${isActive ? 'active' : ''}`} style={{ display: 'flex' }}>
                <Link className="nav-link" to={item.path} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600, /* Increased font size */
                  padding: '0.6rem 0.5rem', borderRadius: '6px',
                  background: isActive ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
                  borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
                }}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {isActive && <span className="sr-only" style={{ display: 'none' }}>(current)</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <form className="form-inline my-2 my-lg-0" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} onSubmit={(e) => e.preventDefault()}>
          <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" style={{ 
            padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-glass)', 
            background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.875rem' 
          }} />
          <button className="btn btn-outline-success my-2 my-sm-0" type="submit" style={{ 
            padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--success)', 
            color: 'var(--success)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 
          }}>Search</button>
          
          {killSwitchActive ? (
            <button type="button" className="btn btn-secondary" onClick={onResume} style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <RefreshCw size={16} /> Resume Agent
            </button>
          ) : (
            <button type="button" className="btn btn-danger" onClick={onKillSwitch} style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertOctagon size={16} /> Kill Switch
            </button>
          )}
        </form>
      </div>
    </nav>
  );
}
