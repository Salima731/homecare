import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, Star, CheckCircle, MapPin, AlertTriangle, X, Search } from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetCaregiverDashboardQuery } from '../../../features/caregivers/caregiverApiSlice';
import { useClockInMutation, useClockOutMutation } from '../../../features/bookings/bookingApiSlice';
import { useSetAvailabilityMutation } from '../../../features/schedules/scheduleApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CaregiverDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: response, isLoading, error, refetch } = useGetCaregiverDashboardQuery();
  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();
  const [setAvailability, { isLoading: isSettingAvailability }] = useSetAvailabilityMutation();
  
  React.useEffect(() => {
    refetch();
  }, [refetch]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const data = response?.data;
  const todaysBookings = data?.todaysBookings || [];
  const filteredBookings = todaysBookings.filter(booking => 
    booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = async (action, bookingId) => {
    if (action === 'Clock In') {
      try {
        await clockIn(bookingId).unwrap();
        toast.success('Successfully clocked in!');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to clock in');
      }
      return;
    }
    if (action === 'Clock Out') {
      const otp = window.prompt('Enter the 4-digit Completion OTP provided by the user:');
      if (otp) {
        try {
          await clockOut({ id: bookingId, otp }).unwrap();
          toast.success('Service completed successfully!');
          refetch();
        } catch (err) {
          toast.error(err?.data?.message || 'Verification failed');
        }
      }
      return;
    }
    if (action === 'Set Availability' || action === 'Edit Schedule') {
      setIsModalOpen(true);
      return;
    }
    if (action === 'Trust Score Details') {
      setIsTrustModalOpen(true);
      return;
    }
    toast.success(`${action} functionality coming soon!`);
  };

  const handleSaveAvailability = async () => {
    try {
      await setAvailability({
        date: selectedDate,
        isAvailable,
        slots: isAvailable ? [{ startTime: '09:00', endTime: '17:00' }] : []
      }).unwrap();
      toast.success('Availability updated!');
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update availability');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error?.status === 404) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-primary-600/10 p-6 rounded-full border border-primary-500/20">
          <Star size={64} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Complete Your Caregiver Profile</h1>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mt-2">
            Showcase your experience and get verified to start receiving bookings.
          </p>
        </div>
        <button onClick={() => window.location.href = '/dashboard/caregiver/setup'} className="btn btn-primary px-8 py-3">
          Complete Profile
        </button>
      </div>
    );
  }

  const caregiverStats = data?.stats || {};
  const stats = [
    { label: 'Active Jobs', value: caregiverStats.activeJobs || '0', icon: <Clock size={24} />, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Total Earnings', value: `₹${caregiverStats.monthlyEarnings || 0}`, icon: <DollarSign size={24} />, color: 'bg-green-500/10 text-green-500' },
    { label: 'Rating', value: caregiverStats.rating || '0', icon: <Star size={24} />, color: 'bg-yellow-500/10 text-yellow-500' },
    { label: 'Completion', value: `${caregiverStats.completionRate || 0}%`, icon: <CheckCircle size={24} />, color: 'bg-purple-500/10 text-purple-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Hello, {user?.name}!</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage your availability and assigned care jobs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleAction('Set Availability')} className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] px-6 py-3">Set Availability</button>
          <button onClick={() => handleAction('Find Extra Shifts')} className="btn btn-primary px-6 py-3 shadow-xl shadow-primary-900/20">Find Extra Shifts</button>
        </div>
      </div>

      {/* Trust Score Alert */}
      <div className={`${(data?.caregiver?.trustScore?.score || 0) >= 70 ? 'bg-green-600/10 border-green-600' : 'bg-amber-600/10 border-amber-600'} border-l-4 p-5 rounded-r-3xl flex items-center justify-between backdrop-blur-md shadow-lg shadow-black/5`}>
        <div className="flex items-start gap-4">
          <div className={`${(data?.caregiver?.trustScore?.score || 0) >= 70 ? 'bg-green-600' : 'bg-amber-600'} p-2 rounded-xl text-white shadow-lg`}>
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <p className="text-[var(--text-main)] font-black text-lg tracking-tight">
              Your Trust Score: {data?.caregiver?.trustScore?.score || 0} 
              <span className="ml-2 px-2 py-0.5 bg-[var(--bg-card)] rounded-lg text-[10px] uppercase border border-[var(--border-main)]">
                Grade {data?.caregiver?.trustScore?.grade || 'F'}
              </span>
            </p>
            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest opacity-70 mt-1">
              {(data?.caregiver?.trustScore?.score || 0) >= 70 
                ? 'Keep up the great work! High scores mean more job visibility.' 
                : 'Improve your score by completing jobs and being on time to get more visibility.'}
            </p>
          </div>
        </div>
        <button onClick={() => handleAction('Trust Score Details')} className="text-primary-600 font-black text-xs uppercase tracking-widest hover:underline">Details</button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 flex flex-col items-center text-center group hover:shadow-2xl transition-all border-[var(--border-main)] bg-[var(--bg-card)]"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{stat.label}</p>
            <p className="text-3xl font-black text-[var(--text-main)] mt-1 tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Today's Schedule</h2>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-muted)]">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-xs font-bold text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, i) => (
                <div key={i} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-primary-500 bg-[var(--bg-card)] border-[var(--border-main)] hover:shadow-xl transition-all">
                  <div className="flex items-center gap-5">
                    <div className="bg-primary-600/10 p-4 rounded-2xl text-primary-600 shadow-inner">
                      <Clock size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-1">
                        {new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xl font-black text-[var(--text-main)] tracking-tight">{booking.user?.name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border-main)] uppercase tracking-widest">
                          {booking.serviceType}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-tighter">
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleAction('View Details', booking._id)} className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] px-5 py-2 text-xs">View Details</button>
                    {booking.status === 'assigned' && (
                      <button 
                        onClick={() => handleAction('Clock In', booking._id)} 
                        disabled={isClockingIn}
                        className="btn btn-primary px-6 py-2 text-xs shadow-lg shadow-primary-600/20"
                      >
                        {isClockingIn ? 'Clocking in...' : 'Clock In'}
                      </button>
                    )}
                    {booking.status === 'ongoing' && (
                      <button 
                        onClick={() => handleAction('Clock Out', booking._id)} 
                        disabled={isClockingOut}
                        className="btn btn-primary px-6 py-2 text-xs bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-600/20"
                      >
                        {isClockingOut ? 'Clocking out...' : 'Clock Out'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-12 text-center border-dashed border-2 border-[var(--border-main)] bg-[var(--bg-card)]/30">
                <Calendar className="mx-auto mb-4 opacity-10 text-[var(--text-main)]" size={64} />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">No shifts scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Availability */}
        <div className="card p-8 space-y-8 bg-[var(--bg-card)] border-[var(--border-main)] shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Weekly Availability</h3>
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-600">
              <Calendar size={20} />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              date.setHours(0, 0, 0, 0);
              
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = date.getDate();
              
              const availability = data?.weeklyAvailability?.find(s => {
                const sDate = new Date(s.date);
                return sDate.getDate() === dayNum && sDate.getMonth() === date.getMonth();
              });

              return (
                <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-main)] hover:border-primary-500/30 transition-all group">
                  <div className="flex flex-col">
                    <span className="font-black text-[var(--text-main)] text-sm group-hover:text-primary-600 transition-colors uppercase tracking-widest">{dayName}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold opacity-60 uppercase tracking-tighter">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border ${availability?.isAvailable ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-[var(--text-muted)] border-[var(--border-main)]'}`}>
                    {availability?.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>
              );
            })}
          </div>
          <button onClick={() => handleAction('Edit Schedule')} className="w-full btn btn-primary py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-900/20">Update Schedule</button>
        </div>
      </div>

      {/* Availability Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex items-center justify-between bg-primary-600 text-white">
                <h3 className="font-black text-xl tracking-tight uppercase tracking-widest">Set Availability</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all active:scale-90">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest ml-1">Select Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input w-full h-14 bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] rounded-2xl px-6 font-bold focus:border-primary-500 transition-all"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-[var(--bg-main)]/50 rounded-3xl border border-[var(--border-main)] group hover:border-primary-500/30 transition-all">
                  <div>
                    <p className="font-black text-[var(--text-main)] tracking-tight">Are you available?</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60 mt-1">Set your status for this day</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isAvailable}
                      onChange={() => setIsAvailable(!isAvailable)}
                    />
                    <div className="w-12 h-7 bg-[var(--border-main)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner"></div>
                  </label>
                </div>

                {isAvailable && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-primary-600/10 rounded-3xl border border-primary-500/20 flex items-center gap-4 text-primary-600 shadow-inner"
                  >
                    <Clock size={24} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Standard Shift</p>
                      <p className="font-black tracking-tight">09:00 AM - 05:00 PM</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-8 bg-[var(--bg-main)]/30 flex gap-4 border-t border-[var(--border-main)]">
                <button onClick={() => setIsModalOpen(false)} className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] flex-1 py-4 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">Cancel</button>
                <button 
                  onClick={handleSaveAvailability} 
                  disabled={isSettingAvailability}
                  className="btn btn-primary flex-1 py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary-900/20 active:scale-95 transition-all"
                >
                  {isSettingAvailability ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Trust Score Breakdown Modal */}
      <AnimatePresence>
        {isTrustModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex items-center justify-between bg-primary-600 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Star size={120} fill="white" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-black text-2xl tracking-tight uppercase tracking-widest">Performance Analysis</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Detailed Trust Score Breakdown</p>
                </div>
                <button onClick={() => setIsTrustModalOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all active:scale-90 relative z-10">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between p-6 bg-primary-600/5 rounded-3xl border border-primary-500/20">
                  <div>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Current Grade</p>
                    <p className="text-4xl font-black text-primary-600 tracking-tighter">{data?.caregiver?.trustScore?.grade || 'F'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Overall Score</p>
                    <p className="text-4xl font-black text-primary-600 tracking-tighter">{data?.caregiver?.trustScore?.score || 0}/100</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Avg Rating', value: `${data?.caregiver?.trustScore?.breakdown?.avgRating || 0}/5`, sub: 'Quality of care' },
                    { label: 'Experience', value: `${data?.caregiver?.trustScore?.breakdown?.experience || 0} Yrs`, sub: 'Industry tenure' },
                    { label: 'Bookings', value: data?.caregiver?.trustScore?.breakdown?.completedBookings || 0, sub: 'Success history' },
                    { label: 'Punctuality', value: `${((data?.caregiver?.trustScore?.breakdown?.punctualityRatio || 0) * 100).toFixed(0)}%`, sub: 'Arrival timing' },
                    { label: 'Complaints', value: `${((data?.caregiver?.trustScore?.breakdown?.complaintRatio || 0) * 100).toFixed(1)}%`, sub: 'Lower is better', reverse: true },
                    { label: 'Cancellations', value: `${((data?.caregiver?.trustScore?.breakdown?.cancellationRatio || 0) * 100).toFixed(1)}%`, sub: 'Lower is better', reverse: true },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-main)] space-y-1">
                      <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{item.label}</p>
                      <p className={`text-lg font-black tracking-tight ${item.reverse ? (parseFloat(item.value) > 5 ? 'text-red-500' : 'text-[var(--text-main)]') : 'text-[var(--text-main)]'}`}>{item.value}</p>
                      <p className="text-[8px] font-bold text-[var(--text-muted)] opacity-50 uppercase tracking-tighter">{item.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed uppercase tracking-wider">
                    Trust scores are recalculated daily. High scores increase your ranking in search results and eligibility for premium shifts.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-[var(--bg-main)]/30 border-t border-[var(--border-main)]">
                <button onClick={() => setIsTrustModalOpen(false)} className="w-full btn btn-primary py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-900/20 active:scale-95 transition-all">Close Analysis</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaregiverDashboard;
