import React from 'react';
import { 
  useGetFamilyDashboardStatsQuery,
  useGetFamilyBookingsQuery
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { Calendar, User, Building, Clock } from 'lucide-react';

const FamilyBookings = () => {
  const { data: stats, isLoading: statsLoading } = useGetFamilyDashboardStatsQuery();
  const patientId = stats?.data?.patientId;

  const { data: bookingsData, isLoading: bookingsLoading } = useGetFamilyBookingsQuery(patientId, { skip: !patientId });

  if (statsLoading || bookingsLoading) return <LoadingSpinner />;
  
  if (!patientId) {
    return (
      <div className="p-6 text-center text-gray-500 mt-20">
        <h2 className="text-xl font-bold mb-2">No Patient Linked</h2>
        <p>Please return to the Dashboard to link a patient.</p>
      </div>
    );
  }

  const bookings = bookingsData?.data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Home Care Bookings</h1>
        <p className="text-gray-500">Monitor ongoing and past care bookings for your loved one.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.length > 0 ? bookings.map((booking) => (
          <div key={booking._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">{booking.serviceType} Care</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={14} /> 
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                  booking.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                  booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'accepted' ? 'bg-primary-100 text-primary-700' :
                  booking.status === 'assigned' ? 'bg-indigo-100 text-indigo-700' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {booking.status}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                    <Building size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Agency</p>
                    <p className="font-bold text-gray-900">{booking.agency?.agencyName || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Assigned Caregiver</p>
                    <p className="font-bold text-gray-900">{booking.caregiver?.name || 'Pending Assignment'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Schedule</p>
                    <p className="font-bold text-gray-900">{booking.startTime} to {booking.endTime}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Duration: {booking.totalDays} days</span>
              <span className="text-sm font-bold text-gray-500 capitalize">Type: {booking.durationType}</span>
            </div>
          </div>
        )) : (
          <div className="col-span-1 md:col-span-2 p-10 text-center bg-white rounded-3xl border border-gray-100 text-gray-500 font-medium">
            No bookings found for this patient.
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyBookings;
