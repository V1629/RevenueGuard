import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw } from 'lucide-react';
import '../styles/audit.css';

export default function AuditPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAudit = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/audit/entries`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const getBadgeClass = (type) => {
    if (type === 'RECOVERY_SUCCEEDED') return 'badge-success';
    if (type === 'TRANSACTION_DETECTED') return 'badge-info';
    if (type === 'RECOVERY_STOPPED' || type === 'KILL_SWITCH_ACTIVE') return 'badge-danger';
    if (type === 'ESCALATED') return 'badge-warning';
    return 'badge-info'; // Default
  };

  const filteredEntries = entries.filter(e => 
    e.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.actionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Audit Trail</h1>
          <p className="subtitle">Immutable log of all agent actions and governance decisions</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAudit} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by Transaction ID or Action Type..." 
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary">
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Transaction ID</th>
              <th>Action Type</th>
              <th>Governance Check</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, index) => (
              <motion.tr 
                key={entry.timestamp + index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {entry.transactionId}
                </td>
                <td>
                  <span className={`badge ${getBadgeClass(entry.actionType)}`}>
                    {entry.actionType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  {entry.governanceContext?.killSwitchActive ? (
                    <span className="text-danger" style={{ fontSize: '0.875rem' }}>Halted</span>
                  ) : (
                    <span className="text-success" style={{ fontSize: '0.875rem' }}>Passed</span>
                  )}
                </td>
                <td style={{ fontSize: '0.875rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.details?.reason || entry.details?.strategy || 'System triggered'}
                </td>
              </motion.tr>
            ))}
            {filteredEntries.length === 0 && !loading && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No audit logs found matching your search.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Loading audit trail...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
