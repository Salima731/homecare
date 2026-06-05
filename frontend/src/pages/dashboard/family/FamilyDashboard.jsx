import React, { useState } from 'react';
import { 
  Heart, Calendar, History, AlertCircle, Activity, 
  UserPlus, CheckCircle, Clock 
} from 'lucide-react';
import { 
  useGetFamilyDashboardStatsQuery, 
  useLinkPatientMutation 
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const FamilyDashboard = () => {
  const { data: stats, isLoading, refetch } = useGetFamilyDashboardStatsQuery();
  const [linkPatient, { isLoading: isLinking }] = useLinkPatientMutation();
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [error, setError] = useState(null);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await linkPatient({ code: accessCodeInput.toUpperCase().trim() }).unwrap();
      refetch();
    } catch (err) {
      setError(err?.data?.message || 'Failed to link patient. Ensure the access code is correct and not expired.');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!stats?.data?.patientLinked) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserPlus size={40} className="text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Link to a Patient</h2>
          <p className="text-gray-500 mb-8 font-medium">
            You are not currently linked to a patient. Please ask the patient or their care team to generate a Family Access Code from their profile and share it with you.
          </p>

          <form onSubmit={handleLinkPatient} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Family Access Code</label>
              <input
                type="text"
                required
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. CARE-8X4K92"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none uppercase font-mono tracking-wider"
              />
            </div>
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={isLinking}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70 shadow-lg shadow-primary-500/20 active:scale-[0.98] transform"
            >
              {isLinking ? 'Linking...' : 'Link Patient'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { recentHealthAlerts, pendingMedications, activeEmergencies, nextBooking } = stats.data;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Family Overview</h1>
        <p className="text-gray-500">Monitor your loved one's real-time care status.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Emergencies"
          value={activeEmergencies}
          icon={<AlertCircle size={24} />}
          color="red"
          alert={activeEmergencies > 0}
        />
        <StatCard
          title="Recent Health Alerts"
          value={recentHealthAlerts}
          icon={<Heart size={24} />}
          color="orange"
          alert={recentHealthAlerts > 0}
        />
        <StatCard
          title="Pending Meds Today"
          value={pendingMedications}
          icon={<Activity size={24} />}
          color="blue"
        />
        <StatCard
          title="Upcoming Visit"
          value={nextBooking ? 'Scheduled' : 'None'}
          icon={<Calendar size={24} />}
          color="green"
        />
      </div>

      {/* Next Booking Info */}
      {nextBooking && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Clock size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Upcoming Caregiver Visit</h3>
              <p className="text-gray-500">
                {new Date(nextBooking.startDate).toLocaleDateString()} at {nextBooking.startTime}
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <img 
              src={nextBooking.caregiver?.profileImage || 'https://via.placeholder.com/50'} 
              alt="Caregiver" 
              className="w-12 h-12 rounded-full border border-gray-200"
            />
            <div>
              <p className="font-bold">{nextBooking.caregiver?.name}</p>
              <p className="text-sm text-gray-500">Assigned Caregiver</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Setup Checklist */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-3xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">You're connected!</h2>
        <p className="opacity-90 mb-6 max-w-2xl">
          You are now receiving real-time alerts and updates for your linked patient. Use the sidebar to explore detailed health logs, medication schedules, and caregiver attendance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 flex items-center gap-3">
            <CheckCircle className="text-green-300" size={24} />
            <span className="font-semibold">Patient Linked</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 flex items-center gap-3">
            <CheckCircle className="text-green-300" size={24} />
            <span className="font-semibold">Real-time SOS Active</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 flex items-center gap-3">
            <CheckCircle className="text-green-300" size={24} />
            <span className="font-semibold">Health Tracking On</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, alert }) => {
  const colorMap = {
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
  };

  return (
    <div className={`rounded-2xl p-6 border ${colorMap[color]} ${alert ? 'animate-pulse ring-2 ring-red-400' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/60 rounded-xl shadow-sm backdrop-blur-sm">
          {icon}
        </div>
        {alert && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Requires Attention</span>}
      </div>
      <div>
        <p className="text-sm font-semibold opacity-80">{title}</p>
        <h3 className="text-3xl font-black mt-1">{value}</h3>
      </div>
    </div>
  );
};

export default FamilyDashboard;
