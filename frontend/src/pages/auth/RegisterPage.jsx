import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, UserPlus, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useRegisterMutation, useSendOTPMutation, useGoogleAuthMutation } from '../../features/auth/authApiSlice';
import { setCredentials } from '../../features/auth/authSlice';
import { GoogleLogin } from '@react-oauth/google';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState(null);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [sendOTP, { isLoading: isSendingOTP }] = useSendOTPMutation();
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const [googleAuth] = useGoogleAuthMutation();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const password = watch('password');
  const role = watch('role');

  const onStep1Submit = async (data) => {
    try {
      await sendOTP(data.email).unwrap();
      setUserData(data);
      setStep(2);
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send OTP');
    }
  };

  const onStep2Submit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast.error('Enter valid 6-digit OTP');

    try {
      const res = await registerUser({ ...userData, otp }).unwrap();
      dispatch(setCredentials({ ...res.data }));
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to register. Invalid OTP.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await googleAuth({ 
        token: credentialResponse.credential,
        role: role || 'user' // default fallback if unselected before google login
      }).unwrap();
      
      dispatch(setCredentials({ ...res.data }));
      toast.success('Google Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || 'Google Auth Failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[var(--bg-main)] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl border border-[var(--border-main)]">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--text-main)]">Create Account</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>

        {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onStep1Submit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User size={18} />
                  </span>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className={`input pl-10 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail size={18} />
                  </span>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    className={`input pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Minimum 6 characters' }
                      })}
                      className={`input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Confirm</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...register('confirmPassword', { 
                        required: 'Please confirm password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">I am a...</label>
                <select
                  {...register('role', { required: 'Please select a role' })}
                  className="input"
                >
                  <option value="user">Individual (Looking for Care)</option>
                  <option value="agency">Agency (Providing Care)</option>
                  <option value="caregiver">Caregiver (Providing Care)</option>
                  <option value="hospital">Hospital</option>
                  <option value="family">Family Member (Monitoring a Patient)</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSendingOTP}
                className="btn btn-primary w-full flex justify-center items-center py-3 text-lg"
              >
                {isSendingOTP ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <UserPlus className="mr-2" size={20} />
                )}
                Continue
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-main)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--bg-card)] text-[var(--text-muted)]">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Login Failed')}
                useOneTap
              />
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={onStep2Submit}>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <Mail className="mx-auto text-primary-500 mb-2" size={32} />
                <h3 className="font-bold text-[var(--text-main)]">Verify your email</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  We've sent a 6-digit code to <strong>{userData.email}</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1 text-center">Enter OTP</label>
                <div className="relative max-w-[200px] mx-auto">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="input pl-10 text-center tracking-widest font-bold text-lg"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-outline flex-1 py-3"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isRegistering || otp.length < 6}
                className="btn btn-primary flex-1 flex justify-center items-center py-3"
              >
                {isRegistering ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <UserPlus className="mr-2" size={20} />
                )}
                Verify & Register
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
