import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import NotificationToast, { toast } from './components/Layout/NotificationToast';

// Placeholder Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AgentPage from './pages/AgentPage';
import SettingsPage from './pages/SettingsPage';
import StorePage from './pages/StorePage';

// A layout component to wrap the Dashboard views
function AppLayout({ killSwitchActive, handleKillSwitch, handleResume, children }) {
  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <Header 
        onKillSwitch={handleKillSwitch} 
        onResume={handleResume}
        killSwitchActive={killSwitchActive} 
      />
      <main className="main-content" style={{ marginLeft: 0 }}>
        <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
      <NotificationToast />
    </div>
  );
}

function App() {
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const handleKillSwitch = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/governance/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true })
      });
      if (res.ok) {
        setKillSwitchActive(true);
        toast('Agent halted by Kill Switch', 'error');
      }
    } catch (e) {
      console.error(e);
      toast('Failed to trigger kill switch', 'error');
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/governance/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
      });
      if (res.ok) {
        setKillSwitchActive(false);
        toast('Agent resumed', 'success');
      }
    } catch (e) {
      console.error(e);
      toast('Failed to resume agent', 'error');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* All routes wrapped in the AppLayout for a consistent global Header */}
        <Route path="/*" element={
          <AppLayout 
            killSwitchActive={killSwitchActive}
            handleKillSwitch={handleKillSwitch}
            handleResume={handleResume}
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/store" element={<StorePage />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
