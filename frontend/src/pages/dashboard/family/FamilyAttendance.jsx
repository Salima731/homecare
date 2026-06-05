import React from 'react';
import { 
  useGetFamilyDashboardStatsQuery,
  useGetFamilyAttendanceQuery
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

const FamilyAttendance = () => {
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: attendanceData, isLoading: attendanceLoading } = useGetFamilyAttendanceQuery(patientId, { skip: !patientId });

  if (statsLoading || attendanceLoading) return <LoadingSpinner />;
  
  if (!patientId) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        <h2 className="text-xl font-bold mb-2">No Patient Linked</h2>
        <p>Please return to the Dashboard to link a patient.</p>
      </div>
    );
  }

  const logs = attendanceData?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-500">Monitor caregiver check-ins, check-outs, and hours worked.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Attendance Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Caregiver</th>
                <th className="px-6 py-4 font-bold">Check-In</th>
                <th className="px-6 py-4 font-bold">Check-Out</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img 
                      src={log.caregiver?.profileImage || 'https://via.placeholder.com/40'} 
                      alt="Caregiver" 
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                    <span className="font-bold text-gray-900">{log.caregiver?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {log.checkIn?.time ? (
                      <div>
                        <p className="font-bold text-gray-900">{new Date(log.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={10} /> {log.checkIn.location?.address || 'GPS Logged'}
                        </p>
                      </div>
                    ) : <span className="text-gray-400">--</span>}
                  </td>
                  <td className="px-6 py-4">
                    {log.checkOut?.time ? (
                      <div>
                        <p className="font-bold text-gray-900">{new Date(log.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ) : <span className="text-gray-400">Pending</span>}
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'present' ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full inline-flex items-center gap-1"><CheckCircle size={12} /> On Time</span>
                    ) : log.status === 'late' ? (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full inline-flex items-center gap-1"><Clock size={12} /> Late ({log.lateByMinutes}m)</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full inline-flex items-center gap-1"><XCircle size={12} /> {log.status}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {log.workedHours ? `${log.workedHours}h` : '--'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium">
                    No attendance records found.
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

export default FamilyAttendance;
