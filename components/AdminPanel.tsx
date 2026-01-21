
import React, { useState } from 'react';
import { User } from '../types';

interface AdminPanelProps {
  user: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'john_doe', role: 'user', quotaGB: 1, usedBytes: 450 * 1024 * 1024, expiryDate: '2023-12-01', rtmpKeys: {} },
    { id: '2', username: 'stream_master', role: 'user', quotaGB: 10, usedBytes: 8 * 1024 * 1024 * 1024, expiryDate: '2024-05-15', rtmpKeys: {} },
    { id: '3', username: 'trial_user', role: 'user', quotaGB: 1, usedBytes: 0, expiryDate: new Date().toISOString(), rtmpKeys: {} },
  ]);

  const updateExpiry = (id: string, days: number) => {
    setUsers(prev => prev.map(u => {
        if (u.id === id) {
            const date = new Date(u.expiryDate);
            date.setDate(date.getDate() + days);
            return { ...u, expiryDate: date.toISOString() };
        }
        return u;
    }));
  };

  const updateQuota = (id: string, gb: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, quotaGB: u.quotaGB + gb } : u));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold">Admin Panel</h2>
            <p className="text-neutral-400 mt-2">Manage user subscriptions, storage quotas, and access control.</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex gap-8">
            <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">Total Users</p>
                <p className="text-xl font-bold">{users.length}</p>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">Active Streams</p>
                <p className="text-xl font-bold text-green-500">14</p>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">Server Load</p>
                <p className="text-xl font-bold text-yellow-500">42%</p>
            </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-neutral-950 border-b border-neutral-800">
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Username</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">Expiry Status</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-center">Storage Quota</th>
                    <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => {
                    const isExpired = new Date(u.expiryDate).getTime() < new Date().getTime();
                    return (
                        <tr key={u.id} className="border-b border-neutral-800 hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-bold text-sm">{u.username}</td>
                            <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${isExpired ? 'bg-red-900/40 text-red-400 border border-red-500/30' : 'bg-green-900/40 text-green-400 border border-green-500/30'}`}>
                                    {isExpired ? 'EXPIRED' : 'ACTIVE'} ({new Date(u.expiryDate).toLocaleDateString()})
                                </span>
                            </td>
                            <td className="p-4 text-center">
                                <div className="text-sm font-bold">{u.quotaGB} GB</div>
                                <div className="text-[10px] text-neutral-500">{(u.usedBytes / (1024*1024)).toFixed(0)}MB used</div>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button 
                                    onClick={() => updateExpiry(u.id, 30)}
                                    className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    +1 MONTH
                                </button>
                                <button 
                                    onClick={() => updateQuota(u.id, 5)}
                                    className="text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-700"
                                >
                                    +5GB STORAGE
                                </button>
                                <button className="text-[10px] font-bold bg-red-900/40 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">
                                    KILL PROCESS
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
