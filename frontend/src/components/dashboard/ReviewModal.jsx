import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2, Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { useCreateReviewMutation } from '../../features/reviews/reviewApiSlice';
import { toast } from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, booking }) => {
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [comment, setComment] = useState('');
  const [ratings, setRatings] = useState({
    punctuality: 5,
    behavior: 5,
    skill: 5,
    cleanliness: 5,
    overall: 5
  });

  const ratingCategories = [
    { id: 'punctuality', label: 'Punctuality' },
    { id: 'behavior', label: 'Behavior' },
    { id: 'skill', label: 'Professionalism & Skill' },
    { id: 'cleanliness', label: 'Cleanliness' },
    { id: 'overall', label: 'Overall Experience' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReview({
        bookingId: booking._id,
        ratings,
        comment
      }).unwrap();
      toast.success('Thank you for your feedback!');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit review');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-main)] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-[var(--border-main)] bg-gradient-to-br from-primary-600/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-600/20 flex items-center justify-center text-primary-600">
                  <Star size={24} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">Rate Your Experience</h2>
                  <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">Caregiver: {booking.caregiver?.name}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-red-500 transition-colors border border-[var(--border-main)]"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Rating Categories */}
            <div className="grid grid-cols-1 gap-6">
              {ratingCategories.map((cat) => (
                <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[var(--bg-main)]/50 border border-[var(--border-main)] hover:border-primary-500/30 transition-all">
                  <div className="space-y-0.5">
                    <p className="font-black text-[var(--text-main)] text-sm">{cat.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">Tap a star to rate</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatings({ ...ratings, [cat.id]: star })}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          size={24} 
                          className={star <= ratings[cat.id] ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-700'}
                          fill={star <= ratings[cat.id] ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <MessageSquare size={14} /> Detailed Feedback (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the service? Tell us more about your experience..."
                className="w-full min-h-[120px] p-5 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] font-bold text-sm focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600 transition-all placeholder:text-[var(--text-muted)]/40"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary-600/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Submit Review
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">
                <ShieldCheck size={14} />
                Your review will be verified and published
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReviewModal;
