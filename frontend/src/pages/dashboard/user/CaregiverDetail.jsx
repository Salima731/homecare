import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, MapPin, Clock, ShieldCheck, Heart, 
  MessageCircle, Calendar, ChevronLeft, Check,
  Award, FileText, PlayCircle, Loader2, Send, X, MessageSquare, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetCaregiverByIdQuery } from '../../../features/caregivers/caregiverApiSlice';
import { useCreateBookingMutation } from '../../../features/bookings/bookingApiSlice';
import { 
  useCreateRazorpayOrderMutation, 
  useVerifyRazorpayPaymentMutation 
} from '../../../features/payments/paymentApiSlice';
import { useSendMessageMutation } from '../../../features/messages/messageApiSlice';
import { useGetCaregiverReviewsQuery } from '../../../features/reviews/reviewApiSlice';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../../../features/users/userApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const CaregiverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetCaregiverByIdQuery(id);
  const caregiver = response?.data;
  
  const [createBooking, { isLoading: isBookingLoading }] = useCreateBookingMutation();
  const [createOrder, { isLoading: isOrderLoading }] = useCreateRazorpayOrderMutation();
  const [verifyPayment, { isLoading: isVerifyLoading }] = useVerifyRazorpayPaymentMutation();
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();
  const { data: reviewsResponse, isLoading: isLoadingReviews, error: reviewsError } = useGetCaregiverReviewsQuery(id);
  const reviews = reviewsResponse?.data || [];

  const { data: favsResponse } = useGetFavoritesQuery();
  const favorites = favsResponse?.data || [];
  const isFavorited = favorites.some((fav) => (fav._id || fav) === id);
  const [toggleFavorite, { isLoading: isTogglingFav }] = useToggleFavoriteMutation();

  const [selectedRate, setSelectedRate] = useState('hourly');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [bookingDetails, setBookingDetails] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    address: '123 Test St, New York, NY',
    specialInstructions: ''
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return (
    <div className="text-center py-24 space-y-4">
      <AlertCircle size={64} className="mx-auto text-red-500 opacity-20" />
      <p className="text-[var(--text-main)] font-black uppercase tracking-widest">Error loading caregiver profile</p>
      <button onClick={() => navigate(-1)} className="btn btn-outline px-8">Go Back</button>
    </div>
  );

  const handleBook = async () => {
    try {
      const booking = await createBooking({
        agencyId: caregiver?.agency?._id || caregiver?.agency,
        serviceType: caregiver?.serviceType,
        durationType: selectedRate,
        ...bookingDetails
      }).unwrap();

      const orderData = await createOrder({ bookingId: booking?.data?._id }).unwrap();
      const { orderId, amount, currency, key } = orderData?.data || {};

      const options = {
        key,
        amount,
        currency,
        name: 'CareConnect',
        description: `Booking request for ${caregiver?.agency?.agencyName || 'agency care'}`,
        image: '/favicon.svg',
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response?.razorpay_order_id,
              razorpay_payment_id: response?.razorpay_payment_id,
              razorpay_signature: response?.razorpay_signature,
              bookingId: booking?.data?._id
            }).unwrap();

            toast.success('Payment successful! Your request is pending agency approval.');
            navigate('/dashboard/user/bookings');
          } catch (err) {
            toast.error(err?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#2563eb' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err?.data?.message || 'Could not initiate booking');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!initialMessage.trim()) return;

    try {
      await sendMessage({
        recipientId: caregiver?.user?._id || caregiver?.user,
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

  const isProcessing = isBookingLoading || isOrderLoading || isVerifyLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-primary-600 transition-all group"
      >
        <div className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] group-hover:border-primary-500/30">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="font-black text-xs uppercase tracking-widest">Back to search</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="card p-8 flex flex-col md:flex-row gap-8 items-start border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            
            <div className="relative shrink-0">
              <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-[var(--bg-card)] ring-1 ring-[var(--border-main)]">
                <img 
                  src={caregiver?.profileImage?.url || `https://i.pravatar.cc/300?u=${caregiver?._id}`} 
                  alt={caregiver?.name} 
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                />
              </div>
              {caregiver?.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-3 rounded-2xl shadow-2xl ring-4 ring-[var(--bg-card)]">
                  <ShieldCheck size={24} />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-primary-600 font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-3">
                    {(caregiver?.serviceType || 'Caregiver').replace('_', ' ')}
                    {caregiver?.trustScore && (
                      <span className={`px-3 py-1 rounded-lg text-white text-[10px] font-black shadow-lg ${
                        caregiver.trustScore.score >= 80 ? 'bg-green-500 shadow-green-500/20' : 
                        caregiver.trustScore.score >= 60 ? 'bg-blue-500 shadow-blue-500/20' : 
                        'bg-amber-500 shadow-amber-500/20'
                      }`}>
                        GRADE {caregiver.trustScore.grade}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await toggleFavorite(id).unwrap();
                        toast.success(res.message || 'Updated favorites');
                      } catch (err) {
                        toast.error('Failed to update favorites');
                      }
                    }}
                    disabled={isTogglingFav}
                    className={`p-4 rounded-2xl transition-all border ${isFavorited ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-main)] hover:text-red-500 hover:border-red-500/30'} ${isTogglingFav ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={() => setShowMessageModal(true)}
                    className="p-4 rounded-2xl bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-main)] hover:text-primary-600 hover:border-primary-500/30 transition-all"
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)]">
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-[var(--text-main)]">{caregiver?.avgRating > 0 ? Number(caregiver.avgRating).toFixed(1) : 'New'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-1">({caregiver?.reviewCount || 0} Reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <MapPin size={18} className="text-primary-600" />
                  <span className="text-xs font-black uppercase tracking-widest">{caregiver?.location?.city || 'New York'}, {caregiver?.location?.state || 'NY'}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Clock size={18} className="text-primary-600" />
                  <span className="text-xs font-black uppercase tracking-widest">{caregiver?.experience} Years Experience</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {caregiver?.specializations?.map((spec, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-primary-600/5 text-primary-600 text-[10px] font-black uppercase tracking-widest border border-primary-600/10">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Inputs */}
          <div className="card p-8 space-y-8 border-[var(--border-main)] bg-[var(--bg-card)]">
            <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-3 tracking-tight">
              <div className="p-2 rounded-xl bg-primary-600/10 text-primary-600">
                <Calendar size={20} />
              </div>
              Schedule Your Service
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Start Date</label>
                <input 
                  type="date" 
                  value={bookingDetails.startDate}
                  onChange={(e) => setBookingDetails({...bookingDetails, startDate: e.target.value})}
                  className="input w-full bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold py-3.5" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">End Date</label>
                <input 
                  type="date" 
                  value={bookingDetails.endDate}
                  onChange={(e) => setBookingDetails({...bookingDetails, endDate: e.target.value})}
                  className="input w-full bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold py-3.5" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Address</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-40">
                    <MapPin size={18} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Where should the caregiver arrive?"
                    value={bookingDetails.address}
                    onChange={(e) => setBookingDetails({...bookingDetails, address: e.target.value})}
                    className="input w-full pl-12 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold py-3.5" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Special Instructions</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-40">
                    <FileText size={18} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Any allergies or requirements?"
                    value={bookingDetails.specialInstructions}
                    onChange={(e) => setBookingDetails({...bookingDetails, specialInstructions: e.target.value})}
                    className="input w-full pl-12 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold py-3.5" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="card p-8 space-y-6 border-[var(--border-main)] bg-[var(--bg-card)]">
            <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-3 tracking-tight">
              <div className="p-2 rounded-xl bg-primary-600/10 text-primary-600">
                <Award size={20} />
              </div>
              About {caregiver?.name?.split(' ')[0]}
            </h2>
            <p className="text-[var(--text-main)] leading-relaxed font-medium opacity-80">
              {caregiver?.bio || 'Compassionate and dedicated professional with a track record of providing high-quality care. Specializing in personalized support and creating a safe, nurturing environment for all clients.'}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-3 tracking-tight">
                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-600">
                  <Star size={20} fill="currentColor" />
                </div>
                Client Reviews
              </h2>
              <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-main)]">
                {caregiver?.reviewCount || 0} Verified Reviews
              </div>
            </div>

            {isLoadingReviews ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary-600" />
              </div>
            ) : !reviewsResponse ? (
              <div className="text-center py-12 text-red-500">
                Error loading reviews: {reviewsError ? JSON.stringify(reviewsError) : 'Unknown Error'}
              </div>
            ) : reviews?.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {reviews.map((review) => (
                  <div key={review._id} className="card p-6 border-[var(--border-main)] bg-[var(--bg-card)] shadow-lg hover:border-primary-500/30 transition-all group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center font-black text-primary-600 text-sm overflow-hidden">
                          {review.user?.avatar?.url ? (
                            <img src={review.user.avatar.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            review.user?.name?.[0]
                          )}
                        </div>
                        <div>
                          <p className="font-black text-sm text-[var(--text-main)]">{review.user?.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                            {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[var(--bg-main)] px-3 py-1.5 rounded-xl border border-[var(--border-main)] group-hover:border-yellow-500/30 transition-all">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-black text-xs text-[var(--text-main)]">{review.ratings?.overall}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[var(--border-main)]/50">
                      {['punctuality', 'behavior', 'skill', 'cleanliness'].map((type) => (
                        <div key={type} className="space-y-0.5">
                          <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-tighter opacity-40">{type}</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={8} className={s <= review.ratings?.[type] ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-800'} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {review.comment ? (
                      <p className="mt-4 text-sm text-[var(--text-main)] font-medium leading-relaxed italic opacity-80">
                        "{review.comment}"
                      </p>
                    ) : (
                      <p className="mt-4 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-40 italic">
                        No written feedback provided.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[var(--bg-main)]/30 rounded-[2.5rem] border border-dashed border-[var(--border-main)]">
                <MessageSquare size={40} className="mx-auto text-[var(--text-muted)] opacity-10 mb-4" />
                <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">No reviews yet for this caregiver</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Booking */}
        <div className="space-y-8">
          <div className="card p-8 sticky top-24 space-y-8 shadow-2xl border-[var(--border-main)] bg-[var(--bg-card)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-700"></div>
            
            <div>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-3">Service Pricing</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-[var(--text-main)] tracking-tighter">₹{caregiver?.rates?.[selectedRate] || 0}</span>
                <span className="text-[var(--text-muted)] mb-2 font-black uppercase tracking-widest text-[10px] opacity-60">/ {selectedRate.replace('ly', '')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)]">
              {['hourly', 'daily', 'weekly', 'monthly'].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSelectedRate(rate)}
                  className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 ${selectedRate === rate ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  {rate}
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
              <button 
                onClick={handleBook}
                disabled={isProcessing || (caregiver?.rates?.[selectedRate] || 0) <= 0}
                className="w-full btn btn-primary flex items-center justify-center gap-3 py-5 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
                {isProcessing ? 'Processing...' : 'Book Now'}
              </button>
              
              <button 
                onClick={() => setShowMessageModal(true)}
                className="w-full py-4 text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:border-primary-500/50 transition-all active:scale-95 shadow-lg"
              >
                <MessageSquare size={18} className="text-primary-600" />
                Message Caregiver
              </button>
            </div>

            <div className="bg-primary-600/5 p-5 rounded-3xl space-y-3 border border-primary-600/10 shadow-inner">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                <ShieldCheck size={16} /> CareConnect Safe
              </div>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-bold italic opacity-60">
                Your payment is protected by our secure escrow system. Funds are only released after service completion.
              </p>
            </div>
          </div>
        </div>
      </div>

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
                    <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Message {caregiver?.name?.split(' ')[0]}</h3>
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
                    placeholder="Introduce yourself and specify your requirements..."
                    className="input min-h-[180px] py-5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-medium resize-none focus:ring-primary-600/20"
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

export default CaregiverDetail;
