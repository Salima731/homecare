import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Mail, Phone, Shield, Ban, UserCheck, MoreVertical, Loader2 } from 'lucide-react';
import { useGetAllUsersQuery, useUpdateUserStatusMutation } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const [filters, setFilters] = useState({ search: '', role: '' });
  const { data, isLoading, refetch } = useGetAllUsersQuery(filters);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateUserStatusMutation();

  const handleStatusUpdate = async (id, isBanned) => {
    const newStatus = isBanned ? 'active' : 'banned';
    const action = isBanned ? 'activate' : 'ban';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        await updateStatus({ id, status: newStatus }).unwrap();
        toast.success(`User ${newStatus} successfully`);
      } catch (err) {
        toast.error('Failed to update user status');
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">User Management</h1>
          <p className="text-[var(--text-muted)] font-medium">Monitor and manage all platform users and their access.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={20} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="input pl-10 h-12"
          />
        </div>
        <select 
          className="input w-full md:w-48 h-12 font-bold"
          value={filters.role}
          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
        >
          <option value="">All Roles</option>
          <option value="user">Customers</option>
          <option value="agency">Agencies</option>
          <option value="caregiver">Caregivers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden shadow-md border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-main)] border-b border-[var(--border-main)]">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {data?.data?.users?.length > 0 ? (
                data.data.users.map((u) => (
                  <tr key={u._id} className="hover:bg-[var(--bg-main)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center font-bold text-primary-700">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-main)] group-hover:text-primary-600 transition-colors">{u.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' :
                        u.role === 'agency' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                        u.role === 'caregiver' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${!u.isBanned ? 'text-green-600' : 'text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${!u.isBanned ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        {u.isBanned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)] font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.role !== 'admin' && (
                          <button 
                            onClick={() => handleStatusUpdate(u._id, u.isBanned)}
                            className={`p-2 rounded-lg transition-all ${!u.isBanned ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10'}`}
                            title={!u.isBanned ? 'Ban User' : 'Activate User'}
                          >
                            {!u.isBanned ? <Ban size={18} /> : <UserCheck size={18} />}
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <p className="text-[var(--text-muted)] font-medium">No users found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
