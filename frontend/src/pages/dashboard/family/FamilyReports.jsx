import React, { useState } from 'react';
import {
  ClipboardList, Calendar, Activity, AlertCircle, CheckCircle2,
  ChevronRight, ImageIcon, HeartPulse, Wind, Thermometer, Droplet,
  RefreshCw, User, Filter, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import {
  useGetFamilyDashboardStatsQuery,
  useGetLinkedPatientQuery,
} from '../../../features/families/familyApiSlice';
import { useGetReportsByPatientQuery } from '../../../features/careReports/careReportApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CONDITION_META = {
  stable:    { label: 'Stable',    color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Minus size={12} /> },
  improving: { label: 'Improving', color: 'bg-green-100 text-green-700 border-green-200', icon: <TrendingUp size={12} /> },
  declining: { label: 'Declining', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <TrendingDown size={12} /> },
  critical:  { label: 'Critical',  color: 'bg-red-100 text-red-700 border-red-200',      icon: <AlertCircle size={12} /> },
};

const ConditionBadge = ({ condition }) => {
  const meta = CONDITION_META[condition] || CONDITION_META.stable;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
};

const VitalChip = ({ icon, label, value }) =>
  value ? (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600 font-medium">
      {icon} {label}: <strong>{value}</strong>
    </span>
  ) : null;

// ── Main Component ─────────────────────────────────────────────────────────────
const FamilyReports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [condition, setCondition] = useState('');
  const [expanded, setExpanded] = useState(null);

  // Get patientId from dashboard stats
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: patientData } = useGetLinkedPatientQuery(undefined, { skip: !patientId });
  const patient = patientData?.data;

  const {
    data: reportsData,
    isLoading: reportsLoading,
    isFetching,
    refetch,
  } = useGetReportsByPatientQuery(
    {
      patientId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(condition && { condition }),
      limit: 20,
    },
    { skip: !patientId }
  );

  const reports = reportsData?.data || [];
  const pagination = reportsData?.pagination || {};

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCondition('');
  };

  if (statsLoading) return <LoadingSpinner />;

  if (!patientId) {
    return (
      <div className="p-6 text-center mt-20">
        <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">No Patient Linked</h2>
        <p className="text-gray-500">Please link a patient from the Dashboard to view care reports.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ClipboardList size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Care Reports</h1>
            {patient && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <User size={12} /> {patient.name}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(CONDITION_META).map(([key, meta]) => {
          const count = reports.filter((r) => r.patientCondition === key).length;
          return (
            <div key={key} className={`rounded-2xl p-4 border text-center ${meta.color.replace('text-', 'bg-').split('bg-')[0]}bg-white border-gray-100 shadow-sm`}>
              <p className={`text-2xl font-black`}>{count}</p>
              <p className="text-xs font-bold text-gray-500 uppercase mt-0.5">{meta.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-violet-500" />
          <span className="text-sm font-bold text-gray-700">Filters</span>
          {(startDate || endDate || condition) && (
            <button onClick={clearFilters} className="ml-auto text-xs text-red-500 font-semibold hover:underline">
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">From Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || new Date().toISOString().slice(0, 10)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">To Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">All Conditions</option>
              {Object.entries(CONDITION_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Report Timeline ── */}
      {reportsLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <ClipboardList size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-500">No care reports found</p>
          <p className="text-sm text-gray-400 mt-1">
            {(startDate || endDate || condition) ? 'Try adjusting your filters.' : "Your caregiver hasn't submitted any reports yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Showing {reports.length} of {pagination.total || reports.length} reports
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-violet-200 via-purple-100 to-transparent hidden md:block" />

            <div className="space-y-4">
              {reports.map((report) => {
                const isOpen = expanded === report._id;
                return (
                  <div key={report._id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="hidden md:flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 ${
                        report.patientCondition === 'critical' ? 'bg-red-100 border-red-300' :
                        report.patientCondition === 'declining' ? 'bg-orange-100 border-orange-300' :
                        report.patientCondition === 'improving' ? 'bg-green-100 border-green-300' :
                        'bg-blue-100 border-blue-300'
                      }`}>
                        <ClipboardList size={16} className={
                          report.patientCondition === 'critical' ? 'text-red-600' :
                          report.patientCondition === 'declining' ? 'text-orange-600' :
                          report.patientCondition === 'improving' ? 'text-green-600' : 'text-blue-600'
                        } />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {/* Card Header */}
                      <button
                        className="w-full text-left p-4 flex items-center justify-between gap-3"
                        onClick={() => setExpanded(isOpen ? null : report._id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {new Date(report.reportDate).toLocaleDateString('en-IN', {
                                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-400">
                              By {report.caregiver?.name || 'Caregiver'} ·{' '}
                              {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ConditionBadge condition={report.patientCondition} />
                          {report.attachments?.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <ImageIcon size={12} /> {report.attachments.length}
                            </span>
                          )}
                          <ChevronRight
                            size={16}
                            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </button>

                      {/* Expanded Body */}
                      {isOpen && (
                        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-4">
                          {/* Activities */}
                          {report.activitiesPerformed?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Activities Performed</p>
                              <div className="flex flex-wrap gap-2">
                                {report.activitiesPerformed.map((act, i) => (
                                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 border border-violet-100 rounded-full text-xs font-semibold text-violet-700">
                                    <CheckCircle2 size={10} /> {act}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Vitals */}
                          {report.vitals && Object.keys(report.vitals).length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                                <Activity size={11} className="inline mr-1" />Vitals
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <VitalChip
                                  icon={<HeartPulse size={11} className="text-red-400" />}
                                  label="HR"
                                  value={report.vitals.heartRate?.value ? `${report.vitals.heartRate.value} bpm` : null}
                                />
                                <VitalChip
                                  icon={<Wind size={11} className="text-blue-400" />}
                                  label="SpO₂"
                                  value={report.vitals.oxygenSaturation?.value ? `${report.vitals.oxygenSaturation.value}%` : null}
                                />
                                <VitalChip
                                  icon={<Thermometer size={11} className="text-orange-400" />}
                                  label="Temp"
                                  value={report.vitals.temperature?.value ? `${report.vitals.temperature.value}°C` : null}
                                />
                                <VitalChip
                                  icon={<Droplet size={11} className="text-indigo-400" />}
                                  label="Sugar"
                                  value={report.vitals.bloodSugar?.value ? `${report.vitals.bloodSugar.value} mg/dL` : null}
                                />
                                <VitalChip
                                  icon={<Activity size={11} className="text-green-400" />}
                                  label="BP"
                                  value={report.vitals.bloodPressure?.systolic
                                    ? `${report.vitals.bloodPressure.systolic}/${report.vitals.bloodPressure.diastolic} mmHg`
                                    : null}
                                />
                              </div>
                            </div>
                          )}

                          {/* Remarks */}
                          {report.remarks && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Remarks</p>
                              <p className="text-sm text-gray-600 italic bg-gray-50 rounded-xl px-3 py-2">
                                "{report.remarks}"
                              </p>
                            </div>
                          )}

                          {/* Attachments */}
                          {report.attachments?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                                <ImageIcon size={11} className="inline mr-1" />Attachments
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {report.attachments.map((att, i) => (
                                  <a
                                    key={i}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.name || `attachment-${i + 1}`}
                                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyReports;
