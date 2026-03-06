import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  ShieldAlert,
  Download,
  Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filters
  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        userEmail: emailFilter,
        action: actionFilter,
        isEmergency: String(isEmergency),
        isFlagged: String(isFlagged)
      });
      const res = await api.get(`/audit-logs?${params}`);
      setLogs(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, isEmergency, isFlagged]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "audit_logs_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Export started');
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Trail</h2>
          <p className="text-slate-500 mt-1">Complete immutable record of all system interactions</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download className="w-5 h-5" />
          Export JSON
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <select 
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); }}
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-slate-600 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Actions</option>
            <option value="GET">GET (Read)</option>
            <option value="POST">POST (Create)</option>
            <option value="PUT">PUT (Update)</option>
            <option value="DELETE">DELETE (Remove)</option>
            <option value="EMERGENCY_OVERRIDE">Emergency Override</option>
          </select>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-bold text-slate-600 group-hover:text-red-600 transition-colors">Emergency</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={isFlagged}
                onChange={(e) => setIsFlagged(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-bold text-slate-600 group-hover:text-orange-600 transition-colors">Flagged</span>
            </label>
          </div>
          <button 
            onClick={fetchLogs}
            className="bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="w-10 px-6 py-4"></th>
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Action</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-6 bg-slate-50/50"></td></tr>)
              ) : logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === log.id ? 'bg-slate-50' : ''}`}
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <td className="px-6 py-4">
                      {expandedRow === log.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{log.userEmail}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{log.role}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.action === 'EMERGENCY_OVERRIDE' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.action}
                        </span>
                        {log.isFlagged && <ShieldAlert className="w-4 h-4 text-orange-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.success ? 'SUCCESS' : 'DENIED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400">
                      {log.ipAddress}
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 bg-slate-50 border-y border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Terminal className="w-3 h-3" />
                              Before State
                            </h4>
                            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto max-h-60">
                              {log.beforeState ? JSON.stringify(log.beforeState, null, 2) : '// No previous state captured'}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Terminal className="w-3 h-3" />
                              After State / Response
                            </h4>
                            <pre className="bg-slate-900 text-blue-400 p-4 rounded-xl text-xs overflow-x-auto max-h-60">
                              {log.afterState ? JSON.stringify(log.afterState, null, 2) : log.deniedReason ? `// DENIED: ${log.deniedReason}` : '// No state change recorded'}
                            </pre>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-400">
                          <span>Endpoint: {log.endpoint}</span>
                          <span>User Agent: {log.userAgent}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-50 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-900">{logs.length}</span> of <span className="font-bold text-slate-900">{total}</span> events
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
