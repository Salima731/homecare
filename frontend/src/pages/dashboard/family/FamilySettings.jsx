import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Bell, Shield, Save, Eye, EyeOff,
  Heart, UserCheck, AlertTriangle, MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SecuritySettings from '../common/SecuritySettings';

const FamilySettings = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Change Password');

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings updated successfully!');
    }, 1000);
  };

  const tabs = [
    { name: 'Change Password', icon: <Lock size={18} /> },
    { name: 'Notifications', icon: <Bell size={18} /> },
    { name: 'Privacy', icon: <Shield size={18} /> },
  ];

  const notificationItems = [
    { title: 'Health Alerts', desc: 'Get notified about critical health changes for your family member.', default: true },
    { title: 'Care Reports', desc: 'Receive daily care activity summaries from the caregiver.', default: true },
    { title: 'Emergency SOS', desc: 'Instant alerts when an emergency SOS is triggered.', default: true },
    { title: 'Medication Reminders', desc: 'Reminders when medications are due or administered.', default: true },
    { title: 'Booking Updates', desc: 'Notifications for caregiver booking status changes.', default: false },
    { title: 'Platform News', desc: 'Occasional updates about new features and tips.', default: false },
  ];

  const privacyItems = [
    { title: 'Share Health Data with Doctor', desc: 'Allow doctors to view the patient\'s health reports directly.', default: true },
    { title: 'Show Caregiver Attendance', desc: 'Let the agency track caregiver attendance and hours.', default: true },
    { title: 'Allow Data Analytics', desc: 'Help us improve with anonymised usage data.', default: false },
    { title: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account login.', default: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Settings</h1>
          <p className="text-[var(--text-muted)] font-medium">
            Manage your account preferences, notifications, and security
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary flex items-center gap-2 px-8 py-3"
        >
          {loading ? 'Saving...' : (
            <>
              <Save size={18} /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tab Navigation */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${
                activeTab === tab.name
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20 translate-x-2'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:translate-x-1'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Change Password Tab */}
          {activeTab === 'Change Password' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 space-y-8"
            >
              <SecuritySettings />
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 space-y-8"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-4">
                <Bell className="text-primary-600" size={24} />
                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">Notification Preferences</h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                    Choose which updates you'd like to receive
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {notificationItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 hover:bg-[var(--bg-main)] rounded-2xl transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--text-main)] group-hover:text-primary-600 transition-colors text-sm">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={item.default}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'Privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 space-y-8"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-4">
                <Shield className="text-primary-600" size={24} />
                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">Privacy & Security</h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                    Control how your data is shared and protected
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {privacyItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 hover:bg-[var(--bg-main)] rounded-2xl transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-[var(--text-main)] group-hover:text-primary-600 transition-colors text-sm">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={item.default}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                ))}
              </div>

              {/* Data Deletion Warning */}
              <div className="p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-black text-red-700 dark:text-red-400 text-sm">Delete Account</p>
                  <p className="text-xs text-red-500 font-medium mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="mt-3 text-xs font-black text-red-600 hover:text-red-700 underline underline-offset-2 transition-colors">
                    Request Account Deletion
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FamilySettings;
