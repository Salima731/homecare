import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Building2, Stethoscope, ShieldAlert, ShieldCheck, Filter } from 'lucide-react';
import { useGetAdminDoctorsQuery } from '../../../features/doctors/doctorApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const AdminDoctors = () => {
  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');

  const { data, isLoading } = useGetAdminDoctorsQuery({}, { refetchOnMountOrArgChange: true });
  const doctors = data?.data || [];

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.licenseNumber?.toLowerCase().includes(q);
    const matchHospital =
      !hospitalFilter ||
      d.hospital?._id === hospitalFilter ||
      d.hospital?.hospitalName?.toLowerCase().includes(hospitalFilter.toLowerCase());
    return matchSearch && matchHospital;
  });

  const hospitals = [...new Map(doctors.filter(d => d.hospital).map(d => [d.hospital._id, d.hospital])).values()];

  const stats = {
    total: doctors.length,
    active: doctors.filter(d => d.isActive && !d.isSuspended).length,
    suspended: doctors.filter(d => d.isSuspended).length,
    invited: doctors.filter(d => d.user).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Doctors</h1>
        <p className="text-[var(--text-muted)] font-medium">Platform-wide doctor registry across all hospitals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'from-violet-500 to-indigo-600' },
          { label: 'Active', value: stats.active, color: 'from-emerald-500 to-green-600' },
          { label: 'Invited', value: stats.invited, color: 'from-blue-500 to-cyan-500' },
          { label: 'Suspended', value: stats.suspended, color: 'from-red-500 to-rose-600' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5 bg-[var(--bg-card)] border-[var(--border-main)] shadow-lg"
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <Users size={16} className="text-white" />
            </div>
            <p className="text-2xl font-black text-[var(--text-main)]">{s.value}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 bg-[var(--bg-card)] border-[var(--border-main)] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, specialization, license..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full bg-[var(--bg-card)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--text-muted)]" />
          <select
            value={hospitalFilter}
            onChange={e => setHospitalFilter(e.target.value)}
            className="input bg-[var(--bg-card)] min-w-[160px]"
          >
            <option value="">All Hospitals</option>
            {hospitals.map(h => (
              <option key={h._id} value={h._id}>{h.hospitalName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-[var(--text-muted)]">
            <Stethoscope size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-lg">No doctors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Login</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filtered.map((doc, i) => (
                  <motion.tr
                    key={doc._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[var(--bg-main)]/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold text-sm">
                          {doc.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--text-main)]">Dr. {doc.name}</p>
                          <p className="text-xs text-[var(--text-muted)] font-mono">{doc.licenseNumber || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--text-muted)]">{doc.specialization || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--text-main)]">
                        <Building2 size={14} className="text-[var(--text-muted)]" />
                        {doc.hospital?.hospitalName || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{doc.department?.name || '—'}</td>
                    <td className="px-6 py-4">
                      {doc.user ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-black">
                          <ShieldCheck size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-black">
                          No Login
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {doc.isSuspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-black">
                          <ShieldAlert size={11} /> Suspended
                        </span>
                      ) : doc.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-black">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full text-xs font-black">
                          Inactive
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
