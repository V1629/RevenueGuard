import { useEffect, useState } from 'react';
import MetricsPanel from '../components/Dashboard/MetricsPanel';
import RevenueChart from '../components/Dashboard/RevenueChart';
import RecoveryFunnel from '../components/Dashboard/RecoveryFunnel';
import SuccessRateGauge from '../components/Dashboard/SuccessRateGauge';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const [gatewayHealth, setGatewayHealth] = useState(null);
  
  useEffect(() => {
    let source;
    
    // Fetch initial metrics
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/metrics/summary`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => {
        console.error("Failed to fetch metrics:", err);
        setError(err.message);
      });
      
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/gateway/health`)
      .then(res => res.json())
      .then(data => setGatewayHealth(data.gateways))
      .catch(() => {});
      
    // Listen for SSE updates
    try {
      source = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
      
      source.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (['RECOVERED', 'BATCH_COMPLETE', 'STOPPED', 'ESCALATED'].includes(event.type)) {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/metrics/summary`)
              .then(res => res.json())
              .then(data => setMetrics(data))
              .catch(() => {});
          }
          if (event.type === 'GATEWAY_HEALTH') {
            setGatewayHealth(event.gateways);
          }
        } catch (parseErr) {
          // Ignore malformed SSE events
        }
      };
      
      source.onerror = () => {
        // SSE connection lost — don't crash, just stop listening
        source.close();
      };
    } catch (e) {
      console.error("SSE connection failed:", e);
    }
    
    return () => {
      if (source) source.close();
    };
  }, []);

  // Safe derived values
  const recoveryRate = metrics?.recoveryRate || 0;
  // Use the true gateway success rate calculated by the backend
  const gaugeRate = metrics?.gatewaySuccessRate || 100;

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h1>Revenue Recovery Overview</h1>
          <p className="subtitle">Unable to connect to the backend. Is the server running on port 3001?</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>Revenue Recovery Overview</h1>
        <p className="subtitle">Real-time metrics from the X.A.V.I.E.R. Agent</p>
      </div>

      <MetricsPanel metrics={metrics} />
      
      {gatewayHealth && (
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Gateway Health</h3>
          {Object.entries(gatewayHealth).map(([name, info]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: info.healthy ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
                boxShadow: info.healthy ? '0 0 6px var(--success)' : '0 0 6px var(--danger)'
              }}></span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {info.latencyMs > 0 ? `${info.latencyMs}ms` : 'N/A'}
              </span>
            </div>
          ))}
          {gatewayHealth.razorpay?.lastChecked && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              Last checked: {gatewayHealth.razorpay.lastChecked}
            </span>
          )}
        </div>
      )}
      
      <div className="charts-grid">
        <RevenueChart timeline={metrics?.timeline || []} />
        <SuccessRateGauge rate={gaugeRate} />
      </div>
      
      <div className="charts-grid">
        <RecoveryFunnel metrics={metrics} />
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h2>Top Strategies</h2>
            <span className="subtitle">Most effective recovery actions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
             {Object.entries(metrics?.byStrategy || {}).slice(0, 3).map(([strat, data]) => (
               <div key={strat} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                   <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{strat.replace(/_/g, ' ')}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data.count} successful</div>
                 </div>
                 <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                   ₹{(data.amountRecovered || 0).toLocaleString('en-IN')}
                 </div>
               </div>
             ))}
             {(!metrics?.byStrategy || Object.keys(metrics.byStrategy).length === 0) && (
               <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                 No recoveries yet
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
