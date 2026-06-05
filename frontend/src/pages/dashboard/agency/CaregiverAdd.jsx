import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Phone, Briefcase, DollarSign, Loader2, ArrowLeft, FileText, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAddCaregiverByAgencyMutation } from '../../../features/caregivers/caregiverApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useGetMyAgencyQuery } from '../../../features/agencies/agencyApiSlice';

const CaregiverAdd = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const selectedIdProofs = watch('idProofs');
  const selectedProfileImage = watch('profileImage');
  const [addCaregiver, { isLoading }] = useAddCaregiverByAgencyMutation();
  const { data: agencyData, isLoading: isLoadingAgency, error: agencyError } = useGetMyAgencyQuery();
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'idProofs' && key !== 'profileImage') {
          formData.append(key, data[key]);
        }
      });
      
      if (data.profileImage && data.profileImage.length > 0) {
        formData.append('profileImage', data.profileImage[0]);
      }

      if (data.idProofs && data.idProofs.length > 0) {
        for (let i = 0; i < data.idProofs.length; i++) {
          formData.append('idProofs', data.idProofs[i]);
        }
      }

      await addCaregiver(formData).unwrap();
      toast.success('Caregiver account created successfully!');
      navigate('/dashboard/agency/caregivers');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add caregiver');
    }
  };

  if (isLoadingAgency) return <LoadingSpinner />;

  // If agencyData.data is null, it means the profile doesn't exist yet
  if (!agencyData?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-primary-50 p-6 rounded-full text-primary-600">
          <Briefcase size={64} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Profile Required</h1>
          <p className="text-gray-500 max-w-md mx-auto mt-2">
            You must complete your agency setup before you can add caregivers.
          </p>
        </div>
        <button onClick={() => navigate('/dashboard/agency/setup')} className="btn btn-primary px-8 py-3">
          Complete Setup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-12 h-12 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] rounded-2xl flex items-center justify-center hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-xl active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Add New Caregiver</h1>
          <p className="text-[var(--text-muted)] font-medium">Create a new account and profile for your staff member.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl border border-[var(--border-main)] overflow-hidden">
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <User size={18} />
                </span>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="John Smith"
                />
              </div>
              {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1 mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Initial Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  className="input pl-12 pr-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-primary-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1 mt-1">{errors.password.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Phone size={18} />
                </span>
                <input
                  {...register('phone')}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Specialty */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Specialty</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Briefcase size={18} />
                </span>
                <select
                  {...register('serviceType', { required: 'Required' })}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 appearance-none"
                >
                  <option value="nurse">Nurse</option>
                  <option value="babysitter">Babysitter</option>
                  <option value="elder_care">Elder Care</option>
                  <option value="special_needs">Special Needs</option>
                </select>
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Hourly Rate (₹)</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <DollarSign size={18} />
                </span>
                <input
                  type="number"
                  {...register('hourlyRate', { required: 'Required' })}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="500"
                />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Experience (Years)</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-50 group-focus-within:text-primary-600 group-focus-within:opacity-100 transition-all">
                  <Briefcase size={18} />
                </span>
                <input
                  type="number"
                  {...register('experience', { required: 'Required', min: 0 })}
                  className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Profile Image Section */}
          <div className="pt-10 border-t border-[var(--border-main)]">
            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <User size={20} className="text-primary-600" /> Profile Picture
            </h3>
            <div className={`p-10 rounded-[2rem] border-2 border-dashed transition-all ${selectedProfileImage?.length > 0 ? 'border-primary-500 bg-primary-600/5' : 'border-[var(--border-main)] hover:border-primary-500 bg-[var(--bg-main)]/50'}`}>
              <label className="flex flex-col items-center justify-center cursor-pointer space-y-4">
                {selectedProfileImage?.length > 0 ? (
                  <img src={URL.createObjectURL(selectedProfileImage[0])} alt="Preview" className="w-24 h-24 rounded-[1.5rem] object-cover border-2 border-primary-500 shadow-2xl" />
                ) : (
                  <div className="w-20 h-20 rounded-[1.5rem] bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-center shadow-xl">
                    <User size={36} className="text-[var(--text-muted)] opacity-20" />
                  </div>
                )}
                <div className="text-center">
                  <span className={`text-sm font-black uppercase tracking-widest ${selectedProfileImage?.length > 0 ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>
                    {selectedProfileImage?.length > 0 ? selectedProfileImage[0].name : 'Choose Photo'}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1 opacity-60 uppercase tracking-widest">JPG, PNG, WEBP • Max 5MB</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  {...register('profileImage')}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* ID Proofs Section */}
          <div className="pt-10 border-t border-[var(--border-main)]">
            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <ShieldCheck size={20} className="text-primary-600" /> Security Verification
            </h3>
            <div className={`p-10 rounded-[2rem] border-2 border-dashed transition-all ${selectedIdProofs?.length > 0 ? 'border-primary-500 bg-primary-600/5' : 'border-[var(--border-main)] hover:border-primary-500 bg-[var(--bg-main)]/50'}`}>
              <label className="flex flex-col items-center justify-center cursor-pointer space-y-4">
                <FileText size={40} className={selectedIdProofs?.length > 0 ? 'text-primary-600' : 'text-[var(--text-muted)] opacity-20'} />
                <div className="text-center">
                  <span className={`text-sm font-black uppercase tracking-widest ${selectedIdProofs?.length > 0 ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>
                    {selectedIdProofs?.length > 0 ? `${selectedIdProofs.length} files selected` : 'Upload ID Proofs'}
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1 opacity-60 uppercase tracking-widest">Aadhar, License, etc. • Max 5MB</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  {...register('idProofs')}
                  className="hidden" 
                />
              </label>

              {selectedIdProofs?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-primary-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from(selectedIdProofs).map((file, i) => (
                    <div key={i} className="text-[10px] font-black text-primary-600 flex items-center gap-3 bg-primary-600/5 p-3 rounded-xl border border-primary-600/10 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-main)]/50 px-10 py-6 flex items-center justify-end gap-4 border-t border-[var(--border-main)]">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] px-8 py-3 text-[10px] font-black uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary px-10 py-3 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-600/40 active:scale-95 transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaregiverAdd;
