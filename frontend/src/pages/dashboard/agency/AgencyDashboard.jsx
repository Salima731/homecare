import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, DollarSign, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetAgencyStatsQuery } from '../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const AgencyDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: response, isLoading, error } = useGetAgencyStatsQuery();
  const data = response?.data;

  if (isLoading) return <LoadingSpinner />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-primary-600/20 p-6 rounded-full">
          <Activity size={64} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Complete Your Agency Profile</h1>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mt-2 font-medium">
            You're almost there! To start managing caregivers and bookings, please complete your agency registration.
          </p>
        </div>
        <button onClick={() => window.location.href = '/dashboard/agency/setup'} className="btn btn-primary px-8 py-3">
          Start Setup
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Caregivers', value: data?.totalCaregivers || 0, icon: <Users size={24} />, color: 'bg-blue-600/20 text-blue-500' },
    { label: 'Active Bookings', value: data?.activeBookings || 0, icon: <Calendar size={24} />, color: 'bg-green-600/20 text-green-500' },
    { label: 'Total Earnings', value: `₹${data?.totalEarnings || 0}`, icon: <DollarSign size={24} />, color: 'bg-purple-600/20 text-purple-500' },
    { label: 'Platform Rating', value: data?.avgRating || '4.8', icon: <TrendingUp size={24} />, color: 'bg-yellow-600/20 text-yellow-500' },
  ];

  const handleGenerateReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{user?.name} Dashboard</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage your agency, caregivers, and client bookings.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateReport}
            className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-300 shadow-lg"
          >
            Generate Report
          </button>
          <Link to="/dashboard/agency/caregivers/add" className="btn btn-primary text-center flex items-center justify-center">Add Caregiver</Link>
        </div>
      </div>

      {/* Verification Alert */}
      {!data?.isVerified && (
        <div className="bg-amber-600/10 border-l-4 border-amber-500 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-500 font-black uppercase tracking-widest text-xs">Verification Pending</p>
            <p className="text-[var(--text-main)] text-sm font-medium mt-1">Your agency is currently being reviewed by our administrators. Some features may be limited until verified.</p>
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
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full">Active</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-[var(--text-main)] mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-0 overflow-hidden bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl">
          <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between">
            <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Recent Bookings</h3>
            <button className="text-primary-600 text-xs font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Caregiver</th>
                  <th className="px-6 py-4">Service Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {data?.recentBookings?.length > 0 ? (
                  data.recentBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="px-6 py-4 font-black text-[var(--text-main)] text-sm">{booking.user?.name}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)] font-bold text-sm">{booking.caregiver?.name || 'Pending Assignment'}</td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--text-muted)]">{new Date(booking.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          booking.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          booking.status === 'assigned' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-[var(--text-main)]">₹{booking.totalAmount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-[var(--text-muted)] font-black uppercase tracking-widest text-xs opacity-50 italic">No bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Caregivers */}
        <div className="card space-y-6 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl">
          <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight border-b border-[var(--border-main)] pb-4">Top Caregivers</h3>
          <div className="space-y-6">
            {data?.topCaregivers?.length > 0 ? (
              data.topCaregivers.map((cg) => (
                <div key={cg._id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-600/20 flex items-center justify-center font-black text-primary-600 text-lg group-hover:scale-110 transition-transform overflow-hidden">
                      {cg.profileImage?.url ? (
                        <img src={cg.profileImage.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        cg.name?.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-main)]">{cg.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                        {cg.completedBookings || 0} Jobs • {cg.avgRating || '0'} Rating
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[var(--text-main)]">₹{cg.totalEarnings || 0}</p>
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Earned</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest opacity-40 italic">
                No performance data yet
              </div>
            )}
          </div>
          <Link 
            to="/dashboard/agency/caregivers"
            className="w-full btn btn-outline border-[var(--border-main)] text-[var(--text-main)] py-3 text-xs font-black uppercase tracking-widest mt-4 text-center block"
          >
            View All Staff
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;
