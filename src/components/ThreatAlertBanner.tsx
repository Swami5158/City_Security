import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ThreatAlert } from '../types';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ThreatAlertBanner: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchAlerts = async () => {
    if (!user?.permissions.includes('audit:view')) return;
    try {
      const res = await api.get('/threat-alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const resolveAlert = async (id: string) => {
    try {
      await api.put(`/threat-alerts/${id}/resolve`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <div 
        className="bg-red-600 text-white px-4 py-2 flex items-center justify-between cursor-pointer shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span className="font-bold">
            {alerts.length} Active Security Threats Detected — View Details
          </span>
        </div>
        <button className="p-1 hover:bg-red-700 rounded transition-colors">
          {isExpanded ? <X /> : 'View'}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border-b border-red-200 shadow-2xl overflow-hidden"
          >
            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white p-4 rounded-lg border border-red-200 flex justify-between items-start shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                        alert.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{alert.type}</span>
                    </div>
                    <p className="text-sm text-slate-600">{alert.description}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      User: {alert.userEmail || 'System'} • {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {user?.role === 'SUPER_ADMIN' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); resolveAlert(alert.id); }}
                      className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
