import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Upload, X, FileText, ChevronLeft, Image as ImageIcon,
  CheckCircle2, Plus, Lock, Users, Stethoscope, FileUp, Activity, Pill, Shield, Syringe, FolderOpen,
  ChevronRight, Search, User
} from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useUploadMedicalRecordMutation } from '../../../features/medicalRecords/medicalRecordApiSlice';
import { useGetHospitalPatientsQuery, useGetPatientByIdQuery } from '../../../features/hospitals/hospitalApiSlice';
import { useGetMyPatientsQuery } from '../../../features/doctors/doctorApiSlice';
import { useGetCaregiverBookingsQuery } from '../../../features/bookings/bookingApiSlice';

const CATEGORIES = [
  { id: 'lab_report', label: 'Lab Report', icon: <Activity size={18} /> },
  { id: 'prescription', label: 'Prescription', icon: <Pill size={18} /> },
  { id: 'scan_report', label: 'Scan Report', icon: <ImageIcon size={18} /> },
  { id: 'discharge_summary', label: 'Discharge Summary', icon: <FileText size={18} /> },
  { id: 'medical_certificate', label: 'Certificate', icon: <Shield size={18} /> },
  { id: 'vaccination_record', label: 'Vaccination', icon: <Syringe size={18} /> },
  { id: 'other', label: 'Other', icon: <FolderOpen size={18} /> },
];

const VISIBILITY_OPTIONS = [
  { id: 'private', label: 'Private (Me & Doctor)', icon: <Lock size={16} /> },
  { id: 'caregiver', label: 'Share with Caregiver', icon: <Stethoscope size={16} /> },
  { id: 'family', label: 'Share with Family', icon: <Users size={16} /> },
];

