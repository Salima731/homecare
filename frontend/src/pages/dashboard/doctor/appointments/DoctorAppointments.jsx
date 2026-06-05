import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Calendar, Clock, User, AlertCircle, FileText } from 'lucide-react';
import { useGetMyAppointmentsQuery, useUpdateAppointmentStatusMutation } from '../../../../features/appointments/appointmentApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorAppointments = () => {
  const [filter, setFilter] = useState('pending');
  const { data: response, isLoading } = useGetMyAppointmentsQuery({ status: filter }, { pollingInterval: 5000 });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAppointmentStatusMutation();

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Appointment ${status}`);
    } catch (err) {
      toast.error(err.data?.message || `Failed to ${status} appointment`);
    }
  };

  const appointments = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Appointments</h1>
          <p className="text-[var(--text-muted)]">Manage your patient appointments</p>
        </div>
        <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-main)]">
          {['pending', 'accepted', 'completed', 'cancelled'].map(f => (
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
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)]">
          <Calendar size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="text-lg font-bold text-[var(--text-main)]">No {filter} appointments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={apt._id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                      {apt.patient?.profileImage?.url ? (
                        <img src={apt.patient.profileImage.url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        apt.patient?.name?.charAt(0) || 'P'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-main)]">{apt.patient?.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">Age: {apt.patient?.dateOfBirth ? Math.floor((new Date() - new Date(apt.patient.dateOfBirth)) / 31557600000) : 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-lg uppercase ${
                    apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    apt.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                    apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <Calendar size={16} className="text-primary-500" />
                    {format(new Date(apt.appointmentDate), 'MMM dd, yyyy - hh:mm a')}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <AlertCircle size={16} className="text-primary-500" />
                    <span className="truncate">{apt.reason}</span>
                  </p>
                </div>

                {filter === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(apt._id, 'accepted')}
                      disabled={isUpdating}
                      className="flex-1 btn bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                    >
                      <Check size={16} className="mr-2" /> Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(apt._id, 'rejected')}
                      disabled={isUpdating}
                      className="flex-1 btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    >
                      <X size={16} className="mr-2" /> Reject
                    </button>
                  </div>
                )}
                
                {filter === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(apt._id, 'completed')}
                    disabled={isUpdating}
                    className="w-full btn btn-primary"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
