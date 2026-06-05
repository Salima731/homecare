import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Filter, Star, Clock, Heart, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetCaregiversQuery } from '../../../features/caregivers/caregiverApiSlice';
import { useGetFavoritesQuery, useToggleFavoriteMutation } from '../../../features/users/userApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CaregiverSearch = () => {
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    serviceType: '',
    minRating: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: response, isLoading, error } = useGetCaregiversQuery(filters);
  const data = response?.data || [];
  
  const { data: favsResponse } = useGetFavoritesQuery();
  const favorites = favsResponse?.data || [];
  const [toggleFavorite, { isLoading: isTogglingFav }] = useToggleFavoriteMutation();
  
  console.log('📡 API Request Filters:', filters);
  console.log('📡 Full API Response:', response);
  console.log('🔍 Extracted Data:', data);
  if (error) console.error('❌ API Error:', error);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Find Your Caregiver</h1>
          <p className="text-[var(--text-muted)] font-medium mt-1">Discover verified professionals who match your needs.</p>
        </div>
      </div>

      {/* Search Bar & Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)]">
            <Search size={20} />
          </span>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name or skills..."
            className="input pl-12 w-full h-14 bg-[var(--bg-card)] border-[var(--border-main)] focus:border-primary-600/50 transition-all text-[var(--text-main)] font-medium"
          />
        </div>
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)]">
            <MapPin size={20} />
          </span>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            placeholder="City..."
            className="input pl-12 w-full h-14 bg-[var(--bg-card)] border-[var(--border-main)] focus:border-primary-600/50 transition-all text-[var(--text-main)] font-medium"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`btn flex items-center justify-center gap-3 h-14 px-8 font-black uppercase tracking-widest text-[10px] transition-all ${showFilters ? 'btn-primary' : 'btn-outline border-[var(--border-main)] text-[var(--text-main)] hover:bg-primary-600/10'}`}
        >
          <SlidersHorizontal size={18} /> Filters
        </button>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card bg-[var(--bg-main)]/50 border-[var(--border-main)] grid grid-cols-1 md:grid-cols-3 gap-8 p-8 rounded-3xl">
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Service Role</label>
                <select 
                  name="serviceType"
                  value={filters.serviceType}
                  onChange={handleFilterChange}
                  className="input bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] font-bold text-sm"
                >
                  <option value="">All Services</option>
                  <option value="nurse">Registered Nurse</option>
                  <option value="elder_care">Elderly Care</option>
                  <option value="babysitter">Babysitter</option>
                  <option value="special_needs">Special Needs</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Minimum Rating</label>
                <div className="flex items-center gap-3 mt-1">
                  {[4, 4.5, 4.8].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${filters.minRating === rating ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/20' : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-main)] hover:border-primary-600/50'}`}
                    >
                      {rating}+
                    </button>
                  ))}
                  <button 
                    onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                    className="text-[10px] text-primary-600 font-black uppercase tracking-widest hover:underline ml-auto"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Availability</label>
                <select className="input bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)] font-bold text-sm">
                  <option>Full Time</option>
                  <option>Part Time</option>
                  <option>On Demand</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-center py-20 card bg-red-500/10 border-red-500/20 rounded-3xl">
          <Search size={64} className="mx-auto text-red-500/40 mb-6" />
          <h3 className="text-2xl font-black text-red-500 tracking-tight">Search Error</h3>
          <p className="text-[var(--text-muted)] mt-2 font-medium">{error?.data?.message || 'Failed to fetch caregivers. Please try again later.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-8 px-8 py-3 font-black uppercase tracking-widest text-xs"
          >
            Retry Search
          </button>
        </div>
      ) : data?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((caregiver) => (
            <motion.div
              key={caregiver._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card group hover:shadow-2xl transition-all duration-500 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] flex flex-col rounded-3xl"
            >
              {/* Caregiver Image & Trust Score */}
              <div className="relative h-60 bg-[var(--bg-main)]">
                <img 
                  src={caregiver.profileImage?.url || `https://i.pravatar.cc/300?u=${caregiver._id}`} 
                  alt={caregiver.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)]/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute top-4 right-4 bg-[var(--bg-card)]/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-[var(--border-main)]">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-black text-[var(--text-main)]">{caregiver.avgRating || '0'}</span>
                </div>
                {caregiver.trustScore?.score > 80 && (
                  <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase shadow-lg shadow-primary-600/30">
                    Trusted
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 flex-grow space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[var(--text-main)] leading-tight group-hover:text-primary-600 transition-colors">{caregiver.name}</h3>
                  <p className="text-[10px] text-primary-600 font-black uppercase tracking-[0.2em]">
                    {(caregiver.serviceType || 'Caregiver').replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary-600" /> {caregiver.location?.city || 'Remote'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-primary-600" /> {caregiver.experience || '0'} Years Exp.
                  </div>
                </div>

                <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed font-medium">
                  {caregiver.bio || 'Professional caregiver dedicated to providing high-quality support and assistance.'}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-[var(--border-main)] mt-auto">
                  <div>
                    <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">₹{caregiver.rates?.hourly || 0}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest ml-1">/ hr</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={async () => {
                        try {
                          const res = await toggleFavorite(caregiver._id).unwrap();
                          toast.success(res.message || 'Updated favorites');
                        } catch (err) {
                          toast.error('Failed to update favorites');
                        }
                      }}
                      disabled={isTogglingFav}
                      className={`p-3 rounded-2xl transition-all active:scale-90 border border-[var(--border-main)] ${favorites.some(f => (f._id || f) === caregiver._id) ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30'} ${isTogglingFav ? 'opacity-50' : ''}`}
                    >
                      <Heart size={20} strokeWidth={2.5} fill={favorites.some(f => (f._id || f) === caregiver._id) ? 'currentColor' : 'none'} />
                    </button>
                    <Link 
                      to={`/dashboard/user/caregivers/${caregiver._id}`}
                      className="btn btn-primary py-3 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 card bg-[var(--bg-card)] border-dashed border-2 border-[var(--border-main)] rounded-3xl shadow-xl">
          <Search size={80} className="mx-auto text-[var(--text-muted)] opacity-10 mb-6" />
          <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight">No Caregivers Found</h3>
          <p className="text-[var(--text-muted)] mt-2 font-medium max-w-sm mx-auto">Try adjusting your filters or location to see more results.</p>
          <button 
            onClick={() => setFilters({ search: '', city: '', serviceType: '', minRating: 0 })}
            className="btn btn-outline mt-10 px-8 py-3 font-black uppercase tracking-widest text-xs border-[var(--border-main)] text-[var(--text-main)] hover:bg-primary-600/10"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CaregiverSearch;
