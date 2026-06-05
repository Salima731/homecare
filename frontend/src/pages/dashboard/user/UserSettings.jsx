import React, { useState } from 'react';
import {
  User, Shield, Bell, Trash2, LogOut,
  ChevronRight, Eye, EyeOff, Loader2,
  Heart, Activity
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import ProfilePage from '../common/ProfilePage';
import PatientHealthProfile from './PatientHealthProfile';
import LogVitals from './LogVitals';
import { logOut } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
    toast.success('Signed out successfully');
  };

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'health', label: 'Health Profile', icon: Heart },
    { id: 'vitals', label: 'Log Vitals', icon: Activity },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':       return <ProfilePage />;
      case 'health':        return <PatientHealthProfile />;
      case 'vitals':        return <LogVitals />;
      case 'security':      return <SecuritySettings />;
      case 'notifications': return <NotificationSettings />;
      default:              return <ProfilePage />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Settings</h1>
        <p className="text-[var(--text-muted)] font-medium">Manage your account, health profile, and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className="card p-3 space-y-1 bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <tab.icon size={20} className={activeTab === tab.id ? 'opacity-100' : 'opacity-60'} />
                  <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
                </div>
                <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-[var(--border-main)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-95"
              >
                <LogOut size={20} />
                <span className="font-black text-xs uppercase tracking-widest">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-9">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// ─── Security Settings ────────────────────────────────────────────────────────
import {
  useUpdatePasswordMutation,
  useUpdateNotificationSettingsMutation
} from '../../../features/users/userApiSlice';
import { setCredentials } from '../../../features/auth/authSlice';

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
          {[
            { label: 'Current Password', field: 'currentPassword', show: showCurrent, toggle: () => setShowCurrent(!showCurrent), rules: { required: 'Current password is required' } },
            { label: 'New Password', field: 'newPassword', show: showNew, toggle: () => setShowNew(!showNew), rules: { required: 'New password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } } },
            { label: 'Confirm New Password', field: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(!showConfirm), rules: { required: 'Please confirm your password', validate: (v) => v === newPassword || 'Passwords do not match' } },
          ].map(({ label, field, show, toggle, rules }) => (
            <div key={field} className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">{label}</label>
              <div className="relative group">
                <input
                  type={show ? 'text' : 'password'}
                  {...register(field, rules)}
                  placeholder="••••••••"
                  className="input pr-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                />
                <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-40 hover:opacity-100 transition-opacity">
                  {show ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {errors[field] && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1">{errors[field].message}</p>}
            </div>
          ))}

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

      <div className="card p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-red-500/20 bg-red-500/5 shadow-xl">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center justify-center md:justify-start gap-3">
            <Trash2 className="text-red-500" size={24} /> Delete Account
          </h3>
          <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Once you delete your account, there is no going back. Please be certain.</p>
        </div>
        <button className="btn border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
          Delete My Account
        </button>
      </div>
    </div>
  );
};

// ─── Notification Settings ────────────────────────────────────────────────────
const NotificationSettings = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [updateSettings, { isLoading }] = useUpdateNotificationSettingsMutation();

  const handleToggle = async (key, value) => {
    try {
      const newSettings = { ...user?.notificationSettings, [key]: value };
      await updateSettings(newSettings).unwrap();
      dispatch(setCredentials({ user: { ...user, notificationSettings: newSettings }, token: localStorage.getItem('token') }));
      toast.success('Preferences updated');
    } catch {
      toast.error('Failed to update preferences');
    }
  };

  const items = [
    { id: 'bookingConfirmations', title: 'Booking Confirmations', desc: 'Get notified when a caregiver accepts your booking.' },
    { id: 'messages', title: 'New Messages', desc: 'Email alerts for new messages in your inbox.' },
    { id: 'exclusiveOffers', title: 'Exclusive Offers', desc: 'Occasional emails about discounts and new services.' },
    { id: 'securityAlerts', title: 'Security Alerts', desc: 'Important alerts regarding your account security.' },
  ];

  return (
    <div className="card p-8 space-y-10 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--bg-card)]/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      )}
      <div>
        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Email Notifications</h3>
        <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Control when and how you receive updates via email.</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl bg-[var(--bg-main)]/50 border border-[var(--border-main)] hover:border-primary-500/30 transition-all group">
            <div className="space-y-1">
              <p className="font-black text-[var(--text-main)] group-hover:text-primary-600 transition-colors text-sm">{item.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={user?.notificationSettings?.[item.id] !== false}
                onChange={(e) => handleToggle(item.id, e.target.checked)}
              />
              <div className="w-12 h-7 bg-[var(--border-main)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSettings;
