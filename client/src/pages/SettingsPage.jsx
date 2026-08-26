import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, AlertOctagon, TrendingUp, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [governance, setGovernance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGovernance = () => {
    setLoading(true);
    fetch('http://localhost:3001/api/governance/status')
      .then(res => res.json())
      .then(data => setGovernance(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGovernance();
  }, []);

  if (loading && !governance) return <div style={{ padding: '2rem' }}>Loading governance config...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Governance & Guardrails</h1>
          <p className="subtitle">Configure AI agent operational limits and stopping rules</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchGovernance} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Spend Limits */}
        <div className="glass-card">
          <div className="chart-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} className="text-info" />
              Daily Spend Limit
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Daily Budget</span>
              <span style={{ fontWeight: 600 }}>₹{governance?.spendLimits?.dailyLimit.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Spend</span>
              <span style={{ fontWeight: 600, color: 'var(--warning)' }}>₹{governance?.spendLimits?.currentSpend.toLocaleString('en-IN')}</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <motion.div 
                style={{ height: '100%', background: 'var(--accent-primary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${governance?.spendLimits?.utilizationPercent || 0}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {governance?.spendLimits?.utilizationPercent || 0}% utilized
            </div>
          </div>
        </div>

        {/* Kill Switch Status */}
        <div className="glass-card" style={{ borderColor: governance?.killSwitch?.active ? 'var(--danger)' : 'var(--border-glass)' }}>
          <div className="chart-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertOctagon size={20} className={governance?.killSwitch?.active ? "text-danger" : "text-success"} />
              Kill Switch Status
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span className={`badge ${governance?.killSwitch?.active ? 'badge-danger' : 'badge-success'}`}>
                {governance?.killSwitch?.active ? 'HALTED' : 'ACTIVE'}
              </span>
            </div>
            {governance?.killSwitch?.active && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Killed By</span>
                  <span>{governance?.killSwitch?.killedBy}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Reason</span>
                  <span style={{ fontSize: '0.875rem' }}>{governance?.killSwitch?.reason}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Escalation Rules */}
        <div className="glass-card">
          <div className="chart-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} className="text-warning" />
              Escalation Rules
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {governance?.escalationRules?.map((rule) => (
              <div key={rule.id} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '2px solid var(--warning)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rule.name} (Priority {rule.priority})</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{rule.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stopping Rules */}
        <div className="glass-card">
          <div className="chart-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} className="text-danger" />
              Stopping Rules
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {governance?.stoppingRules?.map((rule) => (
              <div key={rule.id} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '2px solid var(--danger)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rule.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{rule.reason}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
