import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { 
  Calendar, Clock, MapPin, User, ChevronLeft, 
  CheckCircle2, AlertCircle, XCircle, DollarSign,
  ShieldCheck, MessageSquare, Phone, Mail, Star, AlertTriangle
} from 'lucide-react';
import { useGetBookingByIdQuery } from '../../../features/bookings/bookingApiSlice';
import { 
  useCreateRazorpayOrderMutation, 
  useVerifyRazorpayPaymentMutation 
} from '../../../features/payments/paymentApiSlice';
import { useSendMessageMutation } from '../../../features/messages/messageApiSlice';
import ReviewModal from '../../../components/dashboard/ReviewModal';
import ComplaintModal from '../../../components/dashboard/ComplaintModal';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetBookingByIdQuery(id);
  const booking = response?.data;

  const [createOrder, { isLoading: isOrderLoading }] = useCreateRazorpayOrderMutation();
  const [verifyPayment, { isLoading: isVerifyLoading }] = useVerifyRazorpayPaymentMutation();
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();
  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = React.useState(false);
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [initialMessage, setInitialMessage] = React.useState('');

  const handlePayment = async () => {
    try {
      // 1. Create Razorpay Order
      const orderData = await createOrder({ bookingId: booking._id }).unwrap();
      const { orderId, amount, currency, key } = orderData?.data || {};

      // 2. Open Razorpay Checkout
      const options = {
        key,
        amount,
        currency,
        name: 'CareConnect',
        description: `Payment for Booking #${booking._id.slice(-6)}`,
        image: '/favicon.svg',
        order_id: orderId,
        handler: async (response) => {
          try {
            // 3. Verify Payment
            await verifyPayment({
              razorpay_order_id: response?.razorpay_order_id,
              razorpay_payment_id: response?.razorpay_payment_id,
              razorpay_signature: response?.razorpay_signature,
              bookingId: booking._id
            }).unwrap();

            toast.success('Payment successful! Your booking is confirmed.');
            window.location.reload(); // Refresh to show paid status
          } catch (err) {
            toast.error(err?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err?.data?.message || 'Could not initiate payment');
    }
  };

  const isProcessing = isOrderLoading || isVerifyLoading;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!initialMessage.trim()) return;
    if (!booking.caregiver?.user) {
      toast.error('A caregiver has not been assigned yet.');
      return;
    }

    try {
      await sendMessage({
        recipientId: booking.caregiver?.user?._id || booking.caregiver?.user,
        content: initialMessage
      }).unwrap();
      toast.success('Message sent successfully!');
      setShowMessageModal(false);
      setInitialMessage('');
      navigate('/dashboard/user/messages');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send message');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">Error Loading Booking</h2>
        <p className="text-gray-500">{error?.data?.message || 'Something went wrong'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
      </div>
    );
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'completed': return { icon: <CheckCircle2 className="text-green-500" />, text: 'Completed', color: 'bg-green-100/10 text-green-500 border-green-500/20' };
      case 'cancelled': return { icon: <XCircle className="text-red-500" />, text: 'Cancelled', color: 'bg-red-100/10 text-red-500 border-red-500/20' };
      case 'ongoing': return { icon: <Clock className="text-blue-500" />, text: 'Ongoing', color: 'bg-blue-100/10 text-blue-500 border-blue-500/20' };
      case 'accepted': return { icon: <CheckCircle2 className="text-primary-500" />, text: 'Accepted', color: 'bg-primary-100/10 text-primary-500 border-primary-500/20' };
      case 'assigned': return { icon: <CheckCircle2 className="text-indigo-500" />, text: 'Assigned', color: 'bg-indigo-100/10 text-indigo-500 border-indigo-500/20' };
      default: return { icon: <AlertCircle className="text-yellow-500" />, text: 'Pending Approval', color: 'bg-yellow-100/10 text-yellow-500 border-yellow-500/20' };
    }
  };

  const status = getStatusDisplay(booking.status);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors mb-2"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Back to Bookings</span>
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Booking Details</h1>
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${status.color}`}>
              {status.text}
            </span>
          </div>
          <p className="text-[var(--text-muted)] font-medium font-mono text-sm">ID: {booking._id}</p>
        </div>
        <div className="flex gap-3">
          {booking.status === 'completed' && (
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="btn btn-primary flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              <Star size={16} fill="currentColor" /> Rate Service
            </button>
          )}
          <Link to="/dashboard/user/messages" className="btn btn-outline flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
            <MessageSquare size={16} /> Support
          </Link>
          {booking.status !== 'pending' && (
            <button 
              onClick={() => setIsComplaintModalOpen(true)}
              className="btn border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest"
            >
              <AlertTriangle size={16} /> Report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Card */}
          <div className="card p-0 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)]">
            <div className="bg-[var(--bg-main)]/50 p-8 border-b border-[var(--border-main)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] mb-1">Start Date</p>
                <p className="font-bold text-[var(--text-main)]">{format(new Date(booking.startDate), 'MMM dd, yyyy')}</p>
                <p className="text-xs text-[var(--text-muted)]">{booking.startTime || 'Flexible Time'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] mb-1">End Date</p>
                <p className="font-bold text-[var(--text-main)]">{format(new Date(booking.endDate), 'MMM dd, yyyy')}</p>
                <p className="text-xs text-[var(--text-muted)]">{booking.endTime || 'Flexible Time'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)] mb-1">Duration</p>
                <p className="font-bold text-[var(--text-main)] capitalize">{booking.durationType}</p>
                <p className="text-xs text-[var(--text-muted)]">{booking.totalDays} Days / {booking.totalHours} Hours</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Payment Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {booking.isPaid ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-xs font-black text-green-700 uppercase">Paid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-amber-500" />
                      <span className="text-xs font-black text-amber-700 uppercase tracking-tighter">Pending Payment</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-black text-[var(--text-main)] flex items-center gap-2 uppercase tracking-widest text-xs">
                  <MapPin size={18} className="text-primary-600" /> Service Location
                </h3>
                <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-main)]">
                  <p className="text-[var(--text-main)] font-bold">{booking.address?.street}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {[booking.address?.city, booking.address?.state, booking.address?.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-4">
                <h3 className="font-black text-[var(--text-main)] flex items-center gap-2 uppercase tracking-widest text-xs">
                  <AlertCircle size={18} className="text-primary-600" /> Special Instructions
                </h3>
                <div className="p-4 bg-primary-100/5 rounded-2xl border border-primary-500/10 text-[var(--text-muted)] text-sm leading-relaxed font-medium">
                  {booking.specialInstructions || 'No special instructions provided for this booking.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Caregiver Card */}
          <div className="card p-8 space-y-6 border-[var(--border-main)] bg-[var(--bg-card)] shadow-xl">
            <h3 className="font-black text-[var(--text-main)] uppercase tracking-widest text-xs border-b border-[var(--border-main)] pb-4">Assigned Caregiver</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-white dark:border-gray-800">
                <img 
                  src={booking.caregiver?.profileImage?.url || `https://i.pravatar.cc/150?u=${booking.caregiver?._id}`} 
                  alt={booking.caregiver?.name || 'Pending Assignment'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-black text-[var(--text-main)]">{booking.caregiver?.name || 'Pending Assignment'}</h4>
                <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest mt-0.5">{booking.serviceType.replace('_', ' ')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-[var(--text-main)]">{booking.caregiver?.avgRating > 0 ? Number(booking.caregiver.avgRating).toFixed(1) : 'New'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {booking.caregiver?._id && (
                <Link to={`/dashboard/user/caregivers/${booking.caregiver._id}`} className="w-full btn btn-outline py-2.5 text-[10px] font-black uppercase tracking-widest text-center text-[var(--text-main)]">
                  View Profile
                </Link>
              )}
              <button 
                onClick={() => setShowMessageModal(true)}
                className="w-full py-2.5 text-xs font-black uppercase tracking-widest bg-primary-600/10 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={14} /> Message
              </button>
            </div>
          </div>

          {/* Agency Card */}
          <div className="card p-8 space-y-6 border-[var(--border-main)] bg-[var(--bg-card)]">
            <h3 className="font-black text-[var(--text-main)] uppercase tracking-widest text-xs border-b border-[var(--border-main)] pb-4">Service Provider</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center p-2 text-primary-600">
                {booking.agency?.logo ? (
                  <img src={booking.agency.logo} alt="" className="max-w-full max-h-full" />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </div>
              <div>
                <h4 className="font-black text-[var(--text-main)]">{booking.agency?.agencyName}</h4>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    <Phone size={12} className="text-primary-600" /> {booking.agency?.phone || 'Not available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="card p-8 bg-gray-900 text-white space-y-6 shadow-2xl shadow-gray-200">
            <h3 className="font-black uppercase tracking-widest text-xs opacity-50">Price Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">{booking.durationType} Rate</span>
                <span className="font-bold">₹{booking.rateApplied}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Subtotal</span>
                <span className="font-bold">₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Taxes & Fees</span>
                <span className="font-bold">₹0.00</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="font-bold">Total Amount</span>
                <span className="text-2xl font-black text-primary-400">₹{booking.totalAmount}</span>
              </div>
            </div>
            {!booking.isPaid && booking.status !== 'cancelled' && (
              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full btn btn-primary py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
        booking={booking} 
      />
      <ComplaintModal 
        isOpen={isComplaintModalOpen} 
        onClose={() => setIsComplaintModalOpen(false)} 
        booking={booking} 
      />

      {/* Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessageModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-[var(--border-main)] relative z-10"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)]/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Message {booking.caregiver?.name?.split(' ')[0]}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Direct communication portal</p>
                  </div>
                </div>
                <button onClick={() => setShowMessageModal(false)} className="p-3 bg-[var(--bg-main)] hover:bg-[var(--border-main)] rounded-2xl transition-all active:scale-90">
                  <X size={20} className="text-[var(--text-muted)]" />
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Your Message</label>
                  <textarea
                    required
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Hello! I have a question about my booking..."
                    className="input min-h-[180px] py-5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-medium resize-none focus:ring-primary-600/20 w-full"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={sendingMessage}
                  className="btn btn-primary w-full py-5 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-600/30 active:scale-95 transition-all"
                >
                  {sendingMessage ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingDetail;
