import React, { useState } from 'react';
import api from '../services/api';
import { 
  Zap, 
  ShieldAlert, 
  Terminal, 
  ArrowRight,
  History,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AttackSimulator: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('MAINTENANCE');
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const roles = [
    { name: 'MAINTENANCE', forbidden: ['infrastructure:manage', 'users:manage', 'emergency:override'] },
    { name: 'TRAFFIC_ADMIN', forbidden: ['users:manage', 'emergency:override'] },
    { name: 'AUDITOR', forbidden: ['infrastructure:manage', 'infrastructure:control', 'emergency:override'] },
  ];

  const simulateAttack = async (permission: string) => {
    setIsSimulating(true);
    setLastResponse(null);
    try {
      // We simulate an attack by trying to call an endpoint that requires a permission
      // the current user (if they are not super admin) might not have.
      // For the demo, we'll try to DELETE an asset or GET users.
      let endpoint = '/users';
      let method: 'get' | 'delete' | 'post' = 'get';
      let requestData: any = undefined;

      if (permission.includes('infrastructure')) {
        endpoint = '/infrastructure/test-id';
        method = 'delete';
      }
      if (permission.includes('emergency')) {
        endpoint = '/emergency/override';
        method = 'post';
        requestData = { assetId: 'test-id', action: 'RESET', password: 'password123' };
      }

      const res = await api({ method, url: endpoint, data: requestData });
      setLastResponse({ status: res.status, data: res.data });
      toast.success('Action permitted (Unexpected for simulation)');
    } catch (err: any) {
      setLastResponse({
        status: err.response?.status,
        data: err.response?.data
      });
      if (err.response?.status === 403) {
        toast.error('Attack Blocked: 403 Forbidden');
      } else {
        toast.error('Simulation Error');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const currentRole = roles.find(r => r.name === selectedRole);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <Zap className="text-red-600 w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Security Demo Simulator</h2>
        <p className="text-slate-500 mt-2">Test and verify UrbanShield's API protection and RBAC enforcement</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              Step 1: Select Role to Simulate
            </h3>
            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.name}
                  onClick={() => setSelectedRole(role.name)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selectedRole === role.name 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold">{role.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Step 2: Trigger Forbidden Action
            </h3>
            <div className="space-y-3">
              {currentRole?.forbidden.map(perm => (
                <button
                  key={perm}
                  disabled={isSimulating}
                  onClick={() => simulateAttack(perm)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all group"
                >
                  <span className="text-sm font-bold uppercase tracking-wider">{perm}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Response Inspector</span>
              </div>
              {lastResponse && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  lastResponse.status === 403 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  HTTP {lastResponse.status}
                </span>
              )}
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-auto">
              {isSimulating ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="animate-pulse">_</span>
                  Simulating unauthorized request...
                </div>
              ) : lastResponse ? (
                <pre className="text-blue-400">
                  {JSON.stringify(lastResponse.data, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-600 italic">
                  // Select an action to see the real-time API response enforcement.
                  // Every attempt is logged in the immutable audit trail.
                </div>
              )}
            </div>
            {lastResponse?.status === 403 && (
              <div className="p-4 bg-red-500/10 border-t border-red-500/20">
                <p className="text-xs text-red-400 font-bold mb-2">
                  ATTACK BLOCKED: UrbanShield RBAC middleware intercepted this request.
                </p>
                <Link to="/audit-logs" className="text-xs text-white underline flex items-center gap-1">
                  <History className="w-3 h-3" /> View this attempt in Audit Logs
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
