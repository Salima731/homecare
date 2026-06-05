import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Award, Calendar, DollarSign, Clock } from 'lucide-react';
import { useGetDoctorPublicProfileQuery } from '../../../../features/doctors/doctorApiSlice';
import { useCreateAppointmentMutation } from '../../../../features/appointments/appointmentApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DoctorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading } = useGetDoctorPublicProfileQuery(id);
  const [createAppointment, { isLoading: isBooking }] = useCreateAppointmentMutation();
  
  const [appointmentDate, setAppointmentDate] = useState('');
  const [reason, setReason] = useState('');

  const doctor = response?.data;

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await createAppointment({ doctorId: doctor._id, appointmentDate, reason }).unwrap();
      toast.success('Appointment requested successfully');
      navigate('/dashboard/user/appointments');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to book appointment');
    }
  };

  if (isLoading) return <LoadingSpinner fullPage />;

  if (!doctor) return (
    <div className="text-center py-20"><p>Doctor not found</p></div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Search
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left shadow-sm">
            <div className="w-32 h-32 rounded-2xl bg-primary-100 flex-shrink-0 overflow-hidden shadow-inner border-2 border-primary-500/10">
              {doctor.profileImage?.url ? (
                <img src={doctor.profileImage.url} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-500 font-black text-4xl">
                  {doctor.name?.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <span className="px-3 py-1 bg-primary-500/10 text-primary-600 rounded-lg text-xs font-black uppercase tracking-widest">
                {doctor.department?.name || 'General'}
              </span>
              <h1 className="text-3xl font-black text-[var(--text-main)] mt-3">Dr. {doctor.name}</h1>
              <p className="text-lg font-bold text-[var(--text-muted)] mt-1">{doctor.specialization}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2 rounded-xl text-sm font-bold text-[var(--text-main)]">
                  <Award size={16} className="text-amber-500" /> {doctor.experience} Years
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-main)] px-4 py-2 rounded-xl text-sm font-bold text-[var(--text-main)]">
                  <MapPin size={16} className="text-sky-500" /> {doctor.hospital?.hospitalName}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] p-8 shadow-sm">
            <h3 className="text-lg font-black mb-4">About Doctor</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">{doctor.bio || 'No biography provided yet.'}</p>
            
            {doctor.qualification?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Qualifications</h4>
                <div className="flex flex-wrap gap-2">
                  {doctor.qualification.map((q, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[var(--bg-main)] rounded-lg text-xs font-bold border border-[var(--border-main)]">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Card */}
        <div className="md:col-span-1">
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] p-6 shadow-xl shadow-primary-900/5 sticky top-24">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Calendar className="text-primary-500" /> Book Appointment
            </h3>
            
            <div className="flex justify-between items-center p-4 bg-[var(--bg-main)] rounded-2xl mb-6">
              <span className="text-sm font-bold text-[var(--text-muted)]">Consultation Fee</span>
              <span className="text-xl font-black text-emerald-600 flex items-center">
                <DollarSign size={20} />{doctor.consultationFee || 0}
              </span>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="input w-full bg-[var(--bg-main)]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Reason for Visit</label>
                <textarea
                  required
                  placeholder="Briefly describe your symptoms..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input w-full bg-[var(--bg-main)] resize-none h-24"
                />
              </div>
              <button
                type="submit"
                disabled={isBooking}
                className="w-full btn btn-primary py-4 text-base shadow-lg shadow-primary-500/25 mt-2"
              >
                {isBooking ? 'Requesting...' : 'Request Appointment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPublicProfile;
