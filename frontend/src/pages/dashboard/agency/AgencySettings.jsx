import React, { useState } from 'react';
import { 
  Building2, Shield, Bell, CreditCard, 
  ChevronRight, Lock, Save, Loader2, LogOut
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logOut } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../common/ProfilePage';
import SecuritySettings from '../common/SecuritySettings'; // I'll extract this or reuse
import { toast } from 'react-hot-toast';

const AgencySettings = () => {
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
    { id: 'profile', label: 'Agency Profile', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfilePage />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <ProfilePage />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Agency Settings</h1>
        <p className="text-[var(--text-muted)] font-medium">Manage your agency profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className="card p-3 space-y-2 bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl">
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

// Internal Components (Simplified for now, similar to UserSettings)
const NotificationSettings = () => {
  return (
    <div className="card p-8 space-y-10 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
      <div>
        <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Agency Notifications</h3>
        <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Control alerts for bookings, payments, and caregiver updates.</p>
      </div>
      <div className="space-y-4">
        {[
          { title: 'New Booking Requests', desc: 'Get notified when a user requests a service.' },
          { title: 'Caregiver Punctuality', desc: 'Alerts when caregivers clock in late.' },
          { title: 'Payout Success', desc: 'Notifications for successful bank transfers.' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-[var(--bg-main)]/50 border border-[var(--border-main)] hover:border-primary-500/30 transition-all group">
            <div className="space-y-1">
              <p className="font-black text-[var(--text-main)] group-hover:text-primary-600 transition-colors text-sm">{item.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-12 h-7 bg-[var(--border-main)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 shadow-inner"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencySettings;
