import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, Bell, Save,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SecuritySettings from '../../common/SecuritySettings';

const DoctorSettings = () => {
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
    { name: 'Notifications', icon: <Bell size={18} /> }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Settings</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage your account preferences and security</p>
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
        {/* Navigation Sidebar (Local) */}
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
          {activeTab === 'Change Password' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-8">
              <SecuritySettings />
            </motion.div>
          )}

          {activeTab === 'Notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-[var(--border-main)] pb-4">
                <Bell className="text-primary-600" size={24} />
                <h3 className="text-xl font-black text-[var(--text-main)]">Notifications</h3>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'New Appointment Requests', desc: 'Get notified when a patient requests an appointment.' },
                  { title: 'Upcoming Appointments', desc: 'Reminders for your scheduled consultations today.' },
                  { title: 'Platform Updates', desc: 'News about updates to the hospital system.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-[var(--bg-main)] rounded-2xl transition-colors group">
                    <div className="space-y-1">
                      <p className="font-bold text-[var(--text-main)] group-hover:text-primary-600 transition-colors">{item.title}</p>
                      <p className="text-xs text-[var(--text-muted)] font-medium">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorSettings;
