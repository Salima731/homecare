import React from 'react';
import { 
  useGetFamilyDashboardStatsQuery,
  useGetFamilyHealthLogsQuery,
  useGetFamilyHealthTrendsQuery
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { HeartPulse, AlertCircle, Activity, Thermometer, Droplet, Wind } from 'lucide-react';

const FamilyHealth = () => {
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: logsData, isLoading: logsLoading } = useGetFamilyHealthLogsQuery(patientId, { skip: !patientId });
  const { data: trendsData, isLoading: trendsLoading } = useGetFamilyHealthTrendsQuery(patientId, { skip: !patientId });

  if (statsLoading || logsLoading || trendsLoading) return <LoadingSpinner />;
  
  if (!patientId) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        <h2 className="text-xl font-bold mb-2">No Patient Linked</h2>
        <p>Please return to the Dashboard to link a patient.</p>
      </div>
    );
  }

  const logs = logsData?.data || [];
  const trends = trendsData?.data || {};

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Reports</h1>
        <p className="text-gray-500">Monitor vitals and detect abnormal trends.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <HeartPulse size={32} className="text-red-500 mb-2" />
          <p className="text-sm font-bold text-gray-500 uppercase">Avg Heart Rate</p>
          <p className="text-2xl font-black">{trends.trends?.heartRate?.length ? Math.round(trends.trends.heartRate.reduce((a,b)=>a+b.value,0)/trends.trends.heartRate.length) : '--'} <span className="text-sm">bpm</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <Wind size={32} className="text-blue-500 mb-2" />
          <p className="text-sm font-bold text-gray-500 uppercase">Avg Oxygen</p>
          <p className="text-2xl font-black">{trends.trends?.oxygenSaturation?.length ? Math.round(trends.trends.oxygenSaturation.reduce((a,b)=>a+b.value,0)/trends.trends.oxygenSaturation.length) : '--'} <span className="text-sm">%</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <Droplet size={32} className="text-blue-400 mb-2" />
          <p className="text-sm font-bold text-gray-500 uppercase">Avg Blood Sugar</p>
          <p className="text-2xl font-black">{trends.trends?.bloodSugar?.length ? Math.round(trends.trends.bloodSugar.reduce((a,b)=>a+b.value,0)/trends.trends.bloodSugar.length) : '--'} <span className="text-sm">mg/dL</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <AlertCircle size={32} className="text-orange-500 mb-2" />
          <p className="text-sm font-bold text-gray-500 uppercase">Abnormal Days</p>
          <p className="text-2xl font-black text-orange-600">{trends.abnormalDays || 0}</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Recent Health Logs</h2>
          <span className="px-3 py-1 bg-white text-gray-600 text-xs font-bold rounded-full border border-gray-200">
            Total Logs: {logs.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Date & Time</th>
                <th className="px-6 py-4 font-bold">Blood Pressure</th>
                <th className="px-6 py-4 font-bold">Heart Rate</th>
                <th className="px-6 py-4 font-bold">Oxygen</th>
                <th className="px-6 py-4 font-bold">Sugar</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{new Date(log.logDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(log.logDate).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {log.vitals?.bloodPressure?.systolic || log.vitals?.bloodPressure?.diastolic 
                      ? `${log.vitals.bloodPressure.systolic || '--'}/${log.vitals.bloodPressure.diastolic || '--'} mmHg` 
                      : '--'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {log.vitals?.heartRate?.value ? `${log.vitals.heartRate.value} bpm` : '--'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {log.vitals?.oxygenSaturation?.value ? `${log.vitals.oxygenSaturation.value}%` : '--'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    {log.vitals?.bloodSugar?.value ? `${log.vitals.bloodSugar.value} mg/dL` : '--'}
                  </td>
                  <td className="px-6 py-4">
                    {log.isAbnormal ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full inline-flex items-center gap-1">
                        <AlertCircle size={12} /> Abnormal
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full inline-flex items-center gap-1">
                        <Activity size={12} /> Normal
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium">
                    No health logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FamilyHealth;
