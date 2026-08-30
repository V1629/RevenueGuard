import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Activity, FileText, Settings, ShieldAlert } from 'lucide-react';
import '../../styles/components.css';
import { ShoppingCart } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agent', label: 'Agent Console', icon: Activity },
  { path: '/audit', label: 'Audit Trail', icon: FileText },
  { path: '/simulator', label: 'Batch Simulator', icon: ShieldAlert },
  { path: '/settings', label: 'Governance', icon: Settings },
  { path: '/store', label: 'Store (Demo)', icon: ShoppingCart },
];

export default function Sidebar({ killSwitchActive = false }) {
  const location = useLocation();

  return (
    <motion.aside 
      className="sidebar"
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Activity size={20} />
        </div>
        <div className="logo-text">RevenueGuard</div>
      </div>

      <nav className="nav-links">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="active-indicator"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="agent-status-card">
        <div className="status-header">
          <span className="status-title">Agent Status</span>
        </div>
        <div className="status-indicator">
          <motion.div 
            className={`status-dot ${killSwitchActive ? 'halted' : 'active'}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span style={{ color: killSwitchActive ? 'var(--danger)' : 'var(--success)' }}>
            {killSwitchActive ? 'Halted' : 'Monitoring'}
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
