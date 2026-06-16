import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, CheckCircle2, XCircle, Clock, User,
  History, CalendarCheck, ChevronDown, Loader2,
  AlertTriangle, ListChecks, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  useGetPendingMedicationsQuery,
  useGetMedicationHistoryQuery,
  useLogMedicationMutation,
} from '../../../features/caregivers/caregiverApiSlice';
import { useGetCaregiverPatientsQuery } from '../../../features/health/healthLogApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

/* ─── Status badge ──────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    taken: { bg: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={12} />, label: 'Taken' },
    missed: { bg: 'bg-red-100 text-red-700', icon: <XCircle size={12} />, label: 'Missed' },
    pending: { bg: 'bg-amber-100 text-amber-700', icon: <Clock size={12} />, label: 'Pending' },
  };
  const { bg, icon, label } = map[status] || { bg: 'bg-gray-100 text-gray-700', icon: null, label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${bg}`}>
      {icon}{label}
    </span>
  );
};

/* ─── Main Component ────────────────────────────────────────────── */
const CaregiverMedications = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loggingId, setLoggingId] = useState(null); // tracks which med is being logged

  const { data: patientsRes, isLoading: patientsLoading } = useGetCaregiverPatientsQuery();
  const patients = patientsRes?.data || [];

  const {
    data: pendingRes,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useGetPendingMedicationsQuery();
  const pendingMeds = pendingRes?.data || [];

  const {
    data: historyRes,
    isLoading: historyLoading,
  } = useGetMedicationHistoryQuery(selectedPatient, { skip: !selectedPatient || activeTab !== 'history' });
  const historyLogs = historyRes?.data || [];

  const [logMedication] = useLogMedicationMutation();

  const handleLog = async (med, status) => {
    const key = `${med.prescriptionId}-${med.medicationName}-${med.scheduledTime}`;
    setLoggingId(key + status);
    try {
      await logMedication({
        prescriptionId: med.prescriptionId,
        patientId: med.patient._id || med.patient,
        medicationName: med.medicationName,
        scheduledTime: med.scheduledTime,
        status,
      }).unwrap();
      toast.success(`Marked as ${status}!`);
      refetchPending();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to log medication');
    } finally {
      setLoggingId(null);
    }
  };

  const tabs = [
    { id: 'today', label: "Today's Schedule", icon: <CalendarCheck size={16} /> },
    { id: 'history', label: 'History', icon: <History size={16} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            Medication Tracking
          </h1>
          <p className="text-[var(--text-muted)] font-medium">
            Log and monitor medication administration for your assigned patients
          </p>
        </div>
        <button
          onClick={refetchPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-300 transition-all text-sm font-bold"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Pending Today',
            value: pendingLoading ? '…' : pendingMeds.length,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            icon: <Clock size={20} className="text-amber-500" />,
          },
          {
            label: 'Patients Assigned',
            value: patientsLoading ? '…' : patients.length,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
            icon: <User size={20} className="text-primary-500" />,
          },
          {
            label: 'Total Scheduled',
            value: pendingLoading ? '…' : pendingMeds.length,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            icon: <ListChecks size={20} className="text-emerald-500" />,
          },
        ].map((s, i) => (
          <div key={i} className={`card p-5 flex items-center gap-4 ${s.bg} border-0`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-main)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-black transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── TODAY TAB ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {pendingLoading ? (
              <LoadingSpinner />
            ) : pendingMeds.length === 0 ? (
              <div className="card p-16 text-center space-y-3">
                <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
                <p className="text-xl font-black text-[var(--text-main)]">All caught up!</p>
                <p className="text-[var(--text-muted)] font-medium">
                  No pending medications for today.
                </p>
              </div>
            ) : (
              pendingMeds.map((med, i) => {
                const key = `${med.prescriptionId}-${med.medicationName}-${med.scheduledTime}`;
                const patientName = med.patient?.name || 'Patient';
                const schedTime = new Date(med.scheduledTime);
                const isPast = schedTime < new Date();

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
                        <Pill size={22} className="text-primary-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-[var(--text-main)] text-base">{med.medicationName}</p>
                        {med.dosage && (
                          <span className="inline-block text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                            {med.dosage}
                          </span>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium">
                            <User size={12} /> {patientName}
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-bold ${isPast ? 'text-red-500' : 'text-amber-600'}`}>
                            <Clock size={12} />
                            {format(schedTime, 'hh:mm a')} — {isPast ? 'Overdue' : 'Upcoming'}
                          </span>
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-[var(--text-muted)] mt-1 italic">{med.instructions}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 shrink-0">
                      <button
                        onClick={() => handleLog(med, 'taken')}
                        disabled={!!loggingId}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition-all active:scale-95 disabled:opacity-60"
                      >
                        {loggingId === key + 'taken' ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        Taken
                      </button>
                      <button
                        onClick={() => handleLog(med, 'missed')}
                        disabled={!!loggingId}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-black transition-all active:scale-95 disabled:opacity-60"
                      >
                        {loggingId === key + 'missed' ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <XCircle size={15} />
                        )}
                        Missed
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────── */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Patient selector */}
            <div className="card p-5">
              <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                Select Patient
              </label>
              {patientsLoading ? (
                <div className="animate-pulse h-12 bg-[var(--bg-main)] rounded-xl w-full md:w-1/2" />
              ) : (
                <div className="relative w-full md:w-1/2">
                  <select
                    className="input w-full appearance-none pr-10"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <option value="">-- Choose a patient --</option>
                    {patients.map((p) => (
                      <option key={p.user._id} value={p.user._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                </div>
              )}
            </div>

            {/* History table */}
            {!selectedPatient ? (
              <div className="card p-16 text-center opacity-60">
                <User size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
                <p className="font-bold text-[var(--text-muted)]">Select a patient to view their medication history</p>
              </div>
            ) : historyLoading ? (
              <LoadingSpinner />
            ) : historyLogs.length === 0 ? (
              <div className="card p-16 text-center space-y-2">
                <AlertTriangle size={40} className="mx-auto text-amber-400" />
                <p className="font-bold text-[var(--text-main)]">No medication history found</p>
                <p className="text-sm text-[var(--text-muted)]">Logs will appear here after medications are administered.</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-main)] border-b border-[var(--border-main)] text-xs uppercase text-[var(--text-muted)]">
                      <tr>
                        <th className="px-6 py-4 font-black">Medication</th>
                        <th className="px-6 py-4 font-black">Scheduled</th>
                        <th className="px-6 py-4 font-black">Status</th>
                        <th className="px-6 py-4 font-black">Confirmed By</th>
                        <th className="px-6 py-4 font-black">Logged At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)]">
                      {historyLogs.map((log, i) => (
                        <motion.tr
                          key={log._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-[var(--bg-main)] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                                <Pill size={16} className="text-primary-600" />
                              </div>
                              <span className="font-bold text-[var(--text-main)] text-sm">
                                {log.medicationName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-sm text-[var(--text-main)]">
                              {format(new Date(log.scheduledTime), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {format(new Date(log.scheduledTime), 'hh:mm a')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={log.status} />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-[var(--text-main)]">
                              {log.confirmedBy?.name || 'System'}
                            </span>
                            {log.confirmedBy?.role && (
                              <p className="text-xs text-[var(--text-muted)] capitalize">{log.confirmedBy.role}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-[var(--text-muted)] font-medium">
                            {log.takenAt ? format(new Date(log.takenAt), 'MMM dd, hh:mm a') : '—'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaregiverMedications;
