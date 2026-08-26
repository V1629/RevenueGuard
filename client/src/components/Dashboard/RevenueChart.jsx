import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import '../../styles/dashboard.css';

// Synthetic time-series data for demo
const data = [
  { time: '10:00', recovered: 4000, failed: 2400 },
  { time: '10:30', recovered: 3000, failed: 1398 },
  { time: '11:00', recovered: 2000, failed: 9800 },
  { time: '11:30', recovered: 2780, failed: 3908 },
  { time: '12:00', recovered: 1890, failed: 4800 },
  { time: '12:30', recovered: 2390, failed: 3800 },
  { time: '13:00', recovered: 3490, failed: 4300 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-glass)' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</p>
        <p style={{ margin: 0, color: 'var(--success)', fontWeight: 'bold' }}>
          Recovered: ₹{payload[0].value}
        </p>
        <p style={{ margin: 0, color: 'var(--danger)', fontWeight: 'bold' }}>
          Failed: ₹{payload[1].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ liveAmount = 0 }) {
  // Add live amount to the latest data point for demo purposes
  const currentData = [...data];
  if (liveAmount > 0) {
    currentData[currentData.length - 1].recovered += liveAmount;
  }

  return (
    <motion.div 
      className="glass-card chart-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="chart-header">
        <h2>Revenue Recovery Trend</h2>
        <span className="subtitle">Live tracking of automated recoveries</span>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={currentData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="recovered" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorRecovered)" />
            <Area type="monotone" dataKey="failed" stroke="var(--danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
