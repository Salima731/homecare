import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Filter, ThumbsUp, ChevronDown, X } from 'lucide-react';
import { useGetMyReviewsQuery } from '../../../features/caregivers/caregiverApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const StarRow = ({ value = 0 }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className="text-amber-400"
        fill={i < Math.round(value) ? 'currentColor' : 'none'}
      />
    ))}
  </div>
);

const SubRatingBar = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-[var(--text-main)]">{value > 0 ? value.toFixed(1) : '—'}</p>
    </div>
    <div className="h-1.5 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / 5) * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  </div>
);

const CaregiverReviews = () => {
  const { data: response, isLoading, refetch } = useGetMyReviewsQuery();
  const reviews = response?.data || [];

  const [filterRating, setFilterRating] = useState(0); // 0 = all
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest'

  React.useEffect(() => { refetch(); }, [refetch]);

  if (isLoading) return <LoadingSpinner />;

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.ratings?.overall || 0), 0) / reviews.length)
    : 0;

  const avg = (key) => reviews.length > 0
    ? reviews.reduce((acc, r) => acc + (r.ratings?.[key] || 0), 0) / reviews.length
    : 0;

  const subRatings = [
    { label: 'Punctuality', value: avg('punctuality'), color: 'bg-green-500' },
    { label: 'Behavior',    value: avg('behavior'),    color: 'bg-blue-500' },
    { label: 'Skill Level', value: avg('skill'),       color: 'bg-amber-500' },
    { label: 'Hygiene',     value: avg('cleanliness'), color: 'bg-primary-500' },
  ];

  // ── Filter & Sort ───────────────────────────────────────────────────────────
  let displayedReviews = [...reviews];
  if (filterRating > 0) {
    displayedReviews = displayedReviews.filter(r => Math.round(r.ratings?.overall || 0) === filterRating);
  }
  if (sortBy === 'newest')  displayedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === 'highest') displayedReviews.sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0));
  if (sortBy === 'lowest')  displayedReviews.sort((a, b) => (a.ratings?.overall || 0) - (b.ratings?.overall || 0));

  // ── Rating distribution ─────────────────────────────────────────────────────
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.ratings?.overall || 0) === star).length,
    pct: reviews.length > 0
      ? (reviews.filter(r => Math.round(r.ratings?.overall || 0) === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">My Reviews</h1>
          <p className="text-[var(--text-muted)] font-medium">Hear what clients say about your service</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Rating Card */}
        <div className="card p-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xl shadow-primary-900/20 border-0 space-y-4">
          <p className="text-primary-100 text-[10px] font-black uppercase tracking-widest">Average Rating</p>
          <div className="flex items-end gap-3">
            <h2 className="text-5xl font-black">{avgRating.toFixed(1)}</h2>
            <div className="mb-2">
              <StarRow value={avgRating} />
            </div>
          </div>
          <p className="text-primary-100 text-sm font-medium">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>

          {/* Rating Distribution */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2 text-[10px]">
                <span className="w-3 text-primary-200 font-black">{star}</span>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-white/80 rounded-full"
                  />
                </div>
                <span className="w-3 text-primary-200 font-black text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Ratings */}
        <div className="md:col-span-2 card p-8 bg-[var(--bg-card)] border border-[var(--border-main)] grid grid-cols-2 gap-6 content-center">
          {subRatings.map(r => (
            <SubRatingBar key={r.label} {...r} />
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-[var(--text-main)]">
            Recent Feedback
            {filterRating > 0 && (
              <span className="ml-3 text-sm font-bold text-primary-600">({filterRating}★ filter active)</span>
            )}
          </h3>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(o => !o)}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border transition-all ${
                isFilterOpen || filterRating > 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'text-[var(--text-muted)] border-[var(--border-main)] hover:text-primary-600 hover:border-primary-500/40 bg-[var(--bg-card)]'
              }`}
            >
              <Filter size={16} /> Filter Reviews
              {filterRating > 0 && (
                <span className="w-5 h-5 bg-white text-primary-600 rounded-full text-[10px] font-black flex items-center justify-center">{filterRating}</span>
              )}
              <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-4 space-y-4 z-30"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Filter by Stars</p>
                    {[5, 4, 3, 2, 1, 0].map(s => (
                      <button
                        key={s}
                        onClick={() => { setFilterRating(s); setIsFilterOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                          filterRating === s
                            ? 'bg-primary-600 text-white'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                        }`}
                      >
                        {s === 0 ? (
                          <span className="text-[10px] uppercase tracking-widest">All Ratings</span>
                        ) : (
                          <>
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            {s} Star{s !== 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1 border-t border-[var(--border-main)] pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Sort by</p>
                    {[
                      { key: 'newest',  label: 'Newest First' },
                      { key: 'highest', label: 'Highest Rated' },
                      { key: 'lowest',  label: 'Lowest Rated' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortBy(opt.key); setIsFilterOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                          sortBy === opt.key
                            ? 'bg-primary-600 text-white'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {(filterRating > 0 || sortBy !== 'newest') && (
                    <button
                      onClick={() => { setFilterRating(0); setSortBy('newest'); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-red-500 hover:bg-red-500/10 transition-all border border-dashed border-red-500/30 uppercase tracking-widest"
                    >
                      <X size={12} /> Clear Filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {displayedReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedReviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 space-y-5 hover:shadow-xl transition-all bg-[var(--bg-card)] border border-[var(--border-main)] border-t-4 border-t-primary-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center font-black text-primary-600">
                      {review.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-main)]">{review.user?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <StarRow value={review.ratings?.overall || 0} />
                </div>

                <p className="text-[var(--text-muted)] leading-relaxed font-medium italic">
                  "{review.comment}"
                </p>

                {/* Sub-ratings if present */}
                {(review.ratings?.punctuality || review.ratings?.behavior) && (
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { key: 'punctuality', label: 'Punctuality' },
                      { key: 'behavior',    label: 'Behavior'    },
                      { key: 'skill',       label: 'Skill'       },
                      { key: 'cleanliness', label: 'Hygiene'     },
                    ].map(({ key, label }) => review.ratings?.[key] ? (
                      <div key={key} className="flex items-center gap-1.5 bg-[var(--bg-main)] rounded-lg px-2.5 py-1.5 border border-[var(--border-main)]">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="font-black text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
                        <span className="ml-auto font-black text-[var(--text-main)]">{review.ratings[key].toFixed(1)}</span>
                      </div>
                    ) : null)}
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--border-main)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--text-muted)]">
                    <ThumbsUp size={12} className="text-green-500" /> Helpful
                  </div>
                  <span className="text-[10px] font-black uppercase text-primary-600 bg-primary-600/10 border border-primary-500/20 px-2.5 py-1 rounded-lg tracking-wider">
                    ✓ Verified Care
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-20 text-center space-y-6 bg-[var(--bg-card)] border border-[var(--border-main)]">
            <div className="w-20 h-20 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto border border-dashed border-[var(--border-main)]">
              <MessageSquare size={32} className="text-[var(--text-muted)] opacity-30" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                {filterRating > 0 ? `No ${filterRating}★ reviews found` : 'No Reviews Yet'}
              </h2>
              <p className="text-[var(--text-muted)] max-w-sm mx-auto mt-2">
                {filterRating > 0
                  ? 'Try a different star rating filter.'
                  : 'Complete your assigned jobs to start receiving feedback from clients.'}
              </p>
              {filterRating > 0 && (
                <button
                  onClick={() => setFilterRating(0)}
                  className="mt-4 btn btn-outline text-xs font-black uppercase tracking-widest text-[var(--text-main)] border-[var(--border-main)]"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaregiverReviews;
