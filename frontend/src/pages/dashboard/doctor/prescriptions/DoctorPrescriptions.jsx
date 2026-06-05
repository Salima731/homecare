import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, X, User } from 'lucide-react';
import { useGetMyPatientsQuery } from '../../../../features/doctors/doctorApiSlice';
import { useCreatePrescriptionMutation, useGetPatientPrescriptionsQuery } from '../../../../features/prescriptions/prescriptionApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PrescriptionModal = ({ isOpen, onClose, patients }) => {
  const [createPrescription, { isLoading }] = useCreatePrescriptionMutation();
  const [formData, setFormData] = useState({
    patientId: '',
    validUntil: '',
    notes: '',
    medications: [{ name: '', dosage: '', frequency: '', durationDays: 7, instructions: '' }]
  });

  if (!isOpen) return null;

  const handleAddMed = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', durationDays: 7, instructions: '' }]
    }));
  };

  const handleRemoveMed = (index) => {
    if (formData.medications.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleMedChange = (index, field, value) => {
    setFormData(prev => {
      const newMeds = [...prev.medications];
      newMeds[index][field] = value;
      return { ...prev, medications: newMeds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) return toast.error('Please select a patient');
    if (!formData.medications[0].name) return toast.error('Add at least one medication');

    try {
      await createPrescription(formData).unwrap();
      toast.success('Prescription created successfully');
      onClose();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create prescription');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--bg-card)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[var(--border-main)] shadow-xl"
      >
        <div className="p-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]">
          <h2 className="font-bold text-lg">Create Prescription</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="rx-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-[var(--text-muted)] mb-1">Select Patient *</label>
                <select 
                  className="input w-full"
                  required
                  value={formData.patientId}
                  onChange={e => setFormData({...formData, patientId: e.target.value})}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients?.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-[var(--text-muted)] mb-1">Valid Until (Optional)</label>
                <input 
                  type="date" 
                  className="input w-full"
                  value={formData.validUntil}
                  onChange={e => setFormData({...formData, validUntil: e.target.value})}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black uppercase text-[var(--text-muted)]">Medications *</label>
                <button type="button" onClick={handleAddMed} className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Add Med
                </button>
              </div>

              <div className="space-y-3">
                {formData.medications.map((med, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] space-y-3 relative">
                    {formData.medications.length > 1 && (
                      <button type="button" onClick={() => handleRemoveMed(i)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-md">
                        <X size={16} />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input type="text" placeholder="Medication Name (e.g. Paracetamol)" required className="input w-full" value={med.name} onChange={e => handleMedChange(i, 'name', e.target.value)} />
                      </div>
                      <div>
                        <input type="text" placeholder="Dosage (e.g. 500mg)" className="input w-full" value={med.dosage} onChange={e => handleMedChange(i, 'dosage', e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input type="text" placeholder="Frequency (e.g. 1-0-1)" className="input w-full" value={med.frequency} onChange={e => handleMedChange(i, 'frequency', e.target.value)} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" placeholder="Days" required className="input w-24" value={med.durationDays} onChange={e => handleMedChange(i, 'durationDays', e.target.value)} />
                        <span className="text-sm text-[var(--text-muted)]">Days</span>
                      </div>
                    </div>

                    <div>
                      <input type="text" placeholder="Instructions (e.g. after food)" className="input w-full" value={med.instructions} onChange={e => handleMedChange(i, 'instructions', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[var(--text-muted)] mb-1">Doctor Notes (Optional)</label>
              <textarea 
                className="input w-full h-24 resize-none"
                placeholder="Any general advice for the patient..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            
          </form>
        </div>

        <div className="p-4 border-t border-[var(--border-main)] flex justify-end gap-2 bg-[var(--bg-main)]">
          <button type="button" onClick={onClose} className="btn bg-transparent hover:bg-gray-200 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button type="submit" form="rx-form" disabled={isLoading} className="btn btn-primary">
            {isLoading ? 'Creating...' : 'Create Prescription'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DoctorPrescriptions = () => {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: patientsRes, isLoading: patientsLoading } = useGetMyPatientsQuery();
  const { data: rxRes, isLoading: rxLoading } = useGetPatientPrescriptionsQuery(selectedPatient, {
    skip: !selectedPatient
  });

  const patients = patientsRes?.data || [];
  const prescriptions = rxRes?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Prescriptions</h1>
          <p className="text-[var(--text-muted)]">Write and manage prescriptions for your patients</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary shadow-lg shadow-primary-500/20">
          <Plus size={18} className="mr-2" /> Write Prescription
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-6">
        <label className="block text-xs font-black uppercase text-[var(--text-muted)] mb-2">View Patient Prescriptions</label>
        <select 
          className="input w-full md:w-1/2 lg:w-1/3"
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
        >
          <option value="">-- Select a patient to view history --</option>
          {patients.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!selectedPatient ? (
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] opacity-50">
          <User size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="font-bold">Select a patient above to view their prescription history</p>
        </div>
      ) : rxLoading ? (
        <LoadingSpinner />
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)]">
          <FileText size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="font-bold">No prescriptions found for this patient.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4 border-b border-[var(--border-main)] pb-4">
                <div>
                  <h3 className="font-bold text-lg">Prescription #{rx._id.substring(0,6).toUpperCase()}</h3>
                  <p className="text-sm text-[var(--text-muted)]">Date: {format(new Date(rx.prescribedDate), 'dd MMM yyyy')}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-lg uppercase ${
                  rx.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {rx.status}
                </span>
              </div>
              
              <div className="space-y-3">
                {rx.medications?.map((med, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)]">
                    <div>
                      <p className="font-bold text-[var(--text-main)]">{med.name} <span className="text-sm font-normal text-[var(--text-muted)] ml-2">{med.dosage}</span></p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Instructions: {med.instructions || 'None'}</p>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-sm font-bold">{med.frequency}</p>
                      <p className="text-xs text-[var(--text-muted)]">For {med.durationDays} days</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {rx.notes && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-900 text-sm">
                  <span className="font-bold">Doctor Notes:</span> {rx.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PrescriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patients={patients}
      />
    </div>
  );
};

export default DoctorPrescriptions;
