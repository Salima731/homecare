import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Download, Trash2, Edit, FileText,
  Activity, Pill, ImageIcon, Shield, Syringe, FolderOpen,
  Calendar, Clock, User, Stethoscope, AlertTriangle, Info,
  Monitor
} from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { 
  useGetRecordByIdQuery,
  useDeleteMedicalRecordMutation 
} from '../../../features/medicalRecords/medicalRecordApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CATEGORY_META = {
  'lab_report': { icon: <Activity size={20} />, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  'prescription': { icon: <Pill size={20} />, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  'scan_report': { icon: <ImageIcon size={20} />, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  'discharge_summary': { icon: <FileText size={20} />, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  'medical_certificate': { icon: <Shield size={20} />, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  'vaccination_record': { icon: <Syringe size={20} />, color: 'text-teal-500 bg-teal-50 border-teal-200' },
  'other': { icon: <FolderOpen size={20} />, color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

const MedicalRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const { data: response, isLoading, error } = useGetRecordByIdQuery(id);
  const [deleteRecord, { isLoading: isDeleting }] = useDeleteMedicalRecordMutation();

  const record = response?.data;

  if (isLoading) return <LoadingSpinner />;

  if (error || !record) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 text-center">
        <div className="bg-white rounded-3xl p-12 border border-red-100 shadow-sm">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Record Not Found</h2>
          <p className="text-gray-500 mt-2 mb-6">{error?.data?.message || "We couldn't load this medical record or you don't have access to it."}</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary px-6">Go Back</button>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[record.category] || CATEGORY_META['other'];
  const canModify = user.role === 'admin' || String(record.uploadedBy?._id) === String(user._id);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this record? It will be removed from all views.')) {
      try {
        await deleteRecord(id).unwrap();
        toast.success('Record deleted successfully');
        navigate(`/dashboard/${user.role}/medical-records`);
      } catch (err) {
        toast.error('Failed to delete record');
      }
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ── Header Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 p-2 px-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-bold text-gray-600 w-max"
        >
          <ChevronLeft size={16} /> Back to Records
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {record.reportFile?.url && (
            <a 
              href={record.reportFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-sm rounded-xl transition-colors border border-indigo-200 shadow-sm"
              download={record.reportFile.originalName || 'medical-record'}
            >
              <Download size={16} /> Download Document
            </a>
          )}
          {canModify && (
            <>
              {/* <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-xl transition-colors shadow-sm">
                <Edit size={16} /> Edit
              </button> */}
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm rounded-xl transition-colors border border-red-200 shadow-sm disabled:opacity-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Detail Panel ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${meta.color}`}>
                  {meta.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 leading-tight">{record.title}</h1>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-1">
                    {record.category.replace('_', ' ')} • {record.fileType?.toUpperCase()} • {(record.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Uploaded On</p>
                    <p className="text-sm font-bold text-gray-700">{new Date(record.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Uploaded By</p>
                    <p className="text-sm font-bold text-gray-700">{record.uploadedBy?.name} <span className="text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded ml-1 uppercase">{record.uploadedBy?.role}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {record.diagnosis && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><Activity size={14} /> Diagnosis</h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-gray-800 font-medium leading-relaxed">{record.diagnosis}</p>
                  </div>
                </div>
              )}

              {record.notes && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><Info size={14} /> Additional Notes</h3>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-amber-900 font-medium leading-relaxed">{record.notes}</p>
                  </div>
                </div>
              )}

              {record.tags?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {record.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Document Preview ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Monitor size={16} className="text-indigo-500" /> Document Preview</h3>
            </div>
            <div className="bg-gray-100 min-h-[500px] flex items-center justify-center p-4">
              {record.reportFile?.url ? (
                record.fileType === 'pdf' ? (
                  <iframe 
                    src={record.reportFile.url} 
                    className="w-full h-[600px] rounded-xl shadow-sm bg-white"
                    title="PDF Preview"
                  />
                ) : (
                  <img 
                    src={record.reportFile.url} 
                    alt="Document preview" 
                    className="max-w-full rounded-xl shadow-sm bg-white border border-gray-200 max-h-[800px] object-contain"
                  />
                )
              ) : (
                <div className="text-center text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No preview available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-6">
          {/* Patient Info Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-50 pb-2">Patient Profile</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden shrink-0">
                {record.patient?.profileImage?.url ? (
                  <img src={record.patient.profileImage.url} alt="Patient" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-black text-lg">
                    {record.patient?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-black text-gray-900">{record.patient?.name}</p>
                <p className="text-xs font-bold text-gray-500">{record.patient?.email}</p>
              </div>
            </div>
          </div>

          {/* Context Card */}
          {(record.doctor || record.hospital) && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-50 pb-2">Medical Context</h3>
              <div className="space-y-4">
                {record.doctor && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Prescribing/Attending Doctor</p>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                      <Stethoscope size={14} className="text-indigo-500" /> Dr. {record.doctor.name}
                    </p>
                    <p className="text-xs text-gray-500 ml-5">{record.doctor.specialization}</p>
                  </div>
                )}
                {record.hospital && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Hospital</p>
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                      <Activity size={14} className="text-indigo-500" /> {record.hospital.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {user.role !== 'family' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <button 
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                onClick={() => setShowAuditLog(!showAuditLog)}
              >
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Shield size={16} className="text-indigo-500" /> Audit Log</h3>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{record.auditLog?.length || 0} events</span>
              </button>
              
              {showAuditLog && (
                <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                  {record.auditLog?.slice().reverse().map((log, i) => (
                    <div key={i} className="p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          log.action === 'uploaded' ? 'bg-green-100 text-green-700' :
                          log.action === 'viewed' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'updated' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        By user ID: <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1 rounded">{log.performedBy}</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Role: {log.performedByRole} {log.ip ? `• IP: ${log.ip}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordDetail;
