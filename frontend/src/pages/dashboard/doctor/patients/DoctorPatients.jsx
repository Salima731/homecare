import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Phone, Mail, ChevronRight, Activity } from 'lucide-react';
import { useGetMyPatientsQuery } from '../../../../features/doctors/doctorApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: response, isLoading } = useGetMyPatientsQuery();

  const patients = response?.data || [];
  
  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">My Patients</h1>
          <p className="text-[var(--text-muted)]">Patients from your appointments</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pr-10"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)]">
          <User size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="text-lg font-bold text-[var(--text-main)]">No patients found</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Vitals / Medical</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredPatients.map((patient, i) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={patient._id}
                    className="hover:bg-[var(--bg-main)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">
                          {patient.profileImage?.url ? (
                            <img src={patient.profileImage.url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            patient.name?.charAt(0) || 'P'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-main)]">{patient.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {patient.gender ? <span className="capitalize">{patient.gender}</span> : 'Unknown gender'}
                            {patient.dateOfBirth ? ` • ${Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000)} yrs` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {patient.phone ? (
                          <p className="text-xs text-[var(--text-main)] flex items-center gap-2"><Phone size={12} className="text-[var(--text-muted)]" />{patient.phone}</p>
                        ) : <span className="text-xs text-[var(--text-muted)] italic">No phone</span>}
                        {patient.email ? (
                          <p className="text-xs text-[var(--text-main)] flex items-center gap-2"><Mail size={12} className="text-[var(--text-muted)]" />{patient.email}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {patient.bloodGroup && patient.bloodGroup !== 'unknown' && (
                          <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase">
                            Blood: {patient.bloodGroup}
                          </span>
                        )}
                        {(!patient.bloodGroup || patient.bloodGroup === 'unknown') && (
                          <span className="text-xs text-[var(--text-muted)] italic">No medical info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/dashboard/doctor/patients/${patient._id}`)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center justify-end gap-1 ml-auto"
                      >
                        View Profile <ChevronRight size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
