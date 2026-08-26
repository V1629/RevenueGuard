import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BrainCircuit, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import '../../styles/agent.css';

const EVENT_CONFIG = {
  DETECTED: { icon: Shield, class: 'detected', title: 'Risk Detected' },
  DIAGNOSED: { icon: BrainCircuit, class: 'diagnosed', title: 'AI Diagnosis Complete' },
  EXECUTING: { icon: Play, class: 'executing', title: 'Executing Strategy' },
  RECOVERED: { icon: CheckCircle2, class: 'recovered', title: 'Revenue Recovered' },
  STOPPED: { icon: XCircle, class: 'stopped', title: 'Recovery Halted' },
  ESCALATED: { icon: AlertTriangle, class: 'escalated', title: 'Escalated to Human' },
  KILL_SWITCH: { icon: XCircle, class: 'stopped', title: 'Agent Halted (Kill Switch)' }
};

const DecisionCard = ({ diagnosis }) => {
  if (!diagnosis) return null;
  
  return (
    <motion.div 
      className="decision-card"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
    >
      <div className="decision-header">
        <BrainCircuit size={12} />
        {diagnosis.source === 'ai' ? 'Groq AI Reasoning' : 'Heuristic Reasoning'}
      </div>
      <div className="decision-reasoning">
        "{diagnosis.reasoning}"
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>Confidence: {diagnosis.confidence}%</span>
        <span>Strategy: {diagnosis.suggestedStrategy}</span>
      </div>
    </motion.div>
  );
};

export default function ActivityFeed({ events }) {
  return (
    <div className="activity-feed-container">
      <div className="chart-header">
        <h2>Live Agent Activity</h2>
        <span className="subtitle">Real-time stream of agent decisions and actions</span>
      </div>
      
      <div className="feed-list">
        <AnimatePresence initial={false}>
          {events.map((event, i) => {
            const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.DETECTED;
            const Icon = config.icon;
            
            return (
              <motion.div 
                key={event.serverTimestamp + i}
                className="feed-item"
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, margin: 0, padding: 0 }}
                transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                layout
              >
                <div className={`feed-icon ${config.class}`}>
                  <Icon size={20} />
                </div>
                
                <div className="feed-content">
                  <div className="feed-header">
                    <span className="feed-title">{config.title}</span>
                    <span className="feed-time">
                      {new Date(event.serverTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="feed-desc">
                    {event.type === 'DETECTED' && `Identified ${event.transaction.riskType} for ₹${event.transaction.amount}`}
                    {event.type === 'DIAGNOSED' && `Failure reason: ${event.diagnosis.failureReason}`}
                    {event.type === 'EXECUTING' && `Starting ${event.strategy.replace(/_/g, ' ')} workflow`}
                    {event.type === 'RECOVERED' && <span className="text-success" style={{fontWeight: 600}}>Recovered ₹${event.amountRecovered}</span>}
                    {event.type === 'STOPPED' && `Reason: ${event.reason}`}
                    {event.type === 'ESCALATED' && `Reason: ${event.reason}`}
                    {event.type === 'KILL_SWITCH' && `Reason: ${event.reason}`}
                  </div>
                  
                  {event.type === 'DIAGNOSED' && <DecisionCard diagnosis={event.diagnosis} />}
                </div>
              </motion.div>
            );
          })}
          
          {events.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', marginTop: '2rem' }}>
              No recent activity. Run the batch simulator to see the agent in action.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
