import React, { useEffect } from 'react';
import LandingNavbar from '../components/Landing/LandingNavbar';
import HeroSection from '../components/Landing/HeroSection';
import FeatureGrid from '../components/Landing/FeatureGrid';
import ArchitectureSection from '../components/Landing/ArchitectureSection';
import Footer from '../components/Landing/Footer';
import '../styles/landing.css';

export default function LandingPage() {
  // Add a specific class to body to isolate landing styles if necessary
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => document.body.classList.remove('landing-body');
  }, []);

  return (
    <div className="landing-page">
      <main>
        <HeroSection />
        <FeatureGrid />
        <ArchitectureSection />
      </main>
      <Footer />
    </div>
  );
}
