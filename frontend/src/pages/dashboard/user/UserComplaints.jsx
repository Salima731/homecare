import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Clock, CheckCircle2, 
  XCircle, MessageSquare, Calendar, ChevronRight,
  ShieldCheck, AlertCircle, Info
} from 'lucide-react';
import { useGetMyComplaintsQuery } from '../../../features/complaints/complaintApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const UserComplaints = () => {
  const { data, isLoading } = useGetMyComplaintsQuery();
  const complaints = data?.data || [];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'in_review': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 size={14} />;
      case 'closed': return <XCircle size={14} />;
      case 'in_review': return <Clock size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Support Requests</h1>
          <p className="text-[var(--text-muted)] font-medium">Monitor your filed complaints and resolution status.</p>
        </div>
      </div>

      {complaints.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {complaints.map((complaint, i) => (
            <motion.div
              key={complaint._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card group overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] hover:shadow-2xl transition-all"
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="p-4 rounded-2xl bg-red-600/10 text-red-600 border border-red-600/20">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-[var(--text-main)]">{complaint.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getStatusStyle(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          {complaint.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        ID: {complaint._id} • Filed on {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {complaint.booking && (
                    <div className="flex items-center gap-3 bg-[var(--bg-main)]/50 px-4 py-2 rounded-xl border border-[var(--border-main)]">
                      <Calendar size={14} className="text-primary-600" />
                      <span className="text-xs font-bold text-[var(--text-main)]">Booking #{complaint.booking.slice(-6)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                      <MessageSquare size={14} /> Your Description
                    </h4>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed bg-[var(--bg-main)]/30 p-5 rounded-2xl border border-[var(--border-main)]">
                      {complaint.description}
                    </p>
                  </div>

                  {complaint.adminNote ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
                        <ShieldCheck size={14} /> Admin Response
                      </h4>
                      <div className="bg-primary-600/5 p-5 rounded-2xl border border-primary-600/20 space-y-4">
                        <p className="text-sm text-[var(--text-main)] leading-relaxed italic">
                          "{complaint.adminNote}"
                        </p>
                        {complaint.resolvedAt && (
                          <div className="pt-3 border-t border-primary-600/10 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Resolved By Team</span>
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">{format(new Date(complaint.resolvedAt), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <Clock size={14} /> Investigation Status
                      </h4>
                      <div className="p-5 rounded-2xl bg-[var(--bg-main)]/20 border border-[var(--border-main)] flex items-center gap-3">
                        <Info size={16} className="text-primary-500" />
                        <p className="text-xs text-[var(--text-muted)] font-medium">Our moderation team is currently reviewing your report. You will receive a notification once an action is taken.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-[var(--bg-card)] rounded-3xl border-2 border-dashed border-[var(--border-main)] shadow-2xl">
          <div className="w-20 h-20 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-[var(--text-muted)] opacity-20" />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-main)]">No complaints found</h2>
          <p className="text-[var(--text-muted)] max-w-sm mx-auto mt-2 font-medium">
            Great news! You haven't reported any issues. If you ever have a problem with a service, you can raise a complaint from your booking details.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserComplaints;
