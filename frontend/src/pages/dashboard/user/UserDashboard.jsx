import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Calendar, Clock, CreditCard, Star, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetDashboardStatsQuery } from '../../../features/users/userApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const UserDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, error } = useGetDashboardStatsQuery();

  if (isLoading) return <LoadingSpinner />;

  const stats = [
    { label: 'Active Bookings', value: Number(data?.data?.activeBookings) || 0, icon: <Calendar className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Total Spent', value: `₹${(Number(data?.data?.totalSpent) || 0).toFixed(2)}`, icon: <CreditCard className="text-green-500" />, color: 'bg-green-50' },
    { label: 'Completed Jobs', value: Number(data?.data?.completedJobs) || 0, icon: <Clock className="text-purple-500" />, color: 'bg-purple-50' },
    { label: 'Avg Rating Given', value: data?.data?.avgRating ? Number(data.data.avgRating).toFixed(1) : 'N/A', icon: <Star className="text-yellow-500" />, color: 'bg-yellow-50' },
  ];

  const upcomingBookings = data?.data?.upcomingBookings || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Welcome, {user?.name}! 👋</h1>
        <p className="text-[var(--text-muted)]">Here's what's happening with your care services today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl relative overflow-hidden group hover:border-primary-500/30 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 blur-3xl rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary-600/10"></div>
            <div className="flex items-center relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} dark:bg-opacity-10 flex items-center justify-center mr-4 shadow-inner`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text-main)]">Upcoming Appointments</h2>
            <button className="text-primary-600 font-bold hover:underline text-sm uppercase tracking-wider">View All</button>
          </div>
          
          <div className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking._id} className="card p-5 flex items-center justify-between hover:border-primary-500/50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center font-bold text-primary-600 overflow-hidden border border-[var(--border-main)]">
                      {booking.caregiver?.profileImage?.url ? (
                        <img src={booking.caregiver.profileImage.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        booking.caregiver?.name?.[0] || booking.agency?.agencyName?.[0] || 'A'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-main)] group-hover:text-primary-600 transition-colors">
                        {booking.caregiver?.name || booking.agency?.agencyName || 'Pending Assignment'}
                      </p>
                      <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                        <Calendar size={14} className="text-primary-500" /> {new Date(booking.startDate).toLocaleDateString()} at {booking.startTime || 'Flexible'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                      {booking.status}
                    </span>
                    <p className="text-lg font-black mt-2 text-[var(--text-main)]">₹{booking.totalAmount}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-[var(--bg-main)] rounded-2xl border-2 border-dashed border-[var(--border-main)]">
                <Search className="mx-auto text-[var(--text-muted)] mb-4 opacity-20" size={64} />
                <p className="text-[var(--text-muted)] font-medium">No upcoming appointments found.</p>
                <Link to="/dashboard/user/caregivers" className="btn btn-primary mt-6 inline-flex items-center gap-2">
                  <Search size={18} /> Book a Caregiver
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Recommended */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--text-main)]">Recommended For You</h2>
          <div className="space-y-4">
            {[1, 2].map((_, i) => (
              <div key={i} className="card p-5 space-y-4 group">
                <div className="flex gap-4">
                  <img src={`https://i.pravatar.cc/150?u=${i+10}`} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--bg-main)]" alt="Caregiver" />
                  <div>
                    <p className="font-bold text-[var(--text-main)] group-hover:text-primary-600 transition-colors">Professional Nurse</p>
                    <div className="flex items-center text-yellow-500 mt-1">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-black ml-1 text-[var(--text-main)]">4.9</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-1 font-bold">(120 reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-xs text-[var(--text-muted)] gap-2 font-medium">
                  <MapPin size={14} className="text-primary-500" /> New York, NY
                </div>
                <Link to="/dashboard/user/caregivers" className="w-full btn btn-outline py-2.5 text-xs text-center block font-black uppercase tracking-widest">
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
