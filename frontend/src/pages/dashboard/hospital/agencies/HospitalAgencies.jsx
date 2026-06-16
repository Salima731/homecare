import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Building2, MapPin, Phone, Globe, Star,
  Shield, CheckCircle2, Users, X, ExternalLink, ClipboardList
} from 'lucide-react';
import { useGetAgenciesQuery } from '../../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const statusBadge = (status) => {
  if (status === 'approved')  return 'bg-green-500/10 text-green-600 border-green-500/20';
  if (status === 'pending')   return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  if (status === 'rejected')  return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (status === 'suspended') return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
};

const HospitalAgencies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const navigate = useNavigate();

  const { data: response, isLoading } = useGetAgenciesQuery();
  const agencies = response?.data?.docs || response?.data || [];

  const filtered = agencies.filter(a =>
    a.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Home Care Agencies</h1>
          <p className="text-[var(--text-muted)] font-medium">Browse registered agencies to coordinate patient referrals and post-discharge care.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/hospital/referrals')}
          className="btn btn-primary flex items-center gap-2 shadow-lg"
        >
          <ClipboardList size={18} /> Go to Referrals
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center">
            <Building2 size={22} className="text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--text-main)]">{agencies.length}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Agencies</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 size={22} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--text-main)]">{agencies.filter(a => a.isVerified).length}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Verified</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <Star size={22} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-[var(--text-main)]">
              {agencies.length > 0 ? (agencies.reduce((s, a) => s + (a.rating || 0), 0) / agencies.length).toFixed(1) : '0.0'}
            </p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, city, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 bg-[var(--bg-card)] border-[var(--border-main)]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border-main)]">
                <tr>
                  <th className="px-6 py-4">Agency</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filtered.length > 0 ? (
                  filtered.map((agency) => (
                    <tr key={agency._id} className="hover:bg-[var(--bg-main)]/30 transition-colors">
                      {/* Agency Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
                            {agency.logo?.url ? (
                              <img src={agency.logo.url} alt={agency.agencyName} className="w-full h-full object-cover" />
                            ) : (
                              agency.agencyName?.charAt(0) || 'A'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[var(--text-main)] text-sm">{agency.agencyName}</p>
                              {agency.isVerified && (
                                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)] font-mono">LIC: {agency.licenseNumber || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-main)]">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            {[agency.address?.city, agency.address?.state].filter(Boolean).join(', ') || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-main)]">
                        {agency.phone || '—'}
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-[var(--text-main)]">{agency.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-xs text-[var(--text-muted)]">({agency.reviewCount || 0})</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusBadge(agency.status)}`}>
                          {agency.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedAgency(agency)}
                          className="btn btn-outline py-1 px-3 text-xs border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all font-bold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-[var(--text-muted)]">
                      <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
                      <p className="font-bold text-lg text-[var(--text-main)]">No Agencies Found</p>
                      <p className="text-sm mt-1">No home care agencies match your search criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════ AGENCY DETAIL MODAL ═══════════════════ */}
      <AnimatePresence>
        {selectedAgency && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
                    {selectedAgency.logo?.url ? (
                      <img src={selectedAgency.logo.url} alt={selectedAgency.agencyName} className="w-full h-full object-cover" />
                    ) : (
                      selectedAgency.agencyName?.charAt(0) || 'A'
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-main)]">{selectedAgency.agencyName}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusBadge(selectedAgency.status)}`}>
                        {selectedAgency.status}
                      </span>
                      {selectedAgency.isVerified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                          <Shield size={12} /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgency(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Description */}
                {selectedAgency.description && (
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">About</span>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">{selectedAgency.description}</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">License</span>
                    <p className="font-bold text-[var(--text-main)] text-sm font-mono">{selectedAgency.licenseNumber || '—'}</p>
                  </div>
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Rating</span>
                    <div className="flex items-center gap-1.5">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-[var(--text-main)] text-sm">{selectedAgency.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-xs text-[var(--text-muted)]">({selectedAgency.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Caregivers</span>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary-600" />
                      <span className="font-bold text-[var(--text-main)] text-sm">{selectedAgency.caregiverCount || 0}</span>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Phone</span>
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      <span className="font-bold text-[var(--text-main)] text-sm">{selectedAgency.phone || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Address</span>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-[var(--text-main)]">
                      {[selectedAgency.address?.street, selectedAgency.address?.city, selectedAgency.address?.state, selectedAgency.address?.country]
                        .filter(Boolean).join(', ') || 'No address provided'}
                    </p>
                  </div>
                </div>

                {/* Website */}
                {selectedAgency.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-primary-600" />
                    <a
                      href={selectedAgency.website.startsWith('http') ? selectedAgency.website : `https://${selectedAgency.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 font-bold hover:underline flex items-center gap-1"
                    >
                      {selectedAgency.website} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)]/20 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedAgency(null);
                    navigate('/dashboard/hospital/referrals');
                  }}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <ClipboardList size={16} /> Create Referral
                </button>
                <button
                  onClick={() => setSelectedAgency(null)}
                  className="btn bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HospitalAgencies;
