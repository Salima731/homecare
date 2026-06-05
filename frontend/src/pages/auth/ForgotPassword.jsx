import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../features/auth/authApiSlice';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    try {
      await forgotPassword(email).unwrap();
      setIsSubmitted(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err?.data?.message || 'Something went wrong. Please try again.');
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
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] hover:text-primary-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>

          {!isSubmitted ? (
            <div className="space-y-8">
              <div className="space-y-3 text-center md:text-left">
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Forgot Password?</h1>
                <p className="text-[var(--text-muted)] font-medium leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] group-focus-within:text-primary-500 transition-colors">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="input pl-12 h-14 bg-[var(--bg-main)]/50 focus:bg-[var(--bg-main)] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary h-14 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20"
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      <Send size={18} />
                      Send Reset Link
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
                <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Check your email</h2>
                <p className="text-[var(--text-muted)] font-medium leading-relaxed">
                  We've sent a password reset link to <span className="text-[var(--text-main)] font-bold">{email}</span>. Please check your inbox and spam folder.
                </p>
              </div>
              <div className="pt-4 flex flex-col gap-4">
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm font-bold text-primary-600 hover:underline"
                >
                  Didn't receive the email? Try again
                </button>
                <div className="p-4 bg-primary-100/5 rounded-2xl border border-primary-500/10 flex items-start gap-3 text-left">
                  <AlertCircle size={18} className="text-primary-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed uppercase tracking-wider">
                    Link expires in 60 minutes for security reasons.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
