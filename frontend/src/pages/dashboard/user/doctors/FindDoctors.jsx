import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, User } from 'lucide-react';
import { useGetPublicDoctorsQuery } from '../../../../features/doctors/doctorApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const FindDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const navigate = useNavigate();

  // Simple debounce
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response, isLoading } = useGetPublicDoctorsQuery({ search: debouncedSearch });
  const doctors = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Find Doctors</h1>
          <p className="text-[var(--text-muted)] font-medium">Book appointments with top specialists</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pr-10 w-full rounded-2xl"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)]">
          <User size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
          <p className="text-lg font-bold text-[var(--text-main)]">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.map((doctor, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={doctor._id}
              className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/dashboard/user/doctors/${doctor._id}`)}
            >
              <div className="aspect-[4/3] bg-primary-50 relative overflow-hidden flex items-center justify-center text-primary-300">
                {doctor.profileImage?.url ? (
                  <img 
                    src={doctor.profileImage.url} 
                    alt={doctor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <User size={64} className="opacity-50" />
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[10px] font-black uppercase px-2 py-1 rounded-lg text-primary-700 shadow-sm">
                  {doctor.department?.name || doctor.specialization}
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="font-black text-lg text-[var(--text-main)] group-hover:text-primary-600 transition-colors">Dr. {doctor.name}</h3>
                <p className="text-sm font-bold text-[var(--text-muted)]">{doctor.specialization}</p>
                
                <div className="mt-4 pt-4 border-t border-[var(--border-main)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <MapPin size={14} className="text-primary-500" />
                    <span className="truncate">{doctor.hospital?.hospitalName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span>{doctor.experience} Years Experience</span>
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

export default FindDoctors;
