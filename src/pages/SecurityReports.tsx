import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { SecurityReport } from '../types';
import { 
  FileText, 
  Calendar, 
  User, 
  BarChart3, 
  ChevronDown, 
  ChevronUp,
  Download,
  RefreshCw,
  PieChart,
  ShieldAlert
} from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import toast from 'react-hot-toast';

export const SecurityReports: React.FC = () => {
  const [reports, setReports] = useState<SecurityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.items);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await api.post('/reports/generate');
      toast.success('Report generated successfully');
      fetchReports();
    } catch (err) {
      toast.error('Report generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Security Reports</h2>
          <p className="text-slate-500 mt-1">Automated system health and threat analysis</p>
        </div>
        <PermissionGate permission="users:manage">
          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate Report Now
          </button>
        </PermissionGate>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          [1,2].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse"></div>)
        ) : reports.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-slate-100">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500">No reports generated yet. Reports are auto-generated every 24h.</p>
          </div>
        ) : reports.map(report => (
          <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div 
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Security Audit Report — {report.period}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(report.generatedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {report.generatedBy}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Requests</p>
                    <p className="text-sm font-bold text-slate-900">{report.summary.totalRequests}</p>
                  </div>
                  <div className="text-center border-l border-slate-100 pl-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Flagged</p>
                    <p className="text-sm font-bold text-red-600">{report.summary.flaggedEvents}</p>
                  </div>
                </div>
                {expandedReport === report.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </div>
            </div>

            {expandedReport === report.id && (
              <div className="p-6 border-t border-slate-50 bg-slate-50/50 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Action Breakdown
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(report.reportData.actionBreakdown).map(([action, count]) => (
                        <div key={action} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">{action}</span>
                          <span className="text-sm font-bold text-slate-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Top Active Users
                    </h4>
                    <div className="space-y-3">
                      {report.reportData.topUsers.map(u => (
                        <div key={u.email} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 truncate mr-2">{u.email}</span>
                          <span className="text-sm font-bold text-slate-900">{u.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-500" />
                      Summary Stats
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Failed Attempts</span>
                        <span className="text-sm font-bold text-red-600">{report.summary.failedAttempts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Emergency Overrides</span>
                        <span className="text-sm font-bold text-orange-600">{report.summary.emergencyOverrides}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Unique Users</span>
                        <span className="text-sm font-bold text-slate-900">{report.summary.uniqueUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Raw Report Data (JSON)</h4>
                  <pre className="bg-slate-900 text-blue-400 p-6 rounded-2xl text-xs overflow-x-auto max-h-96">
                    {JSON.stringify(report.reportData, null, 2)}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <button className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                    <Download className="w-4 h-4" />
                    Download Full PDF Report
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
