import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import NotificationToast, { toast } from './components/Layout/NotificationToast';

// Placeholder Pages
import DashboardPage from './pages/DashboardPage';
import AgentPage from './pages/AgentPage';
import AuditPage from './pages/AuditPage';
import SimulatorPage from './pages/SimulatorPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const handleKillSwitch = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/governance/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', reason: 'Manual kill switch via UI' })
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
        body: JSON.stringify({ action: 'deactivate' })
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
      <div className="app-container">
        <Sidebar killSwitchActive={killSwitchActive} />
        
        <main className="main-content">
          <Header 
            onKillSwitch={handleKillSwitch} 
            onResume={handleResume}
            killSwitchActive={killSwitchActive} 
          />
          
          <div className="page-container">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/simulator" element={<SimulatorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
        
        <NotificationToast />
      </div>
    </BrowserRouter>
  );
}

export default App;
