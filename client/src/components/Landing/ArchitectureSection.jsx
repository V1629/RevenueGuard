import { useRef } from 'react';
import { motion } from 'framer-motion';
import anime from 'animejs';

export default function ArchitectureSection() {
  const lineRef = useRef(null);

  const handleViewportEnter = () => {
    if (lineRef.current) {
      anime({
        targets: lineRef.current,
        height: ['0%', '100%'],
        easing: 'easeInOutSine',
        duration: 1500
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="section" style={{ background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title text-gradient">How the Agent operates.</h2>
          <p className="landing-subtitle" style={{ margin: '0 0 3rem 0', textAlign: 'left' }}>
            An intelligent orchestration layer built for massive scale and reliability.
          </p>
        </motion.div>

        <motion.div 
          className="arch-timeline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-150px" }}
          onViewportEnter={handleViewportEnter}
        >
          <div className="arch-line-bg"></div>
          <div className="arch-line-fill" ref={lineRef}></div>

          <motion.div className="arch-step" variants={stepVariants} whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <div className="arch-dot" style={{ color: 'white', fontWeight: 600 }}>1</div>
            <div className="arch-content">
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>The Detector</h4>
              <p style={{ color: '#A1A1AA', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Hooks into your payment webhook feeds. It ingests thousands of events and filters out the noise to identify true checkout failures or gateway degradation events.
              </p>
            </div>
          </motion.div>

          <motion.div className="arch-step" variants={stepVariants} whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <div className="arch-dot" style={{ color: 'white', fontWeight: 600 }}>2</div>
            <div className="arch-content">
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>The Diagnoser (LLM)</h4>
              <p style={{ color: '#A1A1AA', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Takes the raw failure trace and parses it through a highly-optimized LLM. It maps obscure bank codes (like 'ERR_59_DS') to real-world reasons (e.g., "Card Expired").
              </p>
            </div>
          </motion.div>

          <motion.div className="arch-step" variants={stepVariants} whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            <div className="arch-dot" style={{ color: 'white', fontWeight: 600 }}>3</div>
            <div className="arch-content">
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>The Orchestrator</h4>
              <p style={{ color: '#A1A1AA', fontSize: '1.05rem', lineHeight: 1.6 }}>
                The brain of the system. Based on the diagnosis and the customer's LTV tier, the Orchestrator executes a recovery strategy. It can trigger smart retries, human escalations, or automated AI nudges.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
