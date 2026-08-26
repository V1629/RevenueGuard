import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import '../../styles/components.css';

const ICONS = {
  success: <CheckCircle2 className="text-success" size={20} />,
  error: <AlertCircle className="text-danger" size={20} />,
  warning: <AlertTriangle className="text-warning" size={20} />,
  info: <Info className="text-info" size={20} />,
};

// Global state for toasts (simple implementation for demo)
let toastCount = 0;
let listeners = [];
export const toast = (message, type = 'info', duration = 5000) => {
  const id = ++toastCount;
  listeners.forEach(l => l({ id, message, type, duration }));
};

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (newToast) => {
      setToasts(prev => [...prev, newToast]);
      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, newToast.duration);
      }
    };
    listeners.push(handleToast);
    return () => {
      listeners = listeners.filter(l => l !== handleToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`toast ${t.type}`}
            layout
          >
            {ICONS[t.type]}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.message}</p>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
