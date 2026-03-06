import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      toast.success('Login successful');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { email: 'super_admin@test.com', role: 'SUPER_ADMIN', desc: 'Full system access' },
    { email: 'traffic_admin@test.com', role: 'TRAFFIC_ADMIN', desc: 'Infrastructure management' },
    { email: 'maintenance@test.com', role: 'MAINTENANCE', desc: 'View only access' },
    { email: 'public_safety@test.com', role: 'PUBLIC_SAFETY', desc: 'Emergency override' },
    { email: 'auditor@test.com', role: 'AUDITOR', desc: 'Audit & Reports' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-xl shadow-emerald-500/20">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">UrbanShield</h1>
          <p className="text-slate-400 mt-2">Secure City Infrastructure Management</p>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-800 px-2 text-slate-500 font-bold tracking-widest">Demo Access</span></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {demoUsers.map(user => (
                <button
                  key={user.email}
                  onClick={() => { setEmail(user.email); setPassword('password123'); }}
                  className="flex flex-col items-start p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-left"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold text-white">{user.role}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Click to fill</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1">{user.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
