import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, User, CheckCircle2,
  XCircle, Loader2, Filter
} from 'lucide-react';
import {
  useGetAgencyBookingsQuery,
  useAcceptBookingMutation,
  useAssignCaregiverMutation,
  useCancelBookingMutation,
} from '../../../features/bookings/bookingApiSlice';
import { useGetAgencyCaregiversQuery } from '../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'assigned', 'ongoing', 'completed', 'cancelled'];

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

const AgencyBookings = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: response, isLoading } = useGetAgencyBookingsQuery();
  const { data: caregiverResponse } = useGetAgencyCaregiversQuery();
  const [acceptBooking, { isLoading: isAccepting }] = useAcceptBookingMutation();
  const [assignCaregiver, { isLoading: isAssigning }] = useAssignCaregiverMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  const [actionId, setActionId] = useState(null);

  const allBookings = response?.data || [];
  const caregivers = caregiverResponse?.data?.docs || caregiverResponse?.data || [];
  const bookings = statusFilter === 'all'
    ? allBookings
    : allBookings.filter((b) => b.status === statusFilter);

  const handleAccept = async (id) => {
    setActionId(id);
    try {
      await acceptBooking(id).unwrap();
      toast.success('Booking accepted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to accept booking');
    } finally {
      setActionId(null);
    }
  };

  const handleAssign = async (booking) => {
    const eligibleCaregivers = caregivers.filter(
      (caregiver) =>
        caregiver.isVerified &&
        caregiver.isActive &&
        caregiver.serviceType === booking.serviceType,
    );

    if (eligibleCaregivers.length === 0) {
      toast.error('No verified active caregivers are available for this service type');
      return;
    }

    const options = eligibleCaregivers
      .map((caregiver, index) => `${index + 1}. ${caregiver.name}`)
      .join('\n');
    const selected = window.prompt(`Assign caregiver:\n${options}\n\nEnter number:`);
    if (!selected) return;

    const caregiver = eligibleCaregivers[Number(selected) - 1];
    if (!caregiver) {
      toast.error('Invalid caregiver selection');
      return;
    }

    setActionId(booking._id);
    try {
      await assignCaregiver({ id: booking._id, caregiverId: caregiver._id }).unwrap();
      toast.success(`${caregiver.name} assigned to booking`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to assign caregiver');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Enter cancellation reason:');
    if (reason === null) return;
    setActionId(id);
    try {
      await cancelBooking({ id, reason }).unwrap();
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionId(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Bookings Management</h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">
            Accept, assign caregivers, or cancel client service requests.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] px-4 py-2 rounded-2xl border border-[var(--border-main)]">
          <Filter size={14} className="text-[var(--text-muted)]" />
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            {bookings.length} {statusFilter === 'all' ? 'Total' : statusFilter} Bookings
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              statusFilter === s
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-main)] hover:text-[var(--text-main)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking, i) => {
            const isActing = actionId === booking._id;
            return (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card p-0 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] shadow-lg hover:border-primary-500/30 transition-all group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Date Column */}
                  <div className="md:w-40 bg-[var(--bg-main)] p-6 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-[var(--border-main)]">
                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                      {new Date(booking.startDate).toLocaleString('default', { month: 'short' })}
                    </p>
                    <p className="text-4xl font-black text-[var(--text-main)] mt-1">
                      {new Date(booking.startDate).getDate()}
                    </p>
                    <p className="text-[10px] font-black text-primary-600 mt-2 flex items-center gap-1 uppercase">
                      <Clock size={12} /> {booking.startTime || 'Flex'}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-primary-600" />
                          <p className="font-black text-[var(--text-main)] text-sm">{booking.user?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-primary-600" />
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            Caregiver: {booking.caregiver?.name || 'Pending agency assignment'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase ${getStatusStyle(booking.status)}`}>
                          {booking.status}
                        </span>
                        <p className="text-xl font-black text-primary-600">₹{booking.totalAmount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-main)]/50">
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <MapPin size={12} className="text-primary-600" />
                        {booking.address?.city || booking.address?.street || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                        <Calendar size={12} className="text-primary-600" />
                        {booking.durationType} · {booking.totalDays}d / {booking.totalHours}h
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="p-4 md:p-6 bg-[var(--bg-main)]/50 border-t md:border-t-0 md:border-l border-[var(--border-main)] flex flex-row md:flex-col items-center justify-center gap-2 min-w-[130px]">
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleAccept(booking._id)}
                        disabled={isActing}
                        className="w-full btn bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Accept
                      </button>
                    )}

                    {booking.status === 'accepted' && (
                      <button
                        onClick={() => handleAssign(booking)}
                        disabled={isActing || isAssigning}
                        className="w-full btn bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />}
                        Assign
                      </button>
                    )}

                    {!['completed', 'cancelled'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={isActing}
                        className="w-full btn bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Cancel
                      </button>
                    )}

                    {booking.status === 'completed' && (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Done</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-20 card border-dashed border-2 border-[var(--border-main)] bg-[var(--bg-main)]/30">
            <Calendar size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
            <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">
              No {statusFilter !== 'all' ? statusFilter : ''} Bookings
            </h3>
            <p className="text-[var(--text-muted)] font-medium text-sm mt-2">
              {statusFilter === 'all'
                ? 'No client bookings have been made yet.'
                : `There are no bookings with "${statusFilter}" status.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyBookings;
