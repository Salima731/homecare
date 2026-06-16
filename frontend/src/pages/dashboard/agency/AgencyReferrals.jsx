import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, User, Clock, CheckCircle2, AlertCircle,
  X, ChevronRight, Activity, Stethoscope, Heart, Calendar
} from 'lucide-react';
import {
  useGetAgencyReferralsQuery,
  useAssignReferralCaregiverMutation,
  useGetAgencyCaregiversQuery,
} from '../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const urgencyColor = (u) => {
  if (u === 'emergency') return 'bg-red-500/10 text-red-600 border-red-500/20';
  if (u === 'urgent')    return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
  return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
};

const statusColor = (s) => {
  if (s === 'completed')   return 'bg-green-500/10 text-green-600 border-green-500/20';
  if (s === 'in_progress') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  if (s === 'accepted')    return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
  if (s === 'cancelled')   return 'bg-red-500/10 text-red-600 border-red-500/20';
  return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ─── component ───────────────────────────────────────────────────────────── */
const AgencyReferrals = () => {
  const { data, isLoading, refetch } = useGetAgencyReferralsQuery();
  const { data: caregiversData }     = useGetAgencyCaregiversQuery();
  const [assignReferralCaregiver, { isLoading: isAssigning }] = useAssignReferralCaregiverMutation();

  const referrals  = data?.data || [];
  const caregivers = caregiversData?.data || [];

  const [selectedReferral, setSelectedReferral] = useState(null);  // detail modal
  const [assignReferral, setAssignReferral]     = useState(null);  // assign modal
  const [selectedCaregiverId, setSelectedCaregiverId] = useState('');

  /* ── open assign modal ── */
  const openAssign = (ref) => {
    setSelectedCaregiverId('');
    setAssignReferral(ref);
  };

  /* ── submit assignment ── */
  const handleAssign = async () => {
    if (!selectedCaregiverId) { toast.error('Please select a caregiver'); return; }
    try {
      await assignReferralCaregiver({
        referralId: assignReferral._id,
        caregiverId: selectedCaregiverId,
      }).unwrap();
      toast.success('Caregiver assigned & booking created!');
      setAssignReferral(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Assignment failed');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
            Hospital Referrals
          </h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">
            Patients referred by hospitals — assign caregivers to start their home care.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-main)] px-4 py-2 rounded-xl text-sm font-bold text-[var(--text-muted)]">
          <Activity size={16} className="text-primary-500" />
          {referrals.length} Total Referrals
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        {referrals.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-main)] border border-dashed border-[var(--border-main)] flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">No Referrals Yet</h2>
            <p className="text-[var(--text-muted)] max-w-sm mt-2 text-sm">
              When hospitals refer patients to your agency, they will appear here for caregiver assignment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border-main)]">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Hospital</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Urgency</th>
                  <th className="px-6 py-4">Assigned Caregiver</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {referrals.map((ref) => (
                  <tr key={ref._id} className="hover:bg-[var(--bg-main)]/30 transition-colors">
                    {/* Patient */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {ref.patient?.name?.[0] || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-main)] text-sm">{ref.patient?.name || 'Unknown'}</p>
                          <p className="text-xs text-[var(--text-muted)]">Referred {fmt(ref.createdAt)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Hospital */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[var(--text-main)]">
                        {ref.hospital?.hospitalName || ref.referredBy?.entityId?.hospitalName || '—'}
                      </p>
                    </td>

                    {/* Service */}
                    <td className="px-6 py-4">
                      <span className="bg-primary-600/10 text-primary-600 border border-primary-600/20 px-2.5 py-1 rounded-md text-xs font-bold capitalize">
                        {ref.serviceType?.replace('_', ' ') || '—'}
                      </span>
                    </td>

                    {/* Urgency */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border capitalize ${urgencyColor(ref.urgency)}`}>
                        {ref.urgency}
                      </span>
                    </td>

                    {/* Assigned Caregiver */}
                    <td className="px-6 py-4">
                      {ref.assignedCaregiver ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-[var(--text-main)]">
                            {ref.assignedCaregiver?.name || 'Assigned'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] italic">Not assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor(ref.status)}`}>
                        {ref.status?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReferral(ref)}
                          className="btn btn-outline py-1 px-3 text-xs border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all font-bold"
                        >
                          Details
                        </button>
                        {ref.status === 'pending' && (
                          <button
                            onClick={() => openAssign(ref)}
                            className="btn btn-primary py-1 px-3 text-xs font-bold flex items-center gap-1"
                          >
                            <User size={13} /> Assign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════ ASSIGN CAREGIVER MODAL ═══════════════════ */}
      <AnimatePresence>
        {assignReferral && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]/20">
                <div>
                  <h2 className="text-lg font-black text-[var(--text-main)]">Assign Caregiver</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Patient: <span className="font-bold text-[var(--text-main)]">{assignReferral.patient?.name}</span>
                    {' · '}{assignReferral.serviceType?.replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={() => setAssignReferral(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info Banner */}
              <div className="mx-6 mt-5 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl flex items-start gap-3">
                <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Assigning a caregiver will automatically create a <strong className="text-[var(--text-main)]">Booking</strong> and notify them immediately. They can then clock in/out from their dashboard.
                </p>
              </div>

              {/* Caregiver List */}
              <div className="p-6 space-y-3 max-h-[320px] overflow-y-auto">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Select Caregiver</p>
                {caregivers.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[var(--border-main)] rounded-xl">
                    <p className="text-[var(--text-muted)] text-sm">No active caregivers available in your agency.</p>
                  </div>
                ) : (
                  caregivers.map((cg) => (
                    <div
                      key={cg._id}
                      onClick={() => setSelectedCaregiverId(cg._id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedCaregiverId === cg._id
                          ? 'border-primary-600 bg-primary-600/5 shadow-md'
                          : 'border-[var(--border-main)] hover:bg-[var(--bg-main)]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                          {cg.name?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-main)] text-sm">{cg.name}</p>
                          <p className="text-xs text-[var(--text-muted)] capitalize">
                            {cg.serviceType?.replace('_', ' ')} · {cg.experience}y exp
                          </p>
                        </div>
                      </div>
                      {selectedCaregiverId === cg._id && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                          <CheckCircle2 size={14} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)]/20 flex justify-end gap-3">
                <button
                  onClick={() => setAssignReferral(null)}
                  className="btn bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedCaregiverId}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isAssigning ? <LoadingSpinner size="sm" /> : <><Heart size={16} /> Confirm & Assign</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ DETAIL MODAL ═══════════════════ */}
      <AnimatePresence>
        {selectedReferral && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]/20">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-[var(--text-main)]">Referral Details</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor(selectedReferral.status)}`}>
                    {selectedReferral.status?.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReferral(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Status Timeline */}
                <div className="relative flex justify-between items-center max-w-md mx-auto py-2">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--border-main)] -translate-y-1/2 z-0" />
                  {['pending', 'accepted', 'in_progress', 'completed'].map((step, idx) => {
                    const statuses = ['pending', 'accepted', 'in_progress', 'completed'];
                    const currentIdx = statuses.indexOf(selectedReferral.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = selectedReferral.status === step;
                    return (
                      <div key={step} className="flex flex-col items-center z-10 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          isPassed ? 'bg-primary-600 border-primary-600 text-white' : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)]'
                        } ${isCurrent ? 'ring-4 ring-primary-600/20 scale-110' : ''}`}>
                          {isPassed ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider mt-2 bg-[var(--bg-card)] px-1 text-[var(--text-muted)]">
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <hr className="border-[var(--border-main)]" />

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Patient</span>
                    <p className="font-bold text-[var(--text-main)] text-sm">{selectedReferral.patient?.name || 'Unknown'}</p>
                  </div>
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Assigned Caregiver</span>
                    <p className="font-bold text-[var(--text-main)] text-sm">
                      {selectedReferral.assignedCaregiver?.name || <span className="text-[var(--text-muted)] italic text-xs">Not assigned</span>}
                    </p>
                  </div>
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Service Type</span>
                    <p className="font-bold text-[var(--text-main)] text-sm capitalize">{selectedReferral.serviceType?.replace('_', ' ') || '—'}</p>
                  </div>
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Urgency</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border capitalize ${urgencyColor(selectedReferral.urgency)}`}>
                      {selectedReferral.urgency}
                    </span>
                  </div>
                </div>

                {/* Booking Link */}
                {selectedReferral.booking && (
                  <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/15 rounded-xl">
                    <Calendar size={18} className="text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-green-600">Booking Created</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                        #{(selectedReferral.booking?._id || selectedReferral.booking).toString().slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Medical Notes */}
                {selectedReferral.medicalNotes && (
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Medical Notes</span>
                    <div className="bg-[var(--bg-main)]/20 p-3 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                      {selectedReferral.medicalNotes}
                    </div>
                  </div>
                )}

                {/* Home Care Plan */}
                {selectedReferral.homeCarePlan && (
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Home Care Plan</span>
                    <div className="bg-[var(--bg-main)]/20 p-3 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                      {selectedReferral.homeCarePlan}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)]/20 flex justify-end gap-3">
                {selectedReferral.status === 'pending' && (
                  <button
                    onClick={() => { setSelectedReferral(null); openAssign(selectedReferral); }}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <User size={16} /> Assign Caregiver
                  </button>
                )}
                <button
                  onClick={() => setSelectedReferral(null)}
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

export default AgencyReferrals;