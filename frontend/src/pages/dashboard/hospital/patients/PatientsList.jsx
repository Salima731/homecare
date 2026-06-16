import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, UserPlus, FileText, ChevronRight, X, User } from 'lucide-react';
import { useGetHospitalPatientsQuery, useAdmitPatientMutation, useLazySearchPatientsQuery } from '../../../../features/hospitals/hospitalApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PatientsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: response, isLoading } = useGetHospitalPatientsQuery();
  const [admitPatient, { isLoading: isAdmitting }] = useAdmitPatientMutation();
  const [triggerSearch, { data: searchResults, isFetching: isSearching }] = useLazySearchPatientsQuery();
  
  const patients = response?.data || [];

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error('Please enter at least 2 characters to search');
      return;
    }
    try {
      await triggerSearch({ q: searchQuery.trim() }).unwrap();
    } catch (error) {
      toast.error(error?.data?.message || 'Search failed');
    }
  };

  const handleAdmitPatient = async (patientId) => {
    if (!patientId) return;
    try {
      await admitPatient(patientId).unwrap();
      toast.success('Patient admitted to hospital successfully!');
      setIsAdmitModalOpen(false);
      setSearchQuery('');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to admit patient.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Patients Registry</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage hospital patients and their admission status.</p>
        </div>
        <button onClick={() => { setIsAdmitModalOpen(true); setSearchQuery(''); }} className="btn btn-primary flex items-center justify-center gap-2 shadow-lg">
          <UserPlus size={18} /> Admit Patient
        </button>
      </div>

      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search admitted patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 bg-[var(--bg-card)] border-[var(--border-main)]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">ID / Ward</th>
                  <th className="px-6 py-4">Admission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-600/20 text-primary-600 flex items-center justify-center font-bold">
                            {patient.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-main)] text-sm">{patient.name || 'Unknown'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{patient.email || 'No email provided'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[var(--text-main)] text-sm">{patient.patientId || `PT-${patient._id.substring(0,6)}`}</p>
                        <p className="text-xs text-[var(--text-muted)]">{patient.ward || 'General'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-main)]">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          patient.status === 'discharged' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {patient.status || 'Admitted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/dashboard/hospital/patients/${patient._id}`)}
                          className="text-primary-600 hover:text-primary-800 text-sm font-bold flex items-center justify-end gap-1 ml-auto transition-colors"
                        >
                          View Details <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={48} className="text-gray-300 mb-4" />
                        <p className="font-bold text-lg">No Patients Found</p>
                        <p className="text-sm mt-1">Get started by admitting a new patient.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)] shrink-0">
              <div>
                <h2 className="text-xl font-black text-[var(--text-main)]">Find & Admit Patient</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Search the platform to link a patient to your hospital.</p>
              </div>
              <button onClick={() => setIsAdmitModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-main)]">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 shrink-0 bg-[var(--bg-main)]/30 border-b border-[var(--border-main)]">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search size={18} />
                  </span>
                  <input 
                    type="text" 
                    className="input pl-10 w-full" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    placeholder="Search by patient name, email, or phone number..." 
                  />
                </div>
                <button type="submit" disabled={isSearching || !searchQuery.trim()} className="btn btn-primary whitespace-nowrap px-6">
                  {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
                </button>
              </form>
            </div>

            <div className="overflow-y-auto p-6 flex-1 min-h-[300px]">
              {isSearching ? (
                <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
              ) : searchResults?.data?.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.data.map(patient => (
                    <div key={patient._id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] hover:border-primary-500/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center">
                          {patient.profileImage ? (
                            <img src={patient.profileImage} alt={patient.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-main)]">{patient.name}</p>
                          <div className="flex gap-3 text-xs text-[var(--text-muted)] mt-1">
                            {patient.email && <span>{patient.email}</span>}
                            {patient.phone && <span>• {patient.phone}</span>}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {patient.gender && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-500/10 text-gray-500">{patient.gender}</span>}
                            {patient.bloodGroup && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-500/10 text-red-500">{patient.bloodGroup}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleAdmitPatient(patient._id)}
                        disabled={isAdmitting}
                        className="btn btn-primary py-2 px-4 shadow-md flex items-center gap-2"
                      >
                        <Plus size={16} /> Admit
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && searchResults ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-center">
                  <User size={48} className="text-gray-300 mb-4 opacity-50" />
                  <p className="font-bold text-lg">No Patients Found</p>
                  <p className="text-sm mt-1 max-w-sm">No matching patients were found on the platform. Please check the spelling or try a different phone number/email.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-center opacity-50">
                  <Search size={48} className="mb-4" />
                  <p className="font-medium">Search for a patient to admit them</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
