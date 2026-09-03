import { motion } from 'framer-motion';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import '../../styles/components.css';

export default function Header({ title = "X.A.V.I.E.R.", onKillSwitch, killSwitchActive, onResume }) {
  return (
    <motion.header 
      className="header"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="header-title">
        {title}
      </div>
      
      <div className="header-actions">
        {killSwitchActive ? (
          <motion.button 
            className="btn btn-secondary"
            onClick={onResume}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} />
            Resume Agent
          </motion.button>
        ) : (
          <motion.button 
            className="btn btn-danger"
            onClick={onKillSwitch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AlertOctagon size={16} />
            Kill Switch
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
