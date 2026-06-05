import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Download } from 'lucide-react';
import { useGetPatientPrescriptionsQuery } from '../../../../features/prescriptions/prescriptionApiSlice';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../../features/auth/authSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const UserPrescriptions = () => {
  const user = useSelector(selectCurrentUser);
  // Get patient ID (Wait, we need the patient ID. We can get it if the backend allows `me` or if the user profile includes it. But the backend allows patientId. Wait, getPatientPrescriptions takes patientId. We don't have the patientId easily on the frontend for user, unless it's in the profile. Let's just create an endpoint or adjust the controller to use req.user._id if patientId is 'me'.
  // Actually, I can just fetch it from getMe or profile if needed. Let's assume we can fetch patient profile first, or adjust backend.
  // Wait, I can modify the slice/controller to handle 'me'.
  // Let me just fetch user profile first to get the patient ID).
  
  // To keep it simple, I'll use a custom query or modify the controller. Let's assume we have a hook for Patient Profile.
  // For now, I'll use a hack to get the patient ID from user if possible, or I'll just use a 'me' alias in the backend.
  // Actually, let's just make getPatientPrescriptions ('me') work by modifying the backend controller in the next step, or fetch profile.
  // Let's modify the slice to call `/prescriptions/patient/me` and we'll fix the controller.
  
  const { data: response, isLoading } = useGetPatientPrescriptionsQuery('me');
  const prescriptions = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">My Prescriptions</h1>
          <p className="text-[var(--text-muted)] font-medium">View your medical prescriptions from doctors</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)]">
          <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="text-lg font-bold text-[var(--text-main)]">No prescriptions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {prescriptions.map((rx, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={rx._id}
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] overflow-hidden shadow-sm flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-start bg-[var(--bg-main)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg text-[var(--text-main)]">Dr. {rx.doctor?.name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                      rx.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {rx.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{rx.hospital?.hospitalName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Prescribed On</p>
                  <p className="text-sm font-bold">{format(new Date(rx.prescribedDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Medications</h4>
                <div className="space-y-3">
                  {rx.medications?.map((med, idx) => (
                    <div key={idx} className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-main)]">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-[var(--text-main)] text-sm">{med.name}</p>
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">{med.dosage}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[var(--text-muted)]">Frequency</p>
                          <p className="font-bold">{med.frequency}</p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)]">Duration</p>
                          <p className="font-bold">{med.durationDays} days</p>
                        </div>
                      </div>
                      {med.instructions && (
                        <p className="text-xs mt-2 pt-2 border-t border-[var(--border-main)] text-[var(--text-muted)]">
                          <span className="font-bold text-[var(--text-main)]">Instructions:</span> {med.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                {rx.notes && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900">
                    <p className="font-bold mb-1 text-xs uppercase tracking-widest text-blue-700">Doctor Notes</p>
                    <p>{rx.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPrescriptions;
