import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, User, ChevronRight, 
  AlertCircle, CheckCircle2, Play, Square, Timer, Star
} from 'lucide-react';
import { 
  useGetCaregiverBookingsQuery, 
  useClockInMutation, 
  useClockOutMutation,
} from '../../../features/bookings/bookingApiSlice';
import { useSendMessageMutation } from '../../../features/messages/messageApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { MessageSquare, X, Send } from 'lucide-react';

const CaregiverJobs = () => {
  const { data: response, isLoading, error, refetch } = useGetCaregiverBookingsQuery();
  const bookings = response?.data || [];

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();

  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [messageText, setMessageText] = React.useState('');

  const handleOpenMessage = (user) => {
    setSelectedUser(user);
    setShowMessageModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;
    
    const recipientId = selectedUser._id || selectedUser;
    
    try {
      await sendMessage({ 
        recipientId, 
        content: messageText.trim() 
      }).unwrap();
      
      toast.success('Message sent to client!');
      setMessageText('');
      setShowMessageModal(false);
    } catch (err) {
      console.error('Message Error:', err);
      toast.error(err?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  const handleClockIn = async (id) => {
    try {
      await clockIn(id).unwrap();
      toast.success('Clocked in! User has been sent the completion OTP.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async (id) => {
    const otp = window.prompt('Enter the 4-digit Completion OTP provided by the user:');
    if (otp) {
      try {
        await clockOut({ id, otp }).unwrap();
        toast.success('Service completed successfully!');
      } catch (err) {
        toast.error(err?.data?.message || 'Verification failed');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ongoing':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Assigned Jobs</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage your service schedule and clock in/out</p>
        </div>
      </div>

      {error ? (
        error.status === 404 ? (
          <div className="card p-12 text-center space-y-6">
            <AlertCircle size={48} className="mx-auto text-amber-500" />
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)]">Profile Incomplete</h2>
              <p className="text-[var(--text-muted)] mt-2">You need to complete your caregiver profile before you can view assigned jobs.</p>
            </div>
            <button onClick={() => window.location.href = '/dashboard/caregiver/setup'} className="btn btn-primary px-8 py-3">
              Complete Profile Setup
            </button>
          </div>
        ) : (
          <div className="card p-12 text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <h2 className="text-xl font-bold text-[var(--text-main)]">Error Loading Jobs</h2>
            <p className="text-[var(--text-muted)]">{error?.data?.message || 'Something went wrong'}</p>
          </div>
        )
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card group hover:shadow-xl transition-all border-l-4 border-l-primary-500 overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Date Column */}
                <div className="lg:w-48 bg-[var(--bg-main)] p-6 flex lg:flex-col items-center justify-center border-r border-[var(--border-main)] gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Scheduled Date</span>
                  <span className="text-3xl font-black text-[var(--text-main)]">{format(new Date(booking.startDate), 'dd')}</span>
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-tighter">{format(new Date(booking.startDate), 'MMM yyyy')}</span>
                </div>

                {/* Info Column */}
                <div className="flex-1 p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-700 dark:text-primary-400 text-lg">
                        {booking.user?.name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[var(--text-main)]">{booking.user?.name}</h3>
                        <p className="text-sm text-[var(--text-muted)]">Service: {booking.serviceType.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border self-start ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Clock size={16} className="text-gray-400" />
                        <span className="font-bold text-[var(--text-main)]">{booking.startTime || '09:00 AM'} - {booking.endTime || '05:00 PM'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="font-medium text-[var(--text-main)]">
                          {[booking.address?.street, booking.address?.city, booking.address?.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-[var(--text-main)]">Provider: {booking.agency?.agencyName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <Timer size={16} className="text-gray-400" />
                        <span className="font-medium text-[var(--text-main)] capitalize">{booking.durationType} Duration</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="p-6 bg-[var(--bg-main)] border-l border-[var(--border-main)] flex flex-col justify-center gap-3 lg:w-64">
                  {booking.status === 'assigned' && (
                    <button 
                      onClick={() => handleClockIn(booking._id)}
                      disabled={isClockingIn}
                      className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
                    >
                      <Play size={18} fill="currentColor" /> Clock In
                    </button>
                  )}
                  {booking.status === 'ongoing' && (
                    <button 
                      onClick={() => handleClockOut(booking._id)}
                      disabled={isClockingOut}
                      className="btn btn-primary bg-red-600 hover:bg-red-700 border-none w-full flex items-center justify-center gap-2 py-3"
                    >
                      <Square size={18} fill="currentColor" /> Clock Out
                    </button>
                  )}
                  {booking.status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                      <CheckCircle2 size={20} /> Finished
                    </div>
                  )}
                  <button 
                    onClick={() => handleOpenMessage(booking.user)}
                    className="btn btn-outline w-full py-2 text-sm flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} /> Message Client
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto border border-dashed border-[var(--border-main)]">
            <Calendar size={32} className="text-gray-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">No Jobs Assigned</h2>
            <p className="text-[var(--text-muted)] max-w-sm mx-auto mt-2">When an agency assigns you to a booking, it will appear here for you to clock in.</p>
          </div>
        </div>
      )}

      {/* Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-primary-600 text-white">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-widest">Message Client</h3>
                  <p className="text-[10px] font-bold opacity-80">To: {selectedUser?.name}</p>
                </div>
                <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest ml-1">Your Message</label>
                  <textarea
                    required
                    autoFocus
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    className="input min-h-[150px] py-4 bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] rounded-2xl px-6 font-bold focus:border-primary-500 transition-all resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 btn btn-outline border-[var(--border-main)] text-[var(--text-main)] py-4 font-black uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={sendingMessage}
                    className="flex-1 btn btn-primary py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
                  >
                    {sendingMessage ? 'Sending...' : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaregiverJobs;
