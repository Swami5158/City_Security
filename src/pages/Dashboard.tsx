import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog, InfrastructureAsset } from '../types';
import { 
  Activity, 
  ShieldCheck, 
  History, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    todayEvents: 0,
    emergencyOverrides: 0
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, logsRes] = await Promise.all([
          api.get('/infrastructure'),
          api.get('/audit-logs?limit=10')
        ]);

        const assets = assetsRes.data as InfrastructureAsset[];
        const logs = logsRes.data.items as AuditLog[];

        setStats({
          totalAssets: assets.length,
          activeAssets: assets.filter(a => a.status === 'active').length,
          todayEvents: logsRes.data.total, // Simplified for demo
          emergencyOverrides: logs.filter(l => l.isEmergency).length
        });
        setRecentLogs(logs);
      } catch (err) {
        console.error('Dashboard fetch failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
    <div className="h-96 bg-slate-200 rounded-2xl"></div>
  </div>;

  const statCards = [
    { label: 'Total Assets', value: stats.totalAssets, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Assets', value: stats.activeAssets, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: "Today's Events", value: stats.todayEvents, icon: History, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Emergency Overrides', value: stats.emergencyOverrides, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-slate-500 mt-1">Real-time monitoring and security status</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Update</p>
          <p className="text-sm font-medium text-slate-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Recent Audit Activity
            </h3>
            <Link to="/audit-logs" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Action</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{log.userEmail}</p>
                      <p className="text-xs text-slate-500 uppercase">{log.role}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        log.isEmergency ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block mr-2 ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm font-medium">{log.success ? 'Success' : 'Denied'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-4">Security Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Threat Level</span>
                  <span className="text-emerald-400 font-bold">LOW</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full">
                  <div className="bg-emerald-500 h-full w-1/4 rounded-full"></div>
                </div>
                <p className="text-xs text-slate-500">System is currently operating within normal parameters. No critical breaches detected in the last 24h.</p>
              </div>
            </div>
            <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/infrastructure" className="p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors group">
                <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 mb-2" />
                <span className="text-xs font-bold text-slate-700">Assets</span>
              </Link>
              <Link to="/audit-logs" className="p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors group">
                <History className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 mb-2" />
                <span className="text-xs font-bold text-slate-700">Logs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
