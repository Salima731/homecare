import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, User } from 'lucide-react';
import { useGetCaregiverPatientsQuery } from '../../../features/health/healthLogApiSlice';
import { useGetPatientPrescriptionsQuery } from '../../../features/prescriptions/prescriptionApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const CaregiverPrescriptions = () => {
  const [selectedPatient, setSelectedPatient] = useState('');
  
  const { data: patientsRes, isLoading: patientsLoading } = useGetCaregiverPatientsQuery();
  const { data: rxRes, isLoading: rxLoading } = useGetPatientPrescriptionsQuery(selectedPatient, {
    skip: !selectedPatient
  });

  const patients = patientsRes?.data || [];
 
  const prescriptions = rxRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Prescriptions</h1>
          <p className="text-[var(--text-muted)] font-medium">View prescriptions for your assigned patients</p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-6 shadow-sm">
        <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Select Assigned Patient</label>
        {patientsLoading ? (
          <div className="animate-pulse h-12 bg-[var(--bg-main)] rounded-xl w-full md:w-1/2"></div>
        ) : (
          <select 
            className="input w-full md:w-1/2 lg:w-1/3"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="">-- Choose a patient to view --</option>
            {patients.map(p => (
             <option
  key={p.user._id}
  value={p.user._id}
>
  {p.name}
</option>
            ))}
          </select>
        )}
      </div>

      {!selectedPatient ? (
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] opacity-50">
          <User size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="font-bold">Select a patient above to view their prescription history</p>
        </div>
      ) : rxLoading ? (
        <LoadingSpinner />
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm">
          <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="font-bold text-lg text-[var(--text-main)]">No prescriptions found for this patient.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {prescriptions.map((rx, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={rx._id}
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] p-6 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start mb-4 border-b border-[var(--border-main)] pb-4">
                <div>
                  <h3 className="font-bold text-lg">Dr. {rx.doctor?.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{rx.hospital?.hospitalName}</p>
                  <p className="text-xs text-[var(--text-muted)] font-bold mt-1">Prescribed: {format(new Date(rx.prescribedDate), 'MMM dd, yyyy')}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                  rx.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {rx.status}
                </span>
              </div>
              
              <div className="space-y-3 flex-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Medications</h4>
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
                <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-900 text-sm">
                  <span className="font-bold">Doctor Notes:</span> {rx.notes}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaregiverPrescriptions;
