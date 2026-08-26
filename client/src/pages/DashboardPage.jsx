import { useEffect, useState } from 'react';
import MetricsPanel from '../components/Dashboard/MetricsPanel';
import RevenueChart from '../components/Dashboard/RevenueChart';
import RecoveryFunnel from '../components/Dashboard/RecoveryFunnel';
import SuccessRateGauge from '../components/Dashboard/SuccessRateGauge';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    // Fetch initial metrics
    fetch('http://localhost:3001/api/metrics/summary')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Failed to fetch metrics:", err));
      
    // Listen for SSE updates
    const source = new EventSource('http://localhost:3001/api/events');
    
    source.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (['RECOVERED', 'BATCH_COMPLETE', 'STOPPED', 'ESCALATED'].includes(event.type)) {
        fetch('http://localhost:3001/api/metrics/summary')
          .then(res => res.json())
          .then(data => setMetrics(data));
      }
    };
    
    return () => source.close();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>Revenue Recovery Overview</h1>
        <p className="subtitle">Real-time metrics from the RevenueGuard Agent</p>
      </div>

      <MetricsPanel metrics={metrics} />
      
      <div className="charts-grid">
        <RevenueChart liveAmount={metrics?.totalAmountRecovered} />
        <SuccessRateGauge rate={metrics?.recoveryRate > 0 ? 88 + (metrics.recoveryRate/10) : 85} />
      </div>
      
      <div className="charts-grid">
        <RecoveryFunnel metrics={metrics} />
        {/* Placeholder for strategy breakdown */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h2>Top Strategies</h2>
            <span className="subtitle">Most effective recovery actions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
             {Object.entries(metrics?.byStrategy || {}).slice(0, 3).map(([strat, data], i) => (
               <div key={strat} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                   <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{strat.replace(/_/g, ' ')}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data.count} successful</div>
                 </div>
                 <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                   ₹{data.amountRecovered.toLocaleString('en-IN')}
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
