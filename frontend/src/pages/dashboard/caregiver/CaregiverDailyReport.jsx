import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ClipboardList, PlusCircle, Upload, X, ChevronDown,
  Calendar, Activity, AlertCircle, CheckCircle2, ImageIcon,
  Thermometer, Droplet, Wind, HeartPulse, RefreshCw
} from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import {
  useCreateCareReportMutation,
  useGetReportsByBookingQuery,
} from '../../../features/careReports/careReportApiSlice';
import { useGetCaregiverBookingsQuery } from '../../../features/bookings/bookingApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// ── Constants ─────────────────────────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  'Bathing & Personal Hygiene',
  'Medication Administered',
  'Wound Care / Dressing',
  'Physical Therapy / Exercises',
  'Meal Preparation & Feeding',
  'Mobility Assistance',
  'Vital Signs Monitoring',
  'Companionship & Mental Stimulation',
  'Housekeeping',
  'Doctor Visit Accompanied',
  'Emergency Response',
  'Sleep Monitoring',
];

const CONDITION_OPTIONS = [
  { value: 'stable', label: 'Stable', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'improving', label: 'Improving', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'declining', label: 'Declining', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
];

const conditionBadge = (condition) => {
  const opt = CONDITION_OPTIONS.find((o) => o.value === condition);
  return opt ? opt.color : 'bg-gray-100 text-gray-600';
};

// ── Main Component ─────────────────────────────────────────────────────────────
const CaregiverDailyReport = () => {
  const user = useSelector(selectCurrentUser);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [selectedBooking, setSelectedBooking] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [condition, setCondition] = useState('stable');
  const [activities, setActivities] = useState([]);
  const [customActivity, setCustomActivity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [vitals, setVitals] = useState({
    heartRate: '',
    oxygenSaturation: '',
    temperature: '',
    bpSystolic: '',
    bpDiastolic: '',
    bloodSugar: '',
  });
  const [attachments, setAttachments] = useState([]);   // File objects
  const [previews, setPreviews] = useState([]);          // Data URLs
  const [showVitals, setShowVitals] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');

  // ── API ─────────────────────────────────────────────────────────────────────
  // Only fetch bookings that are eligible for care reports (assigned, ongoing, completed)
  const { data: jobsData, isLoading: jobsLoading } = useGetCaregiverBookingsQuery();
  const [createReport, { isLoading: submitting }] = useCreateCareReportMutation();

  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetReportsByBookingQuery(
    { bookingId: selectedBooking, condition: historyFilter || undefined },
    { skip: !selectedBooking }
  );

  const REPORT_ELIGIBLE_STATUSES = ['assigned', 'ongoing', 'completed'];
  const allJobs = jobsData?.data || jobsData?.jobs || [];
  const jobs = allJobs.filter((j) => REPORT_ELIGIBLE_STATUSES.includes(j.status));
  const reports = historyData?.data || [];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBookingChange = (e) => {
    const bookingId = e.target.value;
    setSelectedBooking(bookingId);
    const job = jobs.find((j) => j._id === bookingId);
    // job.user may be a populated object { _id, name, ... } or a raw ObjectId string
    const patientId =
      (typeof job?.user === 'object' && job?.user !== null)
        ? job.user._id
        : job?.user;
    setSelectedPatientId(patientId || '');
  };

  const toggleActivity = (act) => {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const addCustomActivity = () => {
    const trimmed = customActivity.trim();
    if (trimmed && !activities.includes(trimmed)) {
      setActivities((prev) => [...prev, trimmed]);
    }
    setCustomActivity('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 attachments allowed');
      return;
    }
    setAttachments((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVitalsChange = (key, value) =>
    setVitals((prev) => ({ ...prev, [key]: value }));

  const buildVitalsPayload = () => {
    const v = {};
    if (vitals.bpSystolic || vitals.bpDiastolic)
      v.bloodPressure = {
        systolic: Number(vitals.bpSystolic) || undefined,
        diastolic: Number(vitals.bpDiastolic) || undefined,
      };
    if (vitals.heartRate) v.heartRate = { value: Number(vitals.heartRate) };
    if (vitals.oxygenSaturation) v.oxygenSaturation = { value: Number(vitals.oxygenSaturation) };
    if (vitals.temperature) v.temperature = { value: Number(vitals.temperature) };
    if (vitals.bloodSugar) v.bloodSugar = { value: Number(vitals.bloodSugar) };
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return toast.error('Please select a booking');
    if (!selectedPatientId) return toast.error('Could not resolve patient');
    if (activities.length === 0) return toast.error('Add at least one activity');

    const formData = new FormData();
    formData.append('bookingId', selectedBooking);
    formData.append('patientId', selectedPatientId);
    formData.append('patientCondition', condition);
    formData.append('activitiesPerformed', JSON.stringify(activities));
    formData.append('vitals', JSON.stringify(buildVitalsPayload()));
    formData.append('remarks', remarks);
    formData.append('reportDate', reportDate);
    attachments.forEach((file) => formData.append('attachments', file));

    try {
      await createReport(formData).unwrap();
      toast.success('Care report submitted!');
      // Reset form
      setActivities([]);
      setRemarks('');
      setVitals({ heartRate: '', oxygenSaturation: '', temperature: '', bpSystolic: '', bpDiastolic: '', bloodSugar: '' });
      setAttachments([]);
      setPreviews([]);
      refetchHistory();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit report');
    }
  };

  if (jobsLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
          <ClipboardList size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Daily Care Report</h1>
          <p className="text-sm text-gray-500">Document your shift and patient condition</p>
        </div>
      </div>

      {/* ── Submit Form ── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
          <h2 className="text-base font-bold text-gray-800">New Report</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select Booking *</label>
              <div className="relative">
                <select
                  id="booking-select"
                  value={selectedBooking}
                  onChange={handleBookingChange}
                  required
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                >
                  <option value="">-- Select active booking --</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.serviceType?.replace('_', ' ')} — {new Date(job.startDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {jobs.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">No active/assigned bookings found.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Report Date *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  id="report-date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Patient Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Patient Condition *</label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCondition(opt.value)}
                  className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                    condition === opt.value
                      ? opt.color + ' scale-105 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Activities Performed *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {ACTIVITY_OPTIONS.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleActivity(act)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    activities.includes(act)
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${
                    activities.includes(act) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                  }`}>
                    {activities.includes(act) && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  {act}
                </button>
              ))}
            </div>
            {/* Custom activity */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomActivity())}
                placeholder="Add custom activity..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={addCustomActivity}
                className="px-4 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-bold hover:bg-teal-600 transition-colors flex items-center gap-1"
              >
                <PlusCircle size={15} /> Add
              </button>
            </div>
            {/* Custom activities tags */}
            {activities.filter((a) => !ACTIVITY_OPTIONS.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {activities.filter((a) => !ACTIVITY_OPTIONS.includes(a)).map((a) => (
                  <span key={a} className="flex items-center gap-1 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-semibold text-cyan-700">
                    {a}
                    <button type="button" onClick={() => toggleActivity(a)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Vitals (collapsible) */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVitals(!showVitals)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Activity size={16} className="text-teal-500" />
                Vitals (Optional)
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showVitals ? 'rotate-180' : ''}`} />
            </button>

            {showVitals && (
              <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: <HeartPulse size={14} className="text-red-400" />, label: 'Heart Rate (bpm)', key: 'heartRate', placeholder: 'e.g. 72' },
                  { icon: <Wind size={14} className="text-blue-400" />, label: 'SpO₂ (%)', key: 'oxygenSaturation', placeholder: 'e.g. 98' },
                  { icon: <Thermometer size={14} className="text-orange-400" />, label: 'Temperature (°C)', key: 'temperature', placeholder: 'e.g. 37.2' },
                  { icon: <Droplet size={14} className="text-indigo-400" />, label: 'Blood Sugar (mg/dL)', key: 'bloodSugar', placeholder: 'e.g. 110' },
                  { icon: <Activity size={14} className="text-green-400" />, label: 'BP Systolic', key: 'bpSystolic', placeholder: 'e.g. 120' },
                  { icon: <Activity size={14} className="text-green-400" />, label: 'BP Diastolic', key: 'bpDiastolic', placeholder: 'e.g. 80' },
                ].map(({ icon, label, key, placeholder }) => (
                  <div key={key}>
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 mb-1.5 uppercase">
                      {icon} {label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitals[key]}
                      onChange={(e) => handleVitalsChange(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Remarks / Notes</label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Any additional observations, concerns, or notes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <p className="text-xs text-gray-400 text-right">{remarks.length}/1000</p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Attachments (max 5 images)</label>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                  <img src={src} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {attachments.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Upload</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><RefreshCw size={16} className="animate-spin" /> Submitting…</>
            ) : (
              <><ClipboardList size={16} /> Submit Report</>
            )}
          </button>
        </div>
      </form>

      {/* ── Report History ── */}
      {selectedBooking && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h2 className="text-base font-bold text-gray-800">Report History for this Booking</h2>
            <div className="flex items-center gap-2">
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
              >
                <option value="">All Conditions</option>
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button onClick={refetchHistory} className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">
                <RefreshCw size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner /></div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reports submitted yet for this booking</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((report) => (
                <div key={report._id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {new Date(report.reportDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">Submitted: {new Date(report.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${conditionBadge(report.patientCondition)}`}>
                      {report.patientCondition?.charAt(0).toUpperCase() + report.patientCondition?.slice(1)}
                    </span>
                  </div>

                  {/* Activities */}
                  {report.activitiesPerformed?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {report.activitiesPerformed.map((act, i) => (
                        <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full border border-teal-100 font-medium">
                          {act}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Vitals mini-grid */}
                  {report.vitals && Object.keys(report.vitals).length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
                      {report.vitals.heartRate?.value && (
                        <span className="flex items-center gap-1"><HeartPulse size={12} className="text-red-400" />{report.vitals.heartRate.value} bpm</span>
                      )}
                      {report.vitals.oxygenSaturation?.value && (
                        <span className="flex items-center gap-1"><Wind size={12} className="text-blue-400" />{report.vitals.oxygenSaturation.value}%</span>
                      )}
                      {report.vitals.temperature?.value && (
                        <span className="flex items-center gap-1"><Thermometer size={12} className="text-orange-400" />{report.vitals.temperature.value}°C</span>
                      )}
                      {report.vitals.bloodPressure?.systolic && (
                        <span className="flex items-center gap-1"><Activity size={12} className="text-green-400" />{report.vitals.bloodPressure.systolic}/{report.vitals.bloodPressure.diastolic} mmHg</span>
                      )}
                    </div>
                  )}

                  {/* Remarks */}
                  {report.remarks && (
                    <p className="text-xs text-gray-500 italic mb-3">"{report.remarks}"</p>
                  )}

                  {/* Attachments */}
                  {report.attachments?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {report.attachments.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                          <img src={att.url} alt={att.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100 hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaregiverDailyReport;
