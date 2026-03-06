import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Shield, 
  Users, 
  History, 
  FileText, 
  Zap, 
  AlertCircle,
  LogOut
} from 'lucide-react';
import { PermissionGate } from './PermissionGate';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: null },
    { name: 'Infrastructure', path: '/infrastructure', icon: Shield, permission: 'infrastructure:view' },
    { name: 'User Management', path: '/users', icon: Users, permission: 'users:manage' },
    { name: 'Audit Logs', path: '/audit-logs', icon: History, permission: 'audit:view' },
    { name: 'Security Reports', path: '/reports', icon: FileText, permission: 'reports:view' },
    { name: 'Attack Simulator', path: '/simulator', icon: Zap, permission: null },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Shield className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">UrbanShield</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(item => {
          const content = (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                location.pathname === item.path 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );

          if (item.permission) {
            return <PermissionGate key={item.path} permission={item.permission}>{content}</PermissionGate>;
          }
          return content;
        })}
      </nav>

      <div className="p-4 space-y-4">
        <PermissionGate permission="emergency:override">
          <Link 
            to="/emergency"
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20"
          >
            <AlertCircle className="w-5 h-5" />
            EMERGENCY
          </Link>
        </PermissionGate>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.email}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
