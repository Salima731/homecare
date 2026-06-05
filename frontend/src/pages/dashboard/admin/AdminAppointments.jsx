import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, Clock, CheckCircle, XCircle, Loader, Building2, Stethoscope, User } from 'lucide-react';
import { useGetAdminAppointmentsQuery } from '../../../features/appointments/appointmentApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: <Loader size={12} /> },
  accepted:  { label: 'Accepted',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       icon: <CheckCircle size={12} /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: <CheckCircle size={12} /> },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: <XCircle size={12} /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',         icon: <XCircle size={12} /> },
};

const AdminAppointments = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetAdminAppointmentsQuery(
    statusFilter ? { status: statusFilter } : {},
    { refetchOnMountOrArgChange: true }
  );

  const appointments = data?.data?.docs || data?.data || [];

  const filtered = appointments.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.doctor?.name?.toLowerCase().includes(q) ||
      a.patient?.name?.toLowerCase().includes(q) ||
      a.hospital?.hospitalName?.toLowerCase().includes(q) ||
      a.reason?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    accepted: appointments.filter(a => a.status === 'accepted').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Appointments</h1>
        <p className="text-[var(--text-muted)] font-medium">All doctor appointments across the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: stats.total,     color: 'from-violet-500 to-indigo-600' },
          { label: 'Pending',   value: stats.pending,   color: 'from-amber-400 to-orange-500' },
          { label: 'Accepted',  value: stats.accepted,  color: 'from-blue-500 to-cyan-500' },
          { label: 'Completed', value: stats.completed, color: 'from-emerald-500 to-green-600' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5 bg-[var(--bg-card)] border-[var(--border-main)] shadow-lg"
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <Calendar size={16} className="text-white" />
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
            placeholder="Search doctor, patient, hospital, reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 w-full bg-[var(--bg-card)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--text-muted)]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input bg-[var(--bg-card)] min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
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
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-lg">No appointments found</p>
            <p className="text-sm mt-1">Appointments will appear here once patients book with doctors.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filtered.map((apt, i) => {
                  const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                  return (
                    <motion.tr
                      key={apt._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-[var(--bg-main)]/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {apt.patient?.name?.[0]?.toUpperCase() || <User size={12} />}
                          </div>
                          <span className="font-bold text-sm text-[var(--text-main)]">{apt.patient?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope size={13} className="text-primary-500 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-sm text-[var(--text-main)]">Dr. {apt.doctor?.name || 'Unknown'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{apt.doctor?.specialization || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                          <Building2 size={13} className="flex-shrink-0" />
                          {apt.hospital?.hospitalName || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-main)]">
                          <Clock size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                          <div>
                            <p className="font-bold">{apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM d, yyyy') : '—'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{apt.appointmentDate ? format(new Date(apt.appointmentDate), 'h:mm a') : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)] max-w-[160px] truncate">{apt.reason || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointments;
