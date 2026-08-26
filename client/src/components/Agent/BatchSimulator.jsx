import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Database, RefreshCw } from 'lucide-react';
import { toast } from '../Layout/NotificationToast';
import '../../styles/agent.css';

export default function BatchSimulator({ onClearFeed }) {
  const [batchSize, setBatchSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const runBatch = async () => {
    if (onClearFeed) onClearFeed();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/agent/run-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize, generateNew: true })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run batch');
      
      toast(`Batch triggered: ${data.processed} transactions processing`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await fetch('http://localhost:3001/api/agent/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size: 500 })
      });
      
      if (!res.ok) throw new Error('Failed to seed database');
      toast(`Database re-seeded with 500 transactions`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="glass-card simulator-panel">
      <div className="chart-header" style={{ marginBottom: 0 }}>
        <h2>Agent Controls</h2>
        <span className="subtitle">Trigger batch processing and data reset</span>
      </div>

      <div className="form-group">
        <label>Batch Size (Transactions to process)</label>
        <select 
          className="form-control" 
          value={batchSize} 
          onChange={(e) => setBatchSize(Number(e.target.value))}
          disabled={loading}
        >
          <option value={5}>5 Transactions (Quick Demo)</option>
          <option value={10}>10 Transactions</option>
          <option value={50}>50 Transactions (Stress Test)</option>
          <option value={100}>100 Transactions</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <motion.button 
          className="btn btn-primary"
          onClick={runBatch}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
          {loading ? 'Processing Batch...' : 'Run Recovery Agent'}
        </motion.button>
        
        <motion.button 
          className="btn btn-secondary"
          onClick={seedDatabase}
          disabled={seeding || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {seeding ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
          Reset & Seed Database
        </motion.button>
      </div>
    </div>
  );
}