const UploadMedicalRecord = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const queryPatientId = new URLSearchParams(location.search).get('patientId') || location.state?.patientId;
  const [uploadRecord, { isLoading }] = useUploadMedicalRecordMutation();

  const [formData, setFormData] = useState({
    patientId: queryPatientId || '',
    title: '',
    category: 'lab_report',
    diagnosis: '',
    notes: '',
    visibility: 'private',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const isClinicalStaff = user?.role !== 'user';
  const { data: selectedPatientRes } = useGetPatientByIdQuery(formData.patientId, {
    skip: !isClinicalStaff || !formData.patientId
  });
  const selectedPatient = selectedPatientRes?.data || selectedPatientRes;

  const { data: hospitalPatientsResponse } = useGetHospitalPatientsQuery(undefined, {
    skip: user?.role !== 'hospital' || !!formData.patientId
  });
  const { data: doctorPatientsResponse } = useGetMyPatientsQuery(undefined, {
    skip: user?.role !== 'doctor' || !!formData.patientId
  });
  const { data: caregiverJobsResponse } = useGetCaregiverBookingsQuery(undefined, {
    skip: user?.role !== 'caregiver' || !!formData.patientId
  });

  const getSelectablePatients = () => {
    if (user?.role === 'hospital') return hospitalPatientsResponse?.data || [];
    if (user?.role === 'doctor') return doctorPatientsResponse?.data || [];
    if (user?.role === 'caregiver') {
      const bookings = caregiverJobsResponse?.data || caregiverJobsResponse?.jobs || [];
      const patientsMap = new Map();
      bookings.forEach(b => {
        const patientObj = b.user;
        if (patientObj && patientObj._id) {
          patientsMap.set(patientObj._id, patientObj);
        }
      });
      return Array.from(patientsMap.values());
    }
    return [];
  };

  const selectablePatients = getSelectablePatients();
  const filteredSelectable = selectablePatients.filter(p => 
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('pdf');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return toast.error('Title is required');
    if (!file) return toast.error('Please select a file to upload');

    // Admin/Doctor/Hospital need to provide a patientId if they are uploading for someone else
    if (user.role !== 'user' && !formData.patientId.trim()) {
      return toast.error('Patient ID is required');
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('category', formData.category);
    submitData.append('diagnosis', formData.diagnosis);
    submitData.append('notes', formData.notes);
    submitData.append('visibility', formData.visibility);
    submitData.append('tags', JSON.stringify(tags));
    submitData.append('reportFile', file);
    
    if (user.role !== 'user') {
      submitData.append('patientId', formData.patientId);
    }

    try {
      await uploadRecord(submitData).unwrap();
      toast.success('Medical record uploaded successfully');
      navigate(`/dashboard/${user.role}/medical-records`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload record');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Upload Medical Record</h1>
          <p className="text-sm font-medium text-gray-500">Securely store and share health documents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* File Upload Zone */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Document File *</label>
            {!file ? (
              <label className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <FileUp size={28} className="text-indigo-500" />
                </div>
                <p className="font-bold text-gray-800 text-lg">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG or WEBP (max 10MB)</p>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="border border-gray-200 rounded-2xl p-4 flex items-center gap-4 bg-gray-50">
                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                  {preview === 'pdf' ? (
                    <FileText size={32} className="text-red-500" />
                  ) : (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs font-semibold text-gray-500 uppercase mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {user.role !== 'user' && (
                <div className="space-y-2 relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Patient Selection *</label>
                  
                  {selectedPatient ? (
                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                          {selectedPatient.profileImage?.url || selectedPatient.avatar?.url ? (
                            <img src={selectedPatient.profileImage?.url || selectedPatient.avatar?.url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            selectedPatient.name?.charAt(0) || 'P'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-950 text-sm">{selectedPatient.name}</p>
                          <p className="text-xs text-indigo-600 font-bold tracking-wider uppercase mt-0.5">ID: {selectedPatient.patientId || `PT-${selectedPatient._id?.substring(0, 6).toUpperCase()}`}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, patientId: '' }));
                          setPatientSearch('');
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove patient selection"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search patient by name or email..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            setShowSearchDropdown(true);
                          }}
                          onFocus={() => setShowSearchDropdown(true)}
                          onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      
                      {showSearchDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl max-h-56 overflow-y-auto divide-y divide-gray-50 p-1.5">
                          {filteredSelectable.length > 0 ? (
                            filteredSelectable.map(patient => (
                              <button
                                key={patient._id}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, patientId: patient._id }));
                                  setShowSearchDropdown(false);
                                }}
                                className="w-full flex items-center justify-between p-2.5 hover:bg-indigo-50/50 rounded-xl text-left transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    {patient.profileImage?.url || patient.avatar?.url ? (
                                      <img src={patient.profileImage?.url || patient.avatar?.url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      patient.name?.charAt(0) || 'P'
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-xs">{patient.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{patient.email}</p>
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs font-semibold text-gray-400">
                              No matching patients found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Record Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Complete Blood Count Report"
                  required
                  maxLength={200}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        formData.category === cat.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={formData.category === cat.id ? 'text-indigo-600' : 'text-gray-400'}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Visibility Control</label>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map(opt => (
                    <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.visibility === opt.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="visibility" 
                        value={opt.id} 
                        checked={formData.visibility === opt.id}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`flex items-center gap-2 text-sm font-bold ${formData.visibility === opt.id ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {opt.icon} {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Shield size={12} /> Doctors and Hospital staff always have clinical access.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Diagnosis (Optional)</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  placeholder="e.g. Hypertension"
                  maxLength={500}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tags (Optional)</label>
                <div className="p-1.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                  <div className="flex flex-wrap gap-2 mb-2 px-2 pt-2">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex px-2 pb-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                      placeholder="Add a tag and press Enter"
                      className="w-full bg-transparent text-sm font-medium focus:outline-none border-none"
                    />
                    <button type="button" onClick={handleAddTag} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs p-1">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Additional Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any extra information about this record..."
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:px-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline border-gray-200 text-gray-600 px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-600/20 px-8 flex items-center gap-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <><Upload size={18} /> Upload Document</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadMedicalRecord;
