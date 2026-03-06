import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';
import {
  UserPlus,
  Shield,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', roleId: '', district: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Access Denied');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStatus = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ email: user.email, password: '', roleId: roles.find(r => r.name === user.role)?.id || roles[0]?.id || '', district: user.district || '' });
    } else {
      setEditingUser(null);
      setFormData({ email: '', password: '', roleId: roles[0]?.id || '', district: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', formData);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
      <p className="text-slate-500 max-w-md">{error}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-slate-500 mt-1">Manage personnel access and roles</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
          <UserPlus className="w-5 h-5" />
          Add New User
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Role</th>
                <th className="px-6 py-4 font-bold">District</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-8 bg-slate-50/50"></td></tr>)
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{user.email}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                        user.role === 'TRAFFIC_ADMIN' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                            user.role === 'PUBLIC_SAFETY' ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="w-4 h-4" />
                      {user.district || 'GLOBAL'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(user)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                    >
                      {user.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {user.isActive ? 'ACTIVE' : 'LOCKED'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder={editingUser ? 'Leave blank to keep current' : ''} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select required value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <select value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="">GLOBAL (All Districts)</option>
                  <option value="NORTH">NORTH</option>
                  <option value="SOUTH">SOUTH</option>
                  <option value="EAST">EAST</option>
                  <option value="WEST">WEST</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">{isSubmitting ? 'Saving...' : 'Save User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
