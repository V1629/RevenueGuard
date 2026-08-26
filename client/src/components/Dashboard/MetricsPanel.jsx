import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, IndianRupee, Activity, ShieldCheck, Clock } from 'lucide-react';
import '../../styles/dashboard.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Counter animation component
const AnimatedCounter = ({ value, prefix = '' }) => {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value} // Re-animate on change
    >
      {prefix}{value}
    </motion.span>
  );
};

export default function MetricsPanel({ metrics }) {
  const cards = [
    {
      title: 'Revenue at Risk',
      value: formatCurrency(metrics?.totalAmountAtRisk || 0),
      icon: <IndianRupee size={16} className="text-warning" />,
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Recovered',
      value: formatCurrency(metrics?.totalAmountRecovered || 0),
      icon: <ShieldCheck size={16} className="text-success" />,
      trend: '+45%',
      trendUp: true
    },
    {
      title: 'Recovery Rate',
      value: `${metrics?.recoveryRate || 0}%`,
      icon: <Activity size={16} className="text-info" />,
      trend: '+5.2%',
      trendUp: true
    },
    {
      title: 'Active Agents',
      value: metrics?.activeRecoveries || 0,
      icon: <Clock size={16} className="text-primary" />,
      trend: '-2',
      trendUp: false
    }
  ];

  return (
    <div className="dashboard-grid">
      {cards.map((card, index) => (
        <motion.div 
          key={card.title}
          className="glass-card metric-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <div className="metric-title">
            {card.icon}
            {card.title}
          </div>
          <div className="metric-value">
            <AnimatedCounter value={card.value} />
          </div>
          <div className={`metric-trend ${card.trendUp ? 'trend-up' : 'trend-down'}`}>
            {card.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {card.trend} from last week
          </div>
        </motion.div>
      ))}
    </div>
  );
}
