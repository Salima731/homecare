import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Mail, Phone, Shield, Ban, UserCheck, MoreVertical, Loader2, Building2, MapPin, Star } from 'lucide-react';
import { useGetAgenciesQuery, useUpdateAgencyStatusMutation } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminAgencies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, refetch } = useGetAgenciesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAgencyStatusMutation();

  const agencies = data?.data || [];

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';
    
    if (window.confirm(`Are you sure you want to ${action} this agency?`)) {
      try {
        await updateStatus({ id, status: newStatus }).unwrap();
        toast.success(`Agency ${newStatus} successfully`);
      } catch (err) {
        toast.error('Failed to update agency status');
      }
    }
  };

  const filteredAgencies = Array.isArray(agencies) ? agencies.filter(agency => 
    agency.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Agency Management</h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">Verify and monitor home care agencies on the platform.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)]">
            <Search size={20} />
          </span>
          <input
            type="text"
            placeholder="Search agencies by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12 h-14 bg-[var(--bg-card)] border-[var(--border-main)] focus:border-primary-600/50 transition-all text-[var(--text-main)] font-medium"
          />
        </div>
      </div>

      {/* Agencies Table */}
      <div className="card p-0 overflow-hidden shadow-2xl border-[var(--border-main)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--border-main)]">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Agency Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Verification</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Platform Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Performance</th>
                <th className="px-6 py-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {filteredAgencies.length > 0 ? (
                filteredAgencies.map((agency) => (
                  <tr key={agency._id} className="hover:bg-primary-600/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center font-black text-primary-600 overflow-hidden border border-primary-600/20 shadow-sm">
                          {agency.logo?.url ? (
                            <img src={agency.logo.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={24} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-main)] group-hover:text-primary-600 transition-colors">{agency.agencyName}</p>
                          <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">{agency.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {agency.isVerified ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                          <Shield size={12} strokeWidth={3} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                          <Filter size={12} strokeWidth={3} /> Review Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${agency.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${agency.status === 'approved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,44,44,0.4)]'}`}></span>
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-400">
                          <Star size={14} fill="currentColor" />
                        </div>
                        <span className="text-sm font-black text-[var(--text-main)]">{agency.rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => handleStatusUpdate(agency._id, agency.status)}
                          className={`p-2.5 rounded-xl transition-all ${agency.status === 'approved' ? 'text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20' : 'text-green-500 hover:bg-green-500/10 border border-transparent hover:border-green-500/20'}`}
                          title={agency.status === 'approved' ? 'Suspend Agency' : 'Activate Agency'}
                        >
                          {agency.status === 'approved' ? <Ban size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-600/10 border border-transparent hover:border-primary-600/20 rounded-xl transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <Building2 size={64} className="mx-auto text-[var(--text-muted)] opacity-10 mb-6" />
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-sm opacity-50">No agencies found in registry</p>
                    <p className="text-[var(--text-muted)] text-xs font-medium mt-2">Try adjusting your search criteria or filters.</p>
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

export default AdminAgencies;
