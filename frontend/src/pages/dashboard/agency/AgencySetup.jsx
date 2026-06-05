import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, Phone, Globe, MapPin, FileText, Loader2 } from 'lucide-react';
import { useRegisterAgencyMutation } from '../../../features/agencies/agencyApiSlice';

const AgencySetup = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [registerAgency, { isLoading }] = useRegisterAgencyMutation();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerAgency(data).unwrap();
      toast.success('Agency profile submitted! Awaiting admin approval.');
      navigate('/dashboard/agency');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to register agency');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Agency Registration</h1>
        <p className="text-[var(--text-muted)] font-medium">Provide your agency details to start providing care services.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-8 shadow-2xl border border-[var(--border-main)] bg-[var(--bg-card)] rounded-[2.5rem]">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Agency Name</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                <Building2 size={18} />
              </span>
              <input
                {...register('agencyName', { required: 'Agency name is required' })}
                className={`input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 ${errors.agencyName ? 'border-red-500' : ''}`}
                placeholder="Elite Home Care"
              />
            </div>
            {errors.agencyName && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1 mt-1">{errors.agencyName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">License Number</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                <FileText size={18} />
              </span>
              <input
                {...register('licenseNumber', { required: 'License number is required' })}
                className={`input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 ${errors.licenseNumber ? 'border-red-500' : ''}`}
                placeholder="LNC-2026-XXXX"
              />
            </div>
            {errors.licenseNumber && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1 mt-1">{errors.licenseNumber.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Phone size={18} />
                </span>
                <input
                  {...register('phone', { required: 'Phone is required' })}
                  className={`input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Website (Optional)</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Globe size={18} />
                </span>
                <input
                  {...register('website')}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="https://agency.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Address</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                <MapPin size={18} />
              </span>
              <input
                {...register('address', { required: 'Address is required' })}
                className={`input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 ${errors.address ? 'border-red-500' : ''}`}
                placeholder="123 Care St, City, State"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Agency Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              className="input min-h-[140px] py-4 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
              placeholder="Tell us about your agency, services provided, and experience..."
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-600/40 active:scale-[0.98] transition-all"
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
};

export default AgencySetup;
