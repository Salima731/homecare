import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Activity, AlertCircle, Shield, Heart } from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { 
  useGetHospitalProfileQuery, 
  useGetHospitalReferralsQuery,
  useGetHospitalAnalyticsQuery
} from '../../../features/hospitals/hospitalApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const HospitalDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: profileResponse, isLoading: profileLoading } = useGetHospitalProfileQuery();
  const { data: referralsResponse, isLoading: referralsLoading } = useGetHospitalReferralsQuery();
  const { data: analyticsResponse, isLoading: analyticsLoading } = useGetHospitalAnalyticsQuery();
  
  const profile = profileResponse?.data;
  const referrals = referralsResponse?.data?.referrals || [];
  const analytics = analyticsResponse?.data?.overview || {};

  if (profileLoading || referralsLoading || analyticsLoading) return <LoadingSpinner />;

  const stats = [
    { label: 'Total Referrals', value: analytics.totalReferrals || 0, icon: <Calendar size={24} />, color: 'bg-blue-600/20 text-blue-500' },
    { label: 'Active Home Care', value: analytics.activeEmergencies || 0, icon: <Heart size={24} />, color: 'bg-green-600/20 text-green-500' },
    { label: 'Total Doctors', value: analytics.totalDoctors || 0, icon: <Users size={24} />, color: 'bg-purple-600/20 text-purple-500' },
    { label: 'Total Patients', value: analytics.totalPatients || 0, icon: <Activity size={24} />, color: 'bg-indigo-600/20 text-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{profile?.hospitalName || user?.name} Dashboard</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage hospital operations and patient home care transitions.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/hospital/referrals" className="btn btn-primary text-center flex items-center justify-center shadow-lg">
            New Referral
          </Link>
        </div>
      </div>

      {/* Verification Alert */}
      {!profile?.isVerified && (
        <div className="bg-amber-600/10 border-l-4 border-amber-500 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-500 font-black uppercase tracking-widest text-xs">Verification Pending</p>
            <p className="text-[var(--text-main)] text-sm font-medium mt-1">Your hospital registration is currently being reviewed by our administrators. Some features may be limited until verified.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-[var(--text-main)] mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Referrals */}
        <div className="lg:col-span-2 card p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl">
          <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between">
            <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Recent Referrals</h3>
            <Link to="/dashboard/hospital/referrals" className="text-primary-600 text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {referrals.slice(0, 5).length > 0 ? (
                  referrals.slice(0, 5).map((ref) => (
                    <tr key={ref._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="px-6 py-4 font-black text-[var(--text-main)] text-sm">{ref.patient?.user?.name || 'Unknown Patient'}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)] font-bold text-sm capitalize">{ref.serviceType?.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--text-muted)]">{new Date(ref.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          ref.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          ref.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {ref.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-[var(--text-muted)] font-black uppercase tracking-widest text-xs opacity-50 italic">No recent referrals</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card space-y-6 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl">
          <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight border-b border-[var(--border-main)] pb-4">Quick Actions</h3>
          <div className="space-y-4">
            <Link to="/dashboard/hospital/patients" className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-main)] border border-transparent hover:border-[var(--border-main)] transition-all group">
              <div className="bg-primary-600/10 text-primary-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Heart size={20} />
              </div>
              <div>
                <p className="font-bold text-[var(--text-main)] text-sm">Register Patient</p>
                <p className="text-xs text-[var(--text-muted)]">Add a new admitted patient</p>
              </div>
            </Link>
            
            <Link to="/dashboard/hospital/doctors" className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-main)] border border-transparent hover:border-[var(--border-main)] transition-all group">
              <div className="bg-primary-600/10 text-primary-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold text-[var(--text-main)] text-sm">Manage Staff</p>
                <p className="text-xs text-[var(--text-muted)]">Add or remove doctors</p>
              </div>
            </Link>
            
            <Link to="/dashboard/hospital/departments" className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--bg-main)] border border-transparent hover:border-[var(--border-main)] transition-all group">
              <div className="bg-primary-600/10 text-primary-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Shield size={20} />
              </div>
              <div>
                <p className="font-bold text-[var(--text-main)] text-sm">Departments</p>
                <p className="text-xs text-[var(--text-muted)]">View hospital departments</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
