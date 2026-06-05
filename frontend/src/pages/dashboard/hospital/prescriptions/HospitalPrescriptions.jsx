import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Pill, User, Stethoscope, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useGetHospitalPrescriptionsQuery } from '../../../../features/prescriptions/prescriptionApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',  icon: <CheckCircle size={12} /> },
  expired:   { label: 'Expired',   color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',        icon: <Clock size={12} /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: <XCircle size={12} /> },
};

const HospitalPrescriptions = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetHospitalPrescriptionsQuery(
    statusFilter ? { status: statusFilter } : {},
    { refetchOnMountOrArgChange: true }
  );

  const prescriptions = data?.data?.docs || data?.data || [];

  const filtered = prescriptions.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.doctor?.name?.toLowerCase().includes(q) ||
      p.patient?.name?.toLowerCase().includes(q) ||
      p.medications?.some(m => m.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Prescriptions</h1>
          <p className="text-[var(--text-muted)] font-medium">All prescriptions issued by your hospital's doctors.</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl px-4 py-2">
          <FileText size={16} className="text-primary-500" />
          <span className="font-black text-[var(--text-main)]">{prescriptions.length}</span>
          <span className="text-xs text-[var(--text-muted)] font-bold">Total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 bg-[var(--bg-card)] border-[var(--border-main)] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search doctor, patient, medication..."
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

      {/* Content */}
      {isLoading ? (
        <div className="p-16"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-20 text-center bg-[var(--bg-card)] border-[var(--border-main)]">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-bold text-lg text-[var(--text-main)]">No prescriptions found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Prescriptions will appear here once doctors issue them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rx, i) => {
            const cfg = STATUS_CONFIG[rx.status] || STATUS_CONFIG.active;
            return (
              <motion.div
                key={rx._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 bg-[var(--bg-card)] border-[var(--border-main)] shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-[var(--text-main)]">
                          {rx.medications?.map(m => m.name).slice(0, 2).join(', ') || 'Prescription'}
                          {rx.medications?.length > 2 && ` +${rx.medications.length - 2} more`}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {rx.patient?.name || 'Unknown Patient'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Stethoscope size={12} /> Dr. {rx.doctor?.name || 'Unknown'}
                          {rx.doctor?.specialization && ` · ${rx.doctor.specialization}`}
                        </span>
                        {rx.prescribedDate && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {format(new Date(rx.prescribedDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>

                      {rx.notes && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 italic">"{rx.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Medications list */}
                  {rx.medications?.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                      {rx.medications.slice(0, 3).map((med, mi) => (
                        <span key={mi} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg text-xs font-bold text-[var(--text-main)]">
                          <Pill size={12} className="text-primary-500" />
                          {med.name} {med.dosage}
                        </span>
                      ))}
                      {rx.medications.length > 3 && (
                        <span className="text-xs text-[var(--text-muted)] font-bold">+{rx.medications.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HospitalPrescriptions;
