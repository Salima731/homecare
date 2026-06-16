import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  MapPin, Stethoscope, RefreshCw, ListFilter
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday, isPast, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  useGetMyAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
} from '../../../../features/appointments/appointmentApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';

/* ─── Status Badge ──────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:   { cls: 'bg-amber-100 text-amber-700',    label: 'Pending' },
    accepted:  { cls: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
    confirmed: { cls: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
    completed: { cls: 'bg-blue-100 text-blue-700',       label: 'Completed' },
    cancelled: { cls: 'bg-red-100 text-red-700',         label: 'Cancelled' },
    rejected:  { cls: 'bg-gray-100 text-gray-600',       label: 'Rejected' },
  };
  const { cls, label } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
};

/* ─── Appointment Card ──────────────────────────────────────── */
const AppointmentCard = ({ appt, onAction, actionLoading }) => {
  const date = appt.appointmentDate ? parseISO(appt.appointmentDate) : null;
  const isActionable = ['pending'].includes(appt.status);
  const isLoadingAccept = actionLoading === `${appt._id}-accepted`;
  const isLoadingReject = actionLoading === `${appt._id}-rejected`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <User size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="font-black text-[var(--text-main)] text-sm leading-tight">
              {appt.patient?.name || 'Patient'}
            </p>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 capitalize">
              {appt.type || 'General Consultation'}
            </p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--text-muted)] font-medium mb-4">
        {date && (
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-primary-500" />
            {format(date, 'MMM dd, yyyy')}
          </span>
        )}
        {appt.time && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-primary-500" />
            {appt.time}
          </span>
        )}
        {appt.location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={12} className="text-primary-500" />
            {appt.location}
          </span>
        )}
      </div>

      {appt.notes && (
        <p className="text-xs text-[var(--text-muted)] italic bg-[var(--bg-main)] px-3 py-2 rounded-xl mb-3">
          {appt.notes}
        </p>
      )}

      {isActionable && (
        <div className="flex gap-2 pt-2 border-t border-[var(--border-main)]">
          <button
            onClick={() => onAction(appt._id, 'accepted')}
            disabled={!!actionLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-60"
          >
            {isLoadingAccept ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Accept
          </button>
          <button
            onClick={() => onAction(appt._id, 'rejected')}
            disabled={!!actionLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-60"
          >
            {isLoadingReject ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            Reject
          </button>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const DoctorSchedules = () => {
  const [view, setView] = useState('week'); // 'week' | 'list'
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const { data: apptRes, isLoading, isFetching, refetch } = useGetMyAppointmentsQuery({});
  const [updateStatus] = useUpdateAppointmentStatusMutation();

  const appointments = apptRes?.data || [];

  const handleRefetch = async () => {
    try {
      await refetch().unwrap();
      toast.success('Schedule refreshed!');
    } catch {
      toast.error('Failed to refresh');
    }
  };

  const handleAction = async (id, status) => {
    setActionLoading(`${id}-${status}`);
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Appointment ${status}!`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter(a => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const getApptForDay = (day) =>
    filtered.filter(a => {
      try { return a.appointmentDate && isSameDay(parseISO(a.appointmentDate), day); }
      catch { return false; }
    });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const acceptedCount = appointments.filter(a => a.status === 'accepted' || a.status === 'confirmed').length;
  const todayCount = appointments.filter(a => {
    try { return a.appointmentDate && isToday(parseISO(a.appointmentDate)); }
    catch { return false; }
  }).length;

  const statusOptions = ['all', 'pending', 'accepted', 'completed', 'cancelled', 'rejected'];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">My Schedule</h1>
          <p className="text-[var(--text-muted)] font-medium">View and manage your upcoming appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefetch}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] hover:text-primary-600 hover:border-primary-300 transition-all text-sm font-bold disabled:opacity-60"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-primary-500' : ''} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="flex rounded-xl border border-[var(--border-main)] overflow-hidden">
            {['week', 'list'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2.5 text-sm font-black capitalize transition-all ${
                  view === v
                    ? 'bg-primary-600 text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Appointments", value: todayCount, color: 'text-primary-600', bg: 'bg-primary-50', icon: <Calendar size={20} className="text-primary-500" /> },
          { label: 'Pending Confirmation',  value: pendingCount,   color: 'text-amber-600',   bg: 'bg-amber-50',   icon: <Clock size={20} className="text-amber-500" /> },
          { label: 'Accepted This Week',    value: acceptedCount,  color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 size={20} className="text-emerald-500" /> },
        ].map((s, i) => (
          <div key={i} className={`card p-5 flex items-center gap-4 ${s.bg} border-0`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <ListFilter size={16} className="text-[var(--text-muted)]" />
        {statusOptions.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-black capitalize transition-all ${
              statusFilter === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-muted)] hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── WEEK VIEW ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === 'week' && (
          <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Week nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setWeekStart(d => addDays(d, -7))}
                className="p-2 rounded-xl border border-[var(--border-main)] hover:border-primary-300 hover:text-primary-600 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-black text-[var(--text-main)]">
                {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
              <button
                onClick={() => setWeekStart(d => addDays(d, 7))}
                className="p-2 rounded-xl border border-[var(--border-main)] hover:border-primary-300 hover:text-primary-600 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const dayAppts = getApptForDay(day);
                const isCurrentDay = isToday(day);
                return (
                  <div key={day.toISOString()} className="space-y-2">
                    {/* Day header */}
                    <div className={`text-center p-2 rounded-xl ${isCurrentDay ? 'bg-primary-600 text-white' : 'bg-[var(--bg-main)]'}`}>
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{format(day, 'EEE')}</p>
                      <p className={`text-lg font-black ${isCurrentDay ? '' : 'text-[var(--text-main)]'}`}>{format(day, 'd')}</p>
                    </div>
                    {/* Appointments */}
                    <div className="space-y-2 min-h-[60px]">
                      {dayAppts.length === 0 ? (
                        <div className="h-12 rounded-xl border border-dashed border-[var(--border-main)] flex items-center justify-center">
                          <span className="text-[10px] text-[var(--text-muted)]">—</span>
                        </div>
                      ) : (
                        dayAppts.map((appt) => (
                          <div
                            key={appt._id}
                            className={`p-2.5 rounded-xl border text-xs font-bold cursor-default transition-all ${
                              (appt.status === 'accepted' || appt.status === 'confirmed') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                              appt.status === 'pending'   ? 'bg-amber-50 border-amber-200 text-amber-800' :
                              appt.status === 'cancelled' ? 'bg-red-50 border-red-100 text-red-500 line-through opacity-60' :
                              appt.status === 'rejected'  ? 'bg-gray-50 border-gray-200 text-gray-600 opacity-60' :
                              'bg-blue-50 border-blue-100 text-blue-800'
                            }`}
                          >
                            <p className="truncate">{appt.patient?.name || 'Patient'}</p>
                            {appt.time && <p className="text-[10px] opacity-70 mt-0.5">{appt.time}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── LIST VIEW ─────────────────────────────────────── */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filtered.length === 0 ? (
              <div className="card p-16 text-center space-y-3">
                <Stethoscope size={44} className="mx-auto text-[var(--text-muted)] opacity-40" />
                <p className="text-xl font-black text-[var(--text-main)]">No appointments found</p>
                <p className="text-[var(--text-muted)] font-medium">
                  {statusFilter !== 'all' ? `No ${statusFilter} appointments.` : 'Your schedule is clear.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((appt, i) => (
                  <motion.div
                    key={appt._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <AppointmentCard
                      appt={appt}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorSchedules;
