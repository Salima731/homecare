import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, Clock, MapPin } from 'lucide-react';
import { useGetMyAppointmentsQuery, useCancelAppointmentMutation } from '../../../../features/appointments/appointmentApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const UserAppointments = () => {
  const [filter, setFilter] = useState('all');
  const { data: response, isLoading } = useGetMyAppointmentsQuery({ status: filter !== 'all' ? filter : undefined });
  const [cancelAppointment, { isLoading: isCancelling }] = useCancelAppointmentMutation();

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment(id).unwrap();
        toast.success('Appointment cancelled');
      } catch (err) {
        toast.error(err.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  const appointments = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">My Appointments</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage your doctor consultations</p>
        </div>
        <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-main)]">
          {['all', 'pending', 'accepted', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                filter === f ? 'bg-primary-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)]">
          <Calendar size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="text-lg font-bold text-[var(--text-main)]">No appointments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={apt._id}
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] overflow-hidden shadow-sm"
            >
              <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex-shrink-0 overflow-hidden text-primary-600 font-bold flex items-center justify-center">
                    {apt.doctor?.profileImage?.url ? (
                      <img src={apt.doctor.profileImage.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      apt.doctor?.name?.charAt(0) || 'D'
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-main)]">Dr. {apt.doctor?.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{apt.doctor?.specialization}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                  apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  apt.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                  apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {apt.status}
                </span>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold text-[var(--text-main)] bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-main)]">
                  <Clock size={16} className="text-primary-500" />
                  {format(new Date(apt.appointmentDate), 'MMM dd, yyyy - hh:mm a')}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                    <MapPin size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <span>{apt.hospital?.hospitalName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-muted)]">Consultation Fee:</span>
                    <span className="font-bold text-[var(--text-main)]">${apt.doctor?.consultationFee || 0}</span>
                  </div>
                </div>
                
                <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)] text-sm">
                  <p className="font-bold mb-1 text-xs uppercase tracking-widest text-[var(--text-muted)]">Reason</p>
                  <p>{apt.reason}</p>
                </div>
                
                {apt.notes && (
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900">
                    <p className="font-bold mb-1 text-xs uppercase tracking-widest text-blue-700">Doctor Notes</p>
                    <p>{apt.notes}</p>
                  </div>
                )}
              </div>

              {apt.status === 'pending' && (
                <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)]">
                  <button
                    onClick={() => handleCancel(apt._id)}
                    disabled={isCancelling}
                    className="w-full btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  >
                    <X size={16} className="mr-2" /> Cancel Appointment
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAppointments;
