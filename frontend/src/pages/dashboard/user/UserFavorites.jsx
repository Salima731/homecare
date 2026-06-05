import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Clock, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../../../features/users/userApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const UserFavorites = () => {
  const { data: response, isLoading, error } = useGetFavoritesQuery();
  const [toggleFavorite, { isLoading: isTogglingFav }] = useToggleFavoriteMutation();
  const favorites = response?.data || [];

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 animate-in fade-in">
        <AlertCircle size={64} className="text-red-500 opacity-20" />
        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Failed to load favorites</h2>
        <p className="text-[var(--text-muted)] font-medium">Please check your connection or try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Heart className="text-red-500" fill="currentColor" /> Saved Caregivers
        </h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your list of favorite professionals.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-8 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Heart size={32} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">No favorites yet</h2>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mt-2">
              You haven't saved any caregivers yet. Start exploring and click the heart icon to save them here for later.
            </p>
          </div>
          <Link to="/dashboard/user/caregivers" className="btn btn-primary px-8 mt-4">
            Explore Caregivers
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {favorites.map((caregiver, index) => (
            <motion.div
              key={caregiver._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative z-10 border-4 border-[var(--bg-card)] shadow-sm">
                <img 
                  src={caregiver.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(caregiver.name)}&background=0D8ABC&color=fff`} 
                  alt={caregiver.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)]">{caregiver.name}</h3>
                    <p className="text-sm text-primary-600 font-bold uppercase tracking-wider mt-1">
                      {(caregiver.serviceType || 'Caregiver').replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">{caregiver.avgRating || 'New'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} /> {caregiver.location?.city || 'Remote'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} /> {caregiver.experience || '0'} Years Exp.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-main)]">
                  <div>
                    <span className="text-lg font-bold text-[var(--text-main)]">₹{caregiver.rates?.hourly || 0}</span>
                    <span className="text-xs text-[var(--text-muted)]">/hr</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          await toggleFavorite(caregiver._id).unwrap();
                          toast.success('Removed from favorites');
                        } catch (err) {
                          toast.error('Failed to remove');
                        }
                      }}
                      disabled={isTogglingFav}
                      className={`p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors ${isTogglingFav ? 'opacity-50' : ''}`}
                    >
                      <Heart size={20} fill="currentColor" />
                    </button>
                    <Link 
                      to={`/dashboard/user/caregivers/${caregiver._id}`}
                      className="btn btn-primary py-2 px-4 text-sm"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserFavorites;
