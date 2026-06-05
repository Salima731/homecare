import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useUpdatePasswordMutation } from '../../../features/users/userApiSlice';

const SecuritySettings = () => {
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }).unwrap();
      toast.success('Password updated successfully!');
      reset();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="space-y-8">
      <div className="card p-8 space-y-8 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
        <div>
          <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Change Password</h3>
          <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Ensure your account is using a long, random password to stay secure.</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Current Password</label>
            <div className="relative group">
              <input 
                type={showCurrent ? "text" : "password"} 
                {...register('currentPassword', { required: 'Current password is required' })}
                placeholder="••••••••" 
                className="input pr-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20" 
              />
              <button 
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-40 hover:opacity-100 transition-opacity"
              >
                {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Password</label>
            <div className="relative group">
              <input 
                type={showNew ? "text" : "password"} 
                {...register('newPassword', { 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                placeholder="••••••••" 
                className="input pr-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20" 
              />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-40 hover:opacity-100 transition-opacity"
              >
                {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative group">
              <input 
                type={showConfirm ? "text" : "password"} 
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
                placeholder="••••••••" 
                className="input pr-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20" 
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-40 hover:opacity-100 transition-opacity"
              >
                {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="btn btn-primary px-10 py-4 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary-600/40 active:scale-95 transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecuritySettings;
