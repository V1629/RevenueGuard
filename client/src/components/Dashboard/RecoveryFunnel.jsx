import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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

  // Animate bar widths with requestAnimationFrame (safe alternative to anime.js)
  useEffect(() => {
    const start = performance.now();
    const duration = 1500;

    const step = (now) => {
      const elapsed = Math.min((now - start) / duration, 1);
      // easeOutElastic approximation
      const eased = elapsed === 1 ? 1 : 1 - Math.pow(2, -10 * elapsed) * Math.cos((elapsed * 10 - 0.75) * (2 * Math.PI / 3));

      barsRef.current.forEach((el, i) => {
        if (!el) return;
        const count = parseInt(el.dataset.count);
        const targetWidth = (count / maxCount) * 100;
        el.style.width = `${targetWidth * eased}%`;
      });

      if (elapsed < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
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
