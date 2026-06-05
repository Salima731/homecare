import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Filter, FileText, Activity, X, Check, ArrowRight, ArrowLeft, Clock, Shield, AlertTriangle, AlertCircle, Heart } from 'lucide-react';
import { 
  useGetHospitalReferralsQuery, 
  useCreateReferralMutation, 
  useGetHospitalPatientsQuery,
  useGetHospitalProfileQuery
} from '../../../../features/hospitals/hospitalApiSlice';
import { useGetAgenciesQuery } from '../../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectCurrentToken } from '../../../../features/auth/authSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5005';

const ReferralsList = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);
  
  // New Referral Form Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
    patientId: '',
    assignedAgencyId: '',
    serviceType: 'general_care',
    urgency: 'routine',
    medicalNotes: '',
    homeCarePlan: ''
  });

  const { data: response, isLoading, refetch } = useGetHospitalReferralsQuery();
  const { data: patientsResponse, isLoading: patientsLoading } = useGetHospitalPatientsQuery();
  const { data: agenciesResponse, isLoading: agenciesLoading } = useGetAgenciesQuery();
  const { data: profileResponse } = useGetHospitalProfileQuery();
  const [createReferral, { isLoading: isCreating }] = useCreateReferralMutation();
  
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

const referrals = response?.data || [];
  const patients = patientsResponse?.data || [];
  const agencies = agenciesResponse?.data || [];
  const hospitalProfile = profileResponse?.data;

  // Real-time socket status updates
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    socket.on('referral_status_updated', (data) => {
      refetch();
      toast.success(`Referral status updated to ${data.status.replace('_', ' ')}!`, {
        icon: '📋',
      });
      if (selectedReferral && selectedReferral._id === data.referralId) {
        // Update currently viewed details dynamically
        setSelectedReferral(prev => prev ? { ...prev, status: data.status } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token, refetch, selectedReferral]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.assignedAgencyId) {
      toast.error('Please select both a patient and an agency.');
      return;
    }

    try {
      const payload = {
        ...formData,
        hospitalId: hospitalProfile?._id
      };
      await createReferral(payload).unwrap();
      toast.success('Home Care referral sent successfully!');
      setIsNewModalOpen(false);
      // Reset form
      setFormData({
        patientId: '',
        assignedAgencyId: '',
        serviceType: '',
        urgency: 'routine',
        medicalNotes: '',
        homeCarePlan: ''
      });
      setWizardStep(1);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit referral');
    }
  };

  const handleNewReferralClick = () => {
    if (!hospitalProfile?.isVerified && hospitalProfile?.status !== 'approved') {
      toast.error('Your hospital profile must be verified by admin before making referrals.');
      return;
    }
    setIsNewModalOpen(true);
  };

  // Filter logic
  const filteredReferrals = referrals.filter(r => {
    const matchesTab = activeTab === 'all' ? true : r.status === activeTab;
    const patientName = r.patient?.name || '';
    const agencyName = r.assignedAgency?.agencyName || '';
    const service = r.serviceType || '';
    const matchesSearch = 
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r._id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedPatientData = patients.find(p => p._id === formData.patientId);
  const selectedAgencyData = agencies.find(a => a._id === formData.assignedAgencyId);

  const tabs = [
    { id: 'all', label: 'All Referrals' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Home Care Referrals</h1>
          <p className="text-[var(--text-muted)] font-medium">Coordinate smooth transitions and discharge pathways for your patients.</p>
        </div>
        <button 
          onClick={handleNewReferralClick}
          className="btn btn-primary flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={18} /> New Referral
        </button>
      </div>

      {/* Main Grid and Controls */}
      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        <div className="border-b border-[var(--border-main)] bg-[var(--bg-main)]/30 px-6 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 mb-[-1px]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors relative ${
                  activeTab === tab.id 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600" />
                )}
              </button>
            ))}
          </div>

          <div className="pb-3 md:pb-0 max-w-xs w-full relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search referrals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 py-1.5 text-xs bg-[var(--bg-card)] border-[var(--border-main)]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border-main)]">
                <tr>
                  <th className="px-6 py-4">Referral ID</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Agency Assigned</th>
                  <th className="px-6 py-4">Urgency</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredReferrals.length > 0 ? (
                  filteredReferrals.map((ref) => (
                    <tr key={ref._id} className="hover:bg-[var(--bg-main)]/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[var(--text-muted)]">
                        #{ref._id.substring(0,8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-[var(--text-main)] text-sm">{ref.patient?.name || 'Unknown'}</p>
                          <p className="text-xs text-[var(--text-muted)]">ID: {ref.patient?.patientId || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-primary-600/10 text-primary-600 border border-primary-600/20 px-2.5 py-1 rounded-md text-xs font-bold capitalize">
                          {ref.serviceType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[var(--text-main)]">{ref.assignedAgency?.agencyName || 'Pending'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          ref.urgency === 'urgent' 
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
                          : 'bg-gray-500/10 text-gray-600 border border-gray-500/10'
                        }`}>
                          {ref.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          ref.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                          ref.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                          ref.status === 'accepted' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                          ref.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        }`}>
                          {ref.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedReferral(ref)}
                          className="btn btn-outline py-1 px-3 text-xs border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-all font-bold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-[var(--text-muted)]">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <Activity size={48} className="text-gray-300 mb-3" />
                        <p className="font-bold text-lg text-[var(--text-main)]">No Referrals Found</p>
                        <p className="text-sm mt-1 mb-4">Create a referral to link your admitted patients with post-discharge home care services.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Referral Modal (Wizard) */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]/20">
                <div>
                  <h2 className="text-xl font-black text-[var(--text-main)]">Create Patient Referral</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Discharge path coordinator • Step {wizardStep} of 3</p>
                </div>
                <button 
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-main)]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Tracker */}
              <div className="px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-main)]/10 flex items-center justify-between text-xs">
                <span className={`font-bold ${wizardStep >= 1 ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>1. Select Patient</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className={`font-bold ${wizardStep >= 2 ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>2. Select Agency</span>
                <ArrowRight size={14} className="text-gray-400" />
                <span className={`font-bold ${wizardStep >= 3 ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>3. Care Plan Details</span>
              </div>

              {/* Step Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">Select Admitted Patient</h3>
                    {patientsLoading ? (
                      <LoadingSpinner />
                    ) : patients.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-[var(--border-main)] rounded-xl">
                        <p className="text-[var(--text-muted)] mb-3">No active patients admitted to your hospital.</p>
                        <p className="text-xs text-primary-600 font-bold">Please admit patients from the Patients registry before initiating referrals.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {patients.map(patient => (
                          <div 
                            key={patient._id}
                            onClick={() => setFormData(prev => ({ ...prev, patientId: patient._id }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              formData.patientId === patient._id
                              ? 'border-primary-600 bg-primary-600/5 shadow-md'
                              : 'border-[var(--border-main)] hover:bg-[var(--bg-main)]/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center font-bold">
                                {patient.name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <p className="font-bold text-[var(--text-main)] text-sm">{patient.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">DOB: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                              </div>
                            </div>
                            {formData.patientId === patient._id && (
                              <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                                <Check size={14} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">Select Home Care Agency</h3>
                    {agenciesLoading ? (
                      <LoadingSpinner />
                    ) : agencies.length === 0 ? (
                      <p className="text-[var(--text-muted)] text-center">No home care agencies registered on CareConnect.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {agencies.map(agency => (
                          <div 
                            key={agency._id}
                            onClick={() => setFormData(prev => ({ ...prev, assignedAgencyId: agency._id }))}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              formData.assignedAgencyId === agency._id
                              ? 'border-primary-600 bg-primary-600/5 shadow-md'
                              : 'border-[var(--border-main)] hover:bg-[var(--bg-main)]/40'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-[var(--text-main)] text-sm">{agency.agencyName}</p>
                              <p className="text-xs text-[var(--text-muted)]">{agency.phone || agency.email}</p>
                            </div>
                            {formData.assignedAgencyId === agency._id && (
                              <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                                <Check size={14} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Required Service</label>
                        <select
                          name="serviceType"
                          value={formData.serviceType}
                          onChange={handleInputChange}
                          className="input"
                        >
                          <option value="babysitter">babysitter</option>
                          <option value="nurse">nurse</option>
                          <option value="elder_care">elder_care</option>
                          <option value="special_needs">special_needs</option>
                         
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Urgency Level</label>
                        <select
                          name="urgency"
                          value={formData.urgency}
                          onChange={handleInputChange}
                          className="input"
                        >
                          <option value="routine">Routine</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Medical Notes & Diagnosis</label>
                        <textarea
                          name="medicalNotes"
                          rows="3"
                          value={formData.medicalNotes}
                          onChange={handleInputChange}
                          placeholder="Include primary diagnosis, allergies, medication updates..."
                          className="input resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Home Care instructions Plan</label>
                        <textarea
                          name="homeCarePlan"
                          rows="3"
                          value={formData.homeCarePlan}
                          onChange={handleInputChange}
                          placeholder="Instructions for caregiver, visitation frequency..."
                          className="input resize-none"
                        />
                      </div>
                    </div>

                    {/* Quick Summary Card */}
                    <div className="md:col-span-2 bg-[var(--bg-main)]/50 p-4 rounded-xl border border-[var(--border-main)] flex flex-wrap gap-4 items-center justify-between">
                      <div className="text-xs">
                        <span className="font-medium text-[var(--text-muted)]">Patient:</span> <span className="font-bold text-[var(--text-main)]">{selectedPatientData?.name || 'Not Selected'}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-[var(--text-muted)]">Agency:</span> <span className="font-bold text-[var(--text-main)]">{selectedAgencyData?.agencyName || 'Not Selected'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)]/20 flex justify-between gap-4">
                {wizardStep > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="btn bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] flex items-center gap-1.5"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setIsNewModalOpen(false)}
                    className="btn bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)]"
                  >
                    Cancel
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button 
                    type="button" 
                    disabled={(wizardStep === 1 && !formData.patientId) || (wizardStep === 2 && !formData.assignedAgencyId)}
                    onClick={() => setWizardStep(prev => prev + 1)}
                    className="btn btn-primary flex items-center gap-1.5 ml-auto"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isCreating}
                    onClick={handleCreateReferral}
                    className="btn btn-primary flex items-center gap-1.5 ml-auto"
                  >
                    {isCreating ? <LoadingSpinner size="sm" /> : <><Heart size={16} /> Submit Referral</>}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Referral Details Modal */}
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
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-[var(--text-main)]">Referral Details</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      selectedReferral.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                      selectedReferral.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                      selectedReferral.status === 'accepted' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                      selectedReferral.status === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                    }`}>
                      {selectedReferral.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-[var(--text-muted)] mt-1">ID: #{selectedReferral._id}</p>
                </div>
                <button 
                  onClick={() => setSelectedReferral(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-main)]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Main Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Visual Progress Timeline */}
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
                          isPassed 
                          ? 'bg-primary-600 border-primary-600 text-white' 
                          : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)]'
                        } ${isCurrent ? 'ring-4 ring-primary-600/20 scale-110' : ''}`}>
                          {isPassed ? <Check size={14} /> : <Clock size={14} />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider mt-2 bg-[var(--bg-card)] px-1 text-[var(--text-muted)]">
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <hr className="border-[var(--border-main)]" />

                <div className="grid grid-cols-2 gap-4">
                  {/* Patient Info */}
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Patient</span>
                    <p className="font-bold text-[var(--text-main)] text-sm">{selectedReferral.patient?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--text-muted)]">ID: {selectedReferral.patient?.patientId || 'N/A'}</p>
                  </div>

                  {/* Agency Assigned */}
                  <div className="bg-[var(--bg-main)]/30 p-4 rounded-xl border border-[var(--border-main)]">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Agency Assigned</span>
                    <p className="font-bold text-[var(--text-main)] text-sm">{selectedReferral.assignedAgency?.agencyName || 'Pending'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Urgency: {selectedReferral.urgency}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Service Type</span>
                    <p className="text-sm font-bold text-[var(--text-main)] capitalize">{selectedReferral.serviceType?.replace('_', ' ')}</p>
                  </div>

                  {selectedReferral.medicalNotes && (
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Medical Notes & Diagnosis</span>
                      <div className="bg-[var(--bg-main)]/20 p-3 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                        {selectedReferral.medicalNotes}
                      </div>
                    </div>
                  )}

                  {selectedReferral.homeCarePlan && (
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Home Care instructions Plan</span>
                      <div className="bg-[var(--bg-main)]/20 p-3 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                        {selectedReferral.homeCarePlan}
                      </div>
                    </div>
                  )}

                  {selectedReferral.adminNote && (
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Admin Response Note</span>
                      <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10 text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap">
                        {selectedReferral.adminNote}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-[var(--border-main)] bg-[var(--bg-main)]/20 flex justify-end">
                <button 
                  onClick={() => setSelectedReferral(null)}
                  className="btn bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)]"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReferralsList;
