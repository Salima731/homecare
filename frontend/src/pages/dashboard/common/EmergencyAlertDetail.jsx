import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  AlertTriangle, AlertCircle, Calendar, Clock, User, Phone, MapPin, 
  ChevronLeft, ArrowRight, ShieldAlert, Heart, Building2, Send, CheckCircle2, History
} from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { 
  useGetAlertByIdQuery, 
  useUpdateAlertStatusMutation 
} from '../../../features/emergencyAlerts/emergencyAlertApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const SEVERITY_BADGES = {
  'Critical': 'bg-red-500 text-white animate-pulse',
  'High': 'bg-orange-500 text-white',
  'Medium': 'bg-yellow-500 text-gray-950',
  'Low': 'bg-blue-500 text-white',
};

const STATUS_BADGES = {
  'Open': 'bg-red-600/10 text-red-600 border-red-500/20',
  'In Progress': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Resolved': 'bg-green-600/10 text-green-500 border-green-500/20',
};

const EmergencyAlertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const { data: alertResponse, isLoading, refetch } = useGetAlertByIdQuery(id);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAlertStatusMutation();

  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const alert = alertResponse?.data;
  const isAgencyOrAdmin = ['agency', 'admin'].includes(user?.role);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus && !note.trim()) {
      toast.error('Please specify a status or add a response note');
      return;
    }

    try {
      await updateStatus({
        id,
        status: newStatus || undefined,
        note: note.trim() || undefined,
      }).unwrap();

      toast.success('Alert status updated successfully');
      setNote('');
      setNewStatus('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update alert');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!alert) {
    return (
      <div className="p-12 text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Alert not found</h2>
        <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to dashboard
      </button>

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--bg-card)] border border-[var(--border-main)] p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${SEVERITY_BADGES[alert.severityLevel]}`}>
              {alert.severityLevel} Severity
            </span>
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${STATUS_BADGES[alert.status]}`}>
              {alert.status}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight">{alert.alertType}</h1>
          <p className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
            <Calendar size={14} /> Registered: {new Date(alert.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
          <AlertTriangle size={32} className={alert.status !== 'Resolved' ? 'animate-bounce' : ''} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Case Details & Response timeline */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Situation Description */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-8 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase tracking-widest">Emergency Description</h3>
            <p className="text-[var(--text-main)] text-sm leading-relaxed whitespace-pre-line bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--border-main)] font-medium">
              {alert.description}
            </p>
          </div>

          {/* Timeline Response Logs */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-8 rounded-3xl space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase tracking-widest flex items-center gap-2">
              <History size={20} /> Response Log & Timeline
            </h3>

            <div className="relative border-l-2 border-[var(--border-main)] pl-6 ml-4 space-y-8">
              
              {/* Alert Raised node */}
              <div className="relative">
                <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-red-600 border-4 border-[var(--bg-card)] flex items-center justify-center" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-red-600">Emergency Alert Raised</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-[var(--text-main)] mt-2 font-medium">Incident ticket opened by caregiver {alert.caregiverId?.name}.</p>
                </div>
              </div>

              {/* Response notes nodes */}
              {alert.responseNotes?.map((note, index) => (
                <div key={note._id || index} className="relative">
                  <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-amber-500 border-4 border-[var(--bg-card)]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500">
                      Response Update — By {note.addedBy?.name || 'User'} ({note.role})
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{new Date(note.timestamp).toLocaleString()}</p>
                    <p className="text-sm text-[var(--text-main)] mt-2 font-medium bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                      {note.note}
                    </p>
                  </div>
                </div>
              ))}

              {/* Resolved node if resolved */}
              {alert.status === 'Resolved' && (
                <div className="relative">
                  <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-green-600 border-4 border-[var(--bg-card)] flex items-center justify-center" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-green-600">Emergency Alert Resolved</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : 'Resolved'}
                    </p>
                    <p className="text-sm text-[var(--text-main)] mt-2 font-medium">Incident closed successfully.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response update form for Agency / Admin */}
          {isAgencyOrAdmin && alert.status !== 'Resolved' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight uppercase tracking-widest">Update Incident Status</h3>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Change Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="input w-full bg-[var(--bg-main)]/50 border-[var(--border-main)] rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="">Keep current ({alert.status})</option>
                      <option value="In Progress">Move to In Progress</option>
                      <option value="Resolved">Resolve Incident</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Add Response Log / Note</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter dispatch details, EMT arrival status, or other logging notes..."
                    className="input min-h-[100px] py-4 bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] rounded-2xl px-6 font-bold focus:border-red-500 transition-all resize-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] py-4 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-red-900/10 transition-all active:scale-95"
                >
                  {isUpdating ? <LoadingSpinner size="sm" /> : (
                    <>
                      <Send size={14} /> Update Emergency Incident
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Col: Associated Parties Info */}
        <div className="space-y-6">
          
          {/* Patient Details */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-6 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-primary-600 uppercase tracking-widest">Patient Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] flex items-center justify-center font-bold text-sm">
                  <User size={18} className="text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Patient Name</p>
                  <p className="font-black text-[var(--text-main)] text-sm">{alert.patientId?.name || 'Unavailable'}</p>
                </div>
              </div>
              
              {alert.patientId?.address && (
                <div className="flex items-start gap-3 border-t border-[var(--border-main)] pt-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Home Address</p>
                    <p className="font-bold text-[var(--text-main)] text-xs leading-relaxed mt-0.5">{alert.patientId.address}</p>
                  </div>
                </div>
              )}

              {alert.patientId?.emergencyContact && (
                <div className="flex items-start gap-3 border-t border-[var(--border-main)] pt-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-red-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Emergency Contact</p>
                    <p className="font-black text-red-600 text-sm mt-0.5">{alert.patientId.emergencyContact.name}</p>
                    <p className="font-bold text-[var(--text-muted)] text-xs">{alert.patientId.emergencyContact.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Caregiver Details */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-6 rounded-3xl space-y-4 shadow-sm">
            <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest">Reporting Caregiver</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center font-bold text-orange-700 text-lg shadow-inner overflow-hidden">
                {alert.caregiverId?.profileImage ? (
                  <img src={alert.caregiverId.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  alert.caregiverId?.name?.[0]?.toUpperCase() || 'C'
                )}
              </div>
              <div>
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Name</p>
                <p className="font-black text-[var(--text-main)] text-sm">{alert.caregiverId?.name}</p>
                {alert.caregiverId?.phone && (
                  <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5 flex items-center gap-1">
                    <Phone size={10} /> {alert.caregiverId.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Agency Details */}
          {alert.agencyId && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-main)] p-6 rounded-3xl space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Managing Agency</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Agency Name</p>
                    <p className="font-black text-[var(--text-main)] text-sm">{alert.agencyId.name}</p>
                  </div>
                </div>
                {alert.agencyId.phone && (
                  <div className="flex items-center gap-3 border-t border-[var(--border-main)] pt-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] flex items-center justify-center">
                      <Phone size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Contact Phone</p>
                      <p className="font-bold text-[var(--text-main)] text-xs">{alert.agencyId.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default EmergencyAlertDetail;
