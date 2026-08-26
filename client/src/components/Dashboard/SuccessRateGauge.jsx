import { useEffect, useRef } from 'react';
import anime from 'animejs';
import '../../styles/dashboard.css';

export default function SuccessRateGauge({ rate = 85 }) {
  const circleRef = useRef(null);
  const textRef = useRef(null);
  const strokeDasharray = 283; // 2 * pi * r (45)

  useEffect(() => {
    const targetOffset = strokeDasharray - (strokeDasharray * rate) / 100;
    
    // Animate the circle stroke
    anime({
      targets: circleRef.current,
      strokeDashoffset: [strokeDasharray, targetOffset],
      duration: 2000,
      easing: 'easeOutQuart',
      delay: 500
    });

    // Animate the text number
    anime({
      targets: textRef.current,
      innerHTML: [0, rate],
      round: 1, // Round to integer
      duration: 2000,
      easing: 'easeOutQuart',
      delay: 500,
      update: function(a) {
        textRef.current.innerHTML = a.animations[0].currentValue + '%';
      }
    });
  }, [rate]);

  // Determine color based on rate
  const color = rate >= 90 ? 'var(--success)' : rate >= 80 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="glass-card chart-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
      <div className="chart-header" style={{ width: '100%', marginBottom: '2rem' }}>
        <h2>Payment Success Rate</h2>
        <span className="subtitle">Real-time gateway success tracking</span>
      </div>

      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {/* Background circle */}
          <circle 
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="8"
          />
          {/* Animated foreground circle */}
          <circle 
            ref={circleRef}
            cx="50" cy="50" r="45" 
            fill="none" 
            stroke={color} 
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDasharray}
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />
        </svg>
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <span ref={textRef} style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>
            0%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {rate >= 90 ? 'Healthy' : rate >= 80 ? 'Degraded' : 'Critical'}
          </span>
        </div>
      </div>
    </div>
  );
}
