import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../../features/auth/authApiSlice';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters long');
    }
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setIsSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset password. Link may be expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -ml-64 -mb-64"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 md:p-10 shadow-2xl border-[var(--border-main)] bg-[var(--bg-card)]/80 backdrop-blur-xl relative z-10">
          {!isSuccess ? (
            <div className="space-y-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="w-16 h-16 bg-primary-600/10 text-primary-600 rounded-2xl flex items-center justify-center mb-6 border border-primary-600/20">
                  <ShieldCheck size={32} />
                </div>
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Set New Password</h1>
                <p className="text-[var(--text-muted)] font-medium leading-relaxed">
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] group-focus-within:text-primary-500 transition-colors">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input pl-12 pr-12 h-14 bg-[var(--bg-main)]/50 focus:bg-[var(--bg-main)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-primary-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] group-focus-within:text-primary-500 transition-colors">
                        <ShieldCheck size={18} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input pl-12 pr-12 h-14 bg-[var(--bg-main)]/50 focus:bg-[var(--bg-main)] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary h-14 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20"
                >
                  {isLoading ? 'Updating...' : (
                    <>
                      <Lock size={18} />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-4"
            >
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Success!</h2>
                <p className="text-[var(--text-muted)] font-medium leading-relaxed">
                  Your password has been reset successfully. Redirecting you to the login page in a few seconds...
                </p>
              </div>
              <Link 
                to="/login"
                className="w-full btn btn-primary h-14 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20"
              >
                Go to Login
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
