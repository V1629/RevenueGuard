import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs';
import { Player } from '@lottiefiles/react-lottie-player';
import chartsAnimation from '../../assets/charts.json';

export default function HeroSection() {
  const particlesRef = useRef(null);
  const [isAcronymShort, setIsAcronymShort] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAcronymShort(prev => !prev);
    }, 3500); // cycle every 3.5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Anime.js floating particles effect
    const container = particlesRef.current;
    if (!container) return;
    
    // Clear any existing particles
    container.innerHTML = '';
    
    const numParticles = 30;
    const colors = ['#e94560', '#3b82f6', '#8b5cf6'];
    
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = `${Math.random() * 4 + 2}px`;
      particle.style.height = particle.style.width;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.opacity = Math.random() * 0.5 + 0.1;
      particle.style.filter = 'blur(1px)';
      container.appendChild(particle);

      anime({
        targets: particle,
        translateX: () => anime.random(-100, 100),
        translateY: () => anime.random(-100, 100),
        scale: () => anime.random(0.5, 2),
        opacity: [
          { value: Math.random() * 0.5 + 0.2, duration: anime.random(1000, 3000) },
          { value: Math.random() * 0.2, duration: anime.random(1000, 3000) }
        ],
        easing: 'easeInOutSine',
        duration: anime.random(3000, 8000),
        direction: 'alternate',
        loop: true
      });
    }
  }, []);

  return (
    <section className="section" style={{ paddingTop: '14rem', textAlign: 'center', position: 'relative' }}>
      <div id="particles-container" ref={particlesRef}></div>
      
      <div className="landing-container" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', textAlign: 'left' }}>
        <div>
          <div style={{ height: '150px', display: 'flex', alignItems: 'center' }}>
            <AnimatePresence mode="wait">
              {isAcronymShort ? (
                <motion.h1
                  key="short"
                  style={{ fontSize: '5.5rem', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-0.05em', margin: 0 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  {['X', 'A', 'V', 'I', 'E', 'R'].map((letter, i) => (
                    <span key={i}>
                      <span style={{ background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {letter}
                      </span>
                      <span style={{ color: '#e94560', textShadow: '0 0 20px #e94560' }}>.</span>
                    </span>
                  ))}
                </motion.h1>
              ) : (
                <motion.h1
                  key="long"
                  style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1.2, background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', margin: 0 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  eXtended Autonomous Virtual Intelligence Engine for Recovery
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          <motion.p
            className="landing-subtitle"
            style={{ textAlign: 'left', marginTop: '1.5rem', fontSize: '1.25rem', maxWidth: '100%' }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            The autonomous AI agent that sits between your payment gateways. Stop losing revenue to failed payments. When a transaction fails, it instantly diagnoses the issue, routes around downtime, and intelligently recovers lost customers—all without human intervention.
          </motion.p>

          <motion.div
            style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-start', marginTop: '2.5rem' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to="/dashboard" className="landing-btn landing-btn-primary">
              Enter Dashboard
            </Link>
            <a href="#features" className="landing-btn landing-btn-secondary">
              See How It Works
            </a>
          </motion.div>
        </div>

        <motion.div
          style={{ position: 'relative' }}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lottie-container" style={{ 
            height: '450px', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Player autoplay loop src={chartsAnimation} style={{ width: '100%', height: '100%' }} />
          </div>
          {/* Subtle glow behind the animation */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '80%',
            background: 'var(--accent-primary)',
            filter: 'blur(150px)',
            opacity: 0.2,
            zIndex: -1
          }}></div>
        </motion.div>
      </div>
    </section>
  );
}
