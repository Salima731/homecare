import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FolderOpen, Plus, Search, Filter, Calendar, FileText,
  Activity, Image as ImageIcon, Pill, Stethoscope, Syringe,
  Download, Eye, Grid, List, AlertCircle, RefreshCw, X, Shield, Lock, Users,
  ChevronRight, User
} from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import {
  useGetPatientRecordsQuery,
  useGetAllRecordsQuery,
} from '../../../features/medicalRecords/medicalRecordApiSlice';
import { useGetFamilyDashboardStatsQuery } from '../../../features/families/familyApiSlice';
import { useGetHospitalPatientsQuery, useGetPatientByIdQuery } from '../../../features/hospitals/hospitalApiSlice';
import { useGetMyPatientsQuery } from '../../../features/doctors/doctorApiSlice';
import { useGetCaregiverBookingsQuery } from '../../../features/bookings/bookingApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CATEGORY_META = {
  'lab_report': { icon: <Activity size={16} />, color: 'text-blue-500 bg-blue-50', label: 'Lab Report' },
  'prescription': { icon: <Pill size={16} />, color: 'text-emerald-500 bg-emerald-50', label: 'Prescription' },
  'scan_report': { icon: <ImageIcon size={16} />, color: 'text-purple-500 bg-purple-50', label: 'Scan Report' },
  'discharge_summary': { icon: <FileText size={16} />, color: 'text-amber-500 bg-amber-50', label: 'Discharge Summary' },
  'medical_certificate': { icon: <Shield size={16} />, color: 'text-indigo-500 bg-indigo-50', label: 'Certificate' },
  'vaccination_record': { icon: <Syringe size={16} />, color: 'text-teal-500 bg-teal-50', label: 'Vaccination' },
  'other': { icon: <FolderOpen size={16} />, color: 'text-gray-500 bg-gray-50', label: 'Other' },
};

const VISIBILITY_META = {
  'private': { icon: <Lock size={12} />, label: 'Private' },
  'caregiver': { icon: <Stethoscope size={12} />, label: 'Caregiver' },
  'family': { icon: <Users size={12} />, label: 'Family' },
};

const MedicalRecordsDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
  });

  // Role-based patient resolution
  const isAdmin = user?.role === 'admin';
  const isFamily = user?.role === 'family';
  
  // For family, we need to fetch the linked patient ID
  const { data: familyStats, isLoading: familyStatsLoading } = useGetFamilyDashboardStatsQuery(undefined, {
    skip: !isFamily
  });
  
  // For patient, it's themselves. For doctor/hospital/caregiver, they need to enter a patient ID or we fetch for a selected patient.
  // Since this is a general dashboard, if they are doctor/hospital and haven't selected a patient, we might need a search. 
  // But for now, let's assume they access this via a patient profile link, OR we just show a prompt to enter a patient ID.
  const location = useLocation();
  const queryPatientId = new URLSearchParams(location.search).get('patientId') || location.state?.patientId;
  const [targetPatientId, setTargetPatientId] = useState(queryPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    if (queryPatientId) {
      setTargetPatientId(queryPatientId);
    } else if (user?.role === 'user') {
      setTargetPatientId(user._id);
    } else if (isFamily && familyStats?.data?.patientId) {
      setTargetPatientId(familyStats.data.patientId);
    }
  }, [user, isFamily, familyStats, queryPatientId]);

  // Fetch patient details if targetPatientId is set and we're not admin/patient/family
  const isClinicalStaff = !isAdmin && !['user', 'family'].includes(user?.role);
  const { data: selectedPatientRes } = useGetPatientByIdQuery(targetPatientId, {
    skip: !isClinicalStaff || !targetPatientId
  });
  const selectedPatient = selectedPatientRes?.data || selectedPatientRes;

  // Search/Select Queries for Clinical Staff
  const { data: hospitalPatientsResponse } = useGetHospitalPatientsQuery(undefined, {
    skip: user?.role !== 'hospital' || !!targetPatientId
  });
  const { data: doctorPatientsResponse } = useGetMyPatientsQuery(undefined, {
    skip: user?.role !== 'doctor' || !!targetPatientId
  });
  const { data: caregiverJobsResponse } = useGetCaregiverBookingsQuery(undefined, {
    skip: user?.role !== 'caregiver' || !!targetPatientId
  });

  const getSelectablePatients = () => {
    if (user?.role === 'hospital') {
      return hospitalPatientsResponse?.data || [];
    }
    if (user?.role === 'doctor') {
      return doctorPatientsResponse?.data || [];
    }
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
    p.email?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone?.includes(patientSearch)
  );

  // Queries
  const {
    data: allRecordsData,
    isLoading: allRecordsLoading,
    isFetching: allFetching,
    refetch: refetchAll
  } = useGetAllRecordsQuery(
    { ...filters, search: searchTerm },
    { skip: !isAdmin }
  );

  const {
    data: patientRecordsData,
    isLoading: patientRecordsLoading,
    isFetching: patientFetching,
    refetch: refetchPatient
  } = useGetPatientRecordsQuery(
    { patientId: targetPatientId, ...filters, search: searchTerm },
    { skip: isAdmin || !targetPatientId }
  );

  const handleClearFilters = () => {
    setFilters({ category: '', startDate: '', endDate: '' });
    setSearchTerm('');
  };

  const isLoading = (isFamily && familyStatsLoading) || allRecordsLoading || patientRecordsLoading;
  const isFetching = allFetching || patientFetching;
  
  const records = isAdmin ? (allRecordsData?.data || []) : (patientRecordsData?.data || []);
  
  // Permission checks
  const canUpload = ['user', 'doctor', 'hospital', 'admin'].includes(user?.role);

  if (isLoading) return <LoadingSpinner />;

  // Prompt for doctor/hospital/caregiver to select a patient if accessed directly
  if (!isAdmin && !['user', 'family'].includes(user?.role) && !targetPatientId) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-indigo-500 mb-4" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Access Patient Medical Records</h2>
          <p className="text-gray-500 mt-2 mb-8 max-w-lg mx-auto text-sm">
            Select a patient from your dashboard to view, upload, and manage their secure clinical health files.
          </p>
          
          <div className="max-w-md mx-auto mb-8 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search patients by name, email or phone..." 
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
            />
          </div>

          <div className="max-w-xl mx-auto max-h-[350px] overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl shadow-inner bg-gray-50/50 p-2">
            {filteredSelectable.length > 0 ? (
              filteredSelectable.map(patient => (
                <button
                  key={patient._id}
                  onClick={() => setTargetPatientId(patient._id)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-white rounded-xl transition-all hover:shadow-sm text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {patient.profileImage?.url || patient.avatar?.url ? (
                        <img src={patient.profileImage?.url || patient.avatar?.url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        patient.name?.charAt(0) || 'P'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{patient.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{patient.email || 'No email'}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No patients found</p>
              </div>
            )}
          </div>

          {canUpload && (
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-center items-center gap-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or upload directly:</span>
              <button 
                onClick={() => navigate(`/dashboard/${user.role}/medical-records/upload`)}
                className="btn btn-outline border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
              >
                <Plus size={16} /> Upload New Record
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg text-white">
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Medical Records</h1>
            {isClinicalStaff && selectedPatient ? (
              <p className="text-sm font-medium text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
                <span>Patient: <strong className="text-indigo-600 font-extrabold">{selectedPatient.name}</strong></span>
                <button 
                  onClick={() => setTargetPatientId('')} 
                  className="text-[10px] text-red-600 hover:text-red-700 font-black uppercase tracking-widest border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition-colors ml-2"
                >
                  Change Patient
                </button>
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-500">
                {isAdmin ? 'System-wide records repository' : 'Manage and view health documents safely'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => isAdmin ? refetchAll() : refetchPatient()}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          
          <div className="bg-white border border-gray-200 rounded-xl flex p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid size={18} />
            </button>
          </div>

          {canUpload && (
            <button 
              onClick={() => navigate(`/dashboard/${user.role}/medical-records/upload`)}
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-600/20 flex items-center gap-2 px-5 py-2.5"
            >
              <Plus size={18} /> Upload Record
            </button>
          )}
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search records by title, diagnosis, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          <select 
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[140px]"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          {(searchTerm || filters.category || filters.startDate || filters.endDate) && (
            <button 
              onClick={handleClearFilters}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Clear filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      {records.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderOpen size={40} className="text-indigo-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {(searchTerm || filters.category || filters.startDate || filters.endDate) 
              ? "We couldn't find any medical records matching your search criteria." 
              : "There are no medical records available for this patient yet."}
          </p>
          {canUpload && !searchTerm && !filters.category && (
            <button 
              onClick={() => navigate(`/dashboard/${user.role}/medical-records/upload`)}
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-600/20"
            >
              Upload First Record
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {records.map((record) => {
            const meta = CATEGORY_META[record.category] || CATEGORY_META['other'];
            const visMeta = VISIBILITY_META[record.visibility];
            
            return (
              <div 
                key={record._id} 
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}
              >
                {/* Left/Top Section: Icon & Category */}
                <div className={`${viewMode === 'list' ? 'w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-gray-100 p-5' : 'border-b border-gray-100 p-5'} bg-gray-50/50 flex flex-col justify-center`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                    {new Date(record.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-gray-900 text-sm">{meta.label}</p>
                </div>

                {/* Main Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-2">{record.title}</h3>
                      {record.fileType === 'pdf' ? (
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded border border-red-100">PDF</span>
                      ) : record.fileType ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100">IMG</span>
                      ) : null}
                    </div>

                    {isAdmin && (
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                        <Users size={12} /> Patient: <span className="font-semibold text-gray-700">{record.patient?.name}</span>
                      </p>
                    )}

                    {record.diagnosis && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        <span className="font-semibold text-gray-900">Diagnosis:</span> {record.diagnosis}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {record.doctor && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          <Stethoscope size={10} /> {record.doctor.name}
                        </span>
                      )}
                      {record.hospital && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          <Activity size={10} /> {record.hospital.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                        {visMeta?.icon} {visMeta?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.reportFile?.url && (
                        <a 
                          href={record.reportFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                      )}
                      <button 
                        onClick={() => navigate(`/dashboard/${user.role}/medical-records/${record._id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsDashboard;
