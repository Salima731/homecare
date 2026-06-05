import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLoginMutation, useGoogleAuthMutation } from '../../features/auth/authApiSlice';
import { setCredentials, selectCurrentUser } from '../../features/auth/authSlice';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth] = useGoogleAuthMutation();
  const [showPassword, setShowPassword] = React.useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials({ ...res.data }));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to login');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await googleAuth({ 
        token: credentialResponse.credential
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
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--text-main)]">Welcome Back</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password', { required: 'Password is required' })}
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-[var(--border-main)] rounded bg-[var(--bg-main)]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--text-main)]">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" size="sm" className="font-bold text-primary-600 hover:text-primary-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center items-center py-3 text-lg"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <LogIn className="mr-2" size={20} />
              )}
              Sign In
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
              theme="outline"
              shape="pill"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
