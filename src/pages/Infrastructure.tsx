import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { InfrastructureAsset } from '../types';
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  MapPin,
  Activity
} from 'lucide-react';
import { PermissionGate } from '../components/PermissionGate';
import toast from 'react-hot-toast';

export const Infrastructure: React.FC = () => {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InfrastructureAsset | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'TRAFFIC_LIGHT', location: '', district: 'NORTH', status: 'active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/infrastructure');
      setAssets(res.data);
    } catch (err) {
      toast.error('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset? This action will be logged.')) return;
    try {
      await api.delete(`/infrastructure/${id}`);
      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleOpenModal = (asset?: InfrastructureAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({ name: asset.name, type: asset.type, location: asset.location, district: asset.district, status: asset.status });
    } else {
      setEditingAsset(null);
      setFormData({ name: '', type: 'TRAFFIC_LIGHT', location: '', district: 'NORTH', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingAsset) {
        await api.put(`/infrastructure/${editingAsset.id}`, formData);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/infrastructure', formData);
        toast.success('Asset created successfully');
      }
      setIsModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Infrastructure Assets</h2>
          <p className="text-slate-500 mt-1">Manage and monitor city-wide hardware</p>
        </div>
        <PermissionGate permission="infrastructure:manage">
          <button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="w-5 h-5" />
            Add New Asset
          </button>
        </PermissionGate>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, type, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['NORTH', 'SOUTH', 'EAST', 'WEST'].map(d => (
              <button key={d} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Asset Name</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Location</th>
                <th className="px-6 py-4 font-bold">District</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded"></div></td>
                  </tr>
                ))
              ) : filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{asset.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-600">{asset.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="w-4 h-4" />
                      {asset.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {asset.district}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${asset.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${asset.status === 'active' ? 'bg-emerald-500' :
                          asset.status === 'maintenance' ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}></span>
                      {asset.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PermissionGate permission="infrastructure:manage">
                        <button onClick={() => handleOpenModal(asset)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
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
            <h3 className="text-xl font-bold text-slate-900 mb-4">{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="TRAFFIC_LIGHT">TRAFFIC_LIGHT</option>
                  <option value="WATER_PUMP">WATER_PUMP</option>
                  <option value="POWER_STATION">POWER_STATION</option>
                  <option value="CCTV_CAMERA">CCTV_CAMERA</option>
                  <option value="FLOOD_SENSOR">FLOOD_SENSOR</option>
                  <option value="GAS_PIPELINE">GAS_PIPELINE</option>
                  <option value="WASTE_MANAGEMENT">WASTE_MANAGEMENT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                <select value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="NORTH">NORTH</option>
                  <option value="SOUTH">SOUTH</option>
                  <option value="EAST">EAST</option>
                  <option value="WEST">WEST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors">{isSubmitting ? 'Saving...' : 'Save Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
