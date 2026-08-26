import useSSE from '../hooks/useSSE';
import ActivityFeed from '../components/Agent/ActivityFeed';
import BatchSimulator from '../components/Agent/BatchSimulator';

export default function AgentPage() {
  const { events, connected, clearEvents } = useSSE('http://localhost:3001/api/events');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div>
        <h1>Agent Console</h1>
        <p className="subtitle">
          {connected ? '🟢 Connected to Agent Engine' : '🔴 Disconnected from Agent Engine'}
        </p>
      </div>

      <div className="agent-grid">
        <ActivityFeed events={events} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <BatchSimulator onClearFeed={clearEvents} />
          
          <div className="glass-card">
             <div className="chart-header" style={{ marginBottom: '1rem' }}>
              <h2>Agent Intel</h2>
              <span className="subtitle">Real-time stats for current batch</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Events Processed</span>
                 <span style={{ fontWeight: 600 }}>{events.length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Avg AI Confidence</span>
                 <span style={{ fontWeight: 600, color: 'var(--info)' }}>
                   {Math.round(events.filter(e => e.type === 'DIAGNOSED').reduce((acc, curr) => acc + (curr.diagnosis?.confidence || 0), 0) / (events.filter(e => e.type === 'DIAGNOSED').length || 1))}%
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
