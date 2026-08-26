import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import anime from 'animejs';
import '../../styles/dashboard.css';

export default function RecoveryFunnel({ metrics }) {
  const barsRef = useRef([]);

  const data = [
    { label: 'Detected', count: metrics?.totalDetected || 0, color: 'var(--text-secondary)' },
    { label: 'Attempted', count: (metrics?.totalDetected || 0) - (metrics?.totalStopped || 0), color: 'var(--info)' },
    { label: 'Escalated', count: metrics?.totalEscalated || 0, color: 'var(--warning)' },
    { label: 'Recovered', count: metrics?.totalRecovered || 0, color: 'var(--success)' },
  ];

  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Anime.js for complex bar width animation
  useEffect(() => {
    if (barsRef.current.length > 0) {
      anime({
        targets: barsRef.current,
        width: (el) => {
          const count = parseInt(el.dataset.count);
          return `${(count / maxCount) * 100}%`;
        },
        duration: 1500,
        easing: 'easeOutElastic(1, .8)',
        delay: anime.stagger(200)
      });
    }
  }, [metrics]);

  return (
    <div className="glass-card chart-card">
      <div className="chart-header">
        <h2>Recovery Funnel</h2>
        <span className="subtitle">Conversion from detection to recovery</span>
      </div>
      
      <div className="funnel-container">
        {data.map((step, i) => (
          <div key={step.label} className="funnel-step">
            <div className="funnel-label">{step.label}</div>
            
            <div className="funnel-bar-container">
              <div 
                ref={el => barsRef.current[i] = el}
                className="funnel-bar"
                data-count={step.count}
                style={{ 
                  width: '0%', 
                  background: `linear-gradient(90deg, ${step.color} 0%, transparent 200%)`
                }}
              >
                {step.count > 0 && `${Math.round((step.count / maxCount) * 100)}%`}
              </div>
            </div>
            
            <div className="funnel-value">{step.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
