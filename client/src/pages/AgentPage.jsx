import { useEffect, useState } from 'react';
import useSSE from '../hooks/useSSE';
import ActivityFeed from '../components/Agent/ActivityFeed';
import BatchSimulator from '../components/Agent/BatchSimulator';
import { toast } from '../components/Layout/NotificationToast';

export default function AgentPage() {
  const { events, connected, clearEvents } = useSSE(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  
  // Fetch persisted audit log on mount so we always have past data
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/audit/entries`)
      .then(res => res.json())
      .then(data => {
        if (data.entries && data.entries.length > 0) {
          // Transform audit entries into the same shape as SSE events for the ActivityFeed
          const mapped = data.entries.map((entry, i) => {
            let type = 'DETECTED';
            if (entry.action === 'SMART_RETRY' || entry.action === 'ROUTE_SWITCH' || entry.action === 'NUDGE') {
              type = entry.result === 'Success' ? 'RECOVERED' : 'EXECUTING';
            } else if (entry.action === 'ESCALATION') {
              type = 'ESCALATED';
            } else if (entry.action === 'DIAGNOSIS') {
              type = 'DIAGNOSED';
            } else if (entry.action === 'LINK_CONVERSION') {
              type = 'RECOVERED';
            } else if (entry.action === 'GOVERNANCE_BLOCK') {
              type = 'STOPPED';
            }

            return {
              type,
              serverTimestamp: entry.timestamp,
              transaction: { amount: 0, riskType: entry.action },
              diagnosis: type === 'DIAGNOSED' ? { 
                failureReason: entry.details, 
                reasoning: entry.details, 
                confidence: 85, 
                suggestedStrategy: 'smart_retry',
                source: 'ai'
              } : null,
              strategy: entry.action,
              amountRecovered: 0,
              reason: entry.details,
              _fromAudit: true,
            };
          });
          setAuditEntries(mapped.reverse()); // newest first
        }
      })
      .catch(err => console.error('Failed to fetch audit log:', err));
  }, []);
  
  // Listen for dynamic Stripe fallback routing
  useEffect(() => {
    if (events.length > 0) {
      // Find the event in recent history
      const fallbackEvent = events.find(e => e.type === 'STRIPE_FALLBACK');
      
      if (fallbackEvent && fallbackUrl !== fallbackEvent.url) {
        setFallbackUrl(fallbackEvent.url);
        toast('Razorpay Down! Agent generated a Stripe fallback link.', 'warning');
      }
    }
  }, [events, fallbackUrl]);

  // Merge: live SSE events first, then audit history (deduplicated)
  const allEvents = events.length > 0 ? events : auditEntries;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div>
        <h1>Agent Console</h1>
        <p className="subtitle">
          {connected ? '🟢 Connected to Agent Engine' : '🔴 Disconnected from Agent Engine'}
        </p>
      </div>
      
      {fallbackUrl && (
        <div style={{ padding: '1rem', background: 'rgba(239, 160, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', marginBottom: '0.5rem' }}>
          <h3 style={{ color: 'var(--warning)', marginTop: 0 }}>⚠️ Gateway Re-routed</h3>
          <p>The AI Agent has successfully generated a fallback checkout session on Stripe.</p>
          <a href={fallbackUrl} target="_blank" rel="noreferrer" className="button-primary" style={{ display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none' }}>
            Complete Payment on Stripe
          </a>
        </div>
      )}

      <div className="agent-grid">
        <ActivityFeed events={allEvents} />
        
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
                 <span style={{ fontWeight: 600 }}>{allEvents.length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Avg AI Confidence</span>
                 <span style={{ fontWeight: 600, color: 'var(--info)' }}>
                   {Math.round(allEvents.filter(e => e.type === 'DIAGNOSED').reduce((acc, curr) => acc + (curr.diagnosis?.confidence || 0), 0) / (allEvents.filter(e => e.type === 'DIAGNOSED').length || 1))}%
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
