import React from 'react';
import { 
  useGetFamilyDashboardStatsQuery,
  useGetFamilyMedicationsQuery
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { Pill, CheckCircle, XCircle, Clock } from 'lucide-react';

const FamilyMedications = () => {
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: medsData, isLoading: medsLoading } = useGetFamilyMedicationsQuery(patientId, { skip: !patientId });

  if (statsLoading || medsLoading) return <LoadingSpinner />;
  
  if (!patientId) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        <h2 className="text-xl font-bold mb-2">No Patient Linked</h2>
        <p>Please return to the Dashboard to link a patient.</p>
      </div>
    );
  }

  const logs = medsData?.data || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'taken':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full inline-flex items-center gap-1"><CheckCircle size={12} /> Taken</span>;
      case 'missed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full inline-flex items-center gap-1"><XCircle size={12} /> Missed</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full inline-flex items-center gap-1"><Clock size={12} /> Pending</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medication Tracking</h1>
        <p className="text-gray-500">Monitor prescription compliance and scheduled medications.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Medication History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Medication</th>
                <th className="px-6 py-4 font-bold">Scheduled Time</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Confirmed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Pill size={20} />
                      </div>
                      <span className="font-bold text-gray-900">{log.medicationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{new Date(log.scheduledTime).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">{new Date(log.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-700">{log.confirmedBy?.name || 'Self/System'}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500 font-medium">
                    No medication logs found.
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

export default FamilyMedications;
