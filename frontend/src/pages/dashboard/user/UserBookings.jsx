import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronRight, AlertCircle, CheckCircle2, XCircle, Star } from 'lucide-react';
import { useGetBookingsQuery, useCancelBookingMutation } from '../../../features/bookings/bookingApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import ReviewModal from '../../../components/dashboard/ReviewModal';

const UserBookings = () => {
  const { data: response, isLoading, error } = useGetBookingsQuery();
  const bookings = response?.data || [];
  const [cancelBooking] = useCancelBookingMutation();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  if (isLoading) return <LoadingSpinner />;

  const handleCancel = async (id) => {
    const reason = window.prompt('Please enter a reason for cancellation:');
    if (reason !== null) {
      try {
        await cancelBooking({ id, reason }).unwrap();
        toast.success('Booking cancelled successfully');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-100/10 text-red-500 border-red-500/20';
      case 'pending': return 'bg-yellow-100/10 text-yellow-500 border-yellow-500/20';
      case 'accepted': return 'bg-blue-100/10 text-blue-500 border-blue-500/20';
      case 'assigned': return 'bg-indigo-100/10 text-indigo-500 border-indigo-500/20';
      case 'ongoing': return 'bg-purple-100/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-100/10 text-[var(--text-muted)] border-[var(--border-main)]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">My Bookings</h1>
          <p className="text-[var(--text-muted)] font-medium">View and manage your care service appointments.</p>
        </div>
      </div>

      <div className="space-y-6">
        {bookings.length > 0 ? (
          bookings.map((booking, i) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-0 overflow-hidden hover:border-primary-500/50 transition-all group border-[var(--border-main)] bg-[var(--bg-card)] shadow-lg"
            >
              <div className="flex flex-col md:flex-row">
                {/* Date & Time Column */}
                <div className="md:w-48 bg-[var(--bg-main)] p-6 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-[var(--border-main)] transition-colors">
                  <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">
                    {new Date(booking.startDate).toLocaleString('default', { month: 'short' })}
                  </p>
                  <p className="text-4xl font-black text-[var(--text-main)] mt-1">
                    {new Date(booking.startDate).getDate()}
                  </p>
                  <p className="text-xs font-black text-primary-600 mt-2 flex items-center gap-1 uppercase tracking-tighter">
                    <Clock size={14} /> {booking.startTime || 'Flexible'}
                  </p>
                </div>

                {/* Content Column */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary-100/10 flex items-center justify-center font-black text-primary-600 text-xl overflow-hidden border border-primary-500/20 shadow-inner">
                        {booking.caregiver?.profileImage?.url ? (
                          <img src={booking.caregiver.profileImage.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          booking.caregiver?.name?.[0] || booking.agency?.agencyName?.[0] || 'A'
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-[var(--text-main)] group-hover:text-primary-600 transition-colors">
                          {booking.caregiver?.name || booking.agency?.agencyName || 'Pending Assignment'}
                        </h3>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{booking.serviceType?.replace('_', ' ') || 'Caregiver'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-main)]">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] text-primary-600">
                          <MapPin size={14} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)] line-clamp-1 leading-relaxed">
                          {[booking.address?.city, booking.address?.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] text-primary-600">
                          <User size={14} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Type: {booking.durationType}</span>
                      </div>
                    </div>
                    <div className="md:text-right flex flex-col justify-center">
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-2xl font-black text-primary-600">₹{booking.totalAmount}</p>
                    </div>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="p-6 bg-[var(--bg-main)]/50 flex flex-row md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-[var(--border-main)] transition-colors">
                  {booking.status === 'pending' ? (
                    <button 
                      onClick={() => handleCancel(booking._id)}
                      className="btn border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                  ) : null}
                  {booking.status === 'completed' && (
                    <button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsReviewModalOpen(true);
                      }}
                      className="btn bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white border border-yellow-500/20 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Star size={14} fill="currentColor" /> Rate Service
                    </button>
                  )}
                  <Link 
                    to={`/dashboard/user/bookings/${booking._id}`} 
                    className="btn btn-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 card border-dashed border-2 border-[var(--border-main)] bg-[var(--bg-main)]/50">
            <div className="w-20 h-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Calendar size={40} className="text-[var(--text-muted)] opacity-20" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">No Bookings Yet</h3>
            <p className="text-[var(--text-muted)] mt-2 max-w-sm mx-auto font-medium">
              You haven't booked any care services yet. Start searching to find the perfect caregiver.
            </p>
            <Link to="/dashboard/user/caregivers" className="btn btn-primary mt-8 px-10 py-3 font-black uppercase tracking-widest shadow-xl shadow-primary-600/20">Find a Caregiver</Link>
          </div>
        )}
      </div>

      {selectedBooking && (
        <ReviewModal 
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      )}
    </div>
  );
};

export default UserBookings;
