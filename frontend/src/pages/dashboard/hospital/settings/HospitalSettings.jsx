import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Bell, Key, Layout, Check, Volume2, Database, ShieldAlert, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const HospitalSettings = () => {
  // Local storage keys for persisting settings
  const STORAGE_KEY_NOTIF = 'careconnect_hospital_notif_settings';
  const STORAGE_KEY_DISPLAY = 'careconnect_hospital_display_settings';
  const STORAGE_KEY_EHR = 'careconnect_hospital_ehr_token';

  // State
  const [activeTab, setActiveTab] = useState('notifications');
  const [copied, setCopied] = useState(false);

  // Notification Preferences
  const [notifSettings, setNotifSettings] = useState({
    emailOnSOS: true,
    emailOnReferralUpdate: true,
    emailOnMedicationMiss: true,
    soundAlertOnSOS: true,
    inAppNotif: true
  });

  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    defaultPageSize: '10',
    highContrastSOS: true,
    showDashboardTips: true
  });

  // EHR Integration Token
  const [ehrToken, setEhrToken] = useState('');

  // Load settings on mount
  useEffect(() => {
    const savedNotif = localStorage.getItem(STORAGE_KEY_NOTIF);
    if (savedNotif) {
      try {
        setNotifSettings(JSON.parse(savedNotif));
      } catch (e) {
        console.error(e);
      }
    }

    const savedDisplay = localStorage.getItem(STORAGE_KEY_DISPLAY);
    if (savedDisplay) {
      try {
        setDisplaySettings(JSON.parse(savedDisplay));
      } catch (e) {
        console.error(e);
      }
    }

    const savedToken = localStorage.getItem(STORAGE_KEY_EHR);
    if (savedToken) {
      setEhrToken(savedToken);
    } else {
      // Generate a mock initial EHR token for demo
      const initialToken = 'cc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setEhrToken(initialToken);
      localStorage.setItem(STORAGE_KEY_EHR, initialToken);
    }
  }, []);

  const handleNotifToggle = (key) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDisplayChange = (key, value) => {
    setDisplaySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY_NOTIF, JSON.stringify(notifSettings));
    toast.success('Notification preferences updated!');
  };

  const handleSaveDisplay = (e) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY_DISPLAY, JSON.stringify(displaySettings));
    toast.success('Display configurations applied!');
  };

  const handleRegenerateToken = () => {
    const newToken = 'cc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setEhrToken(newToken);
    localStorage.setItem(STORAGE_KEY_EHR, newToken);
    toast.success('EHR Integration Credentials rotated!');
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(ehrToken);
    setCopied(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Hospital Settings</h1>
        <p className="text-[var(--text-muted)] font-medium">Configure alert triggers, interface layouts, and external EHR integration nodes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar tabs */}
        <div className="card bg-[var(--bg-card)] border-[var(--border-main)] p-4 space-y-2 lg:col-span-1">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
              activeTab === 'notifications'
              ? 'bg-primary-600/10 text-primary-600 border-l-4 border-primary-600'
              : 'hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Bell size={16} />
            Alerts & Notifications
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
              activeTab === 'display'
              ? 'bg-primary-600/10 text-primary-600 border-l-4 border-primary-600'
              : 'hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Layout size={16} />
            UI Layout Preferences
          </button>
          <button
            onClick={() => setActiveTab('ehr')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
              activeTab === 'ehr'
              ? 'bg-primary-600/10 text-primary-600 border-l-4 border-primary-600'
              : 'hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Key size={16} />
            EHR Integration (API)
          </button>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3 card bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl p-6">
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <h2 className="text-lg font-black text-[var(--text-main)] pb-2 border-b border-[var(--border-main)] flex items-center gap-2">
                <Bell size={18} className="text-primary-600" />
                Notification & Dispatch Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)]/20 transition-all">
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">Emergency SOS Alerts</p>
                    <p className="text-xs text-[var(--text-muted)]">Dispatch email immediately when an assigned patient triggers an SOS alert.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.emailOnSOS}
                    onChange={() => handleNotifToggle('emailOnSOS')}
                    className="toggle-checkbox w-10 h-5 bg-gray-300 rounded-full appearance-none checked:bg-primary-600 cursor-pointer transition-colors relative"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)]/20 transition-all">
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">Referral Status Notifications</p>
                    <p className="text-xs text-[var(--text-muted)]">Get emails when a post-discharge home care agency accepts or completes a referral.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.emailOnReferralUpdate}
                    onChange={() => handleNotifToggle('emailOnReferralUpdate')}
                    className="toggle-checkbox w-10 h-5 bg-gray-300 rounded-full appearance-none checked:bg-primary-600 cursor-pointer transition-colors relative"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)]/20 transition-all">
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">Adherence Alerts</p>
                    <p className="text-xs text-[var(--text-muted)]">Receive alerts when post-discharge patients miss medication dosage schedules.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.emailOnMedicationMiss}
                    onChange={() => handleNotifToggle('emailOnMedicationMiss')}
                    className="toggle-checkbox w-10 h-5 bg-gray-300 rounded-full appearance-none checked:bg-primary-600 cursor-pointer transition-colors relative"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)]/20 transition-all">
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                      <Volume2 size={16} className="text-gray-400" />
                      Live Audio SOS Warning
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Play alert siren sound on the emergency dashboard during critical incidents.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.soundAlertOnSOS}
                    onChange={() => handleNotifToggle('soundAlertOnSOS')}
                    className="toggle-checkbox w-10 h-5 bg-gray-300 rounded-full appearance-none checked:bg-primary-600 cursor-pointer transition-colors relative"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-main)] flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center gap-1.5 shadow-lg">
                  <Save size={16} /> Save Alerts Settings
                </button>
              </div>
            </form>
          )}

          {activeTab === 'display' && (
            <form onSubmit={handleSaveDisplay} className="space-y-6">
              <h2 className="text-lg font-black text-[var(--text-main)] pb-2 border-b border-[var(--border-main)] flex items-center gap-2">
                <Layout size={18} className="text-primary-600" />
                Interface Layout Preferences
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Default Data Grid Limit</label>
                  <select
                    value={displaySettings.defaultPageSize}
                    onChange={e => handleDisplayChange('defaultPageSize', e.target.value)}
                    className="input max-w-xs"
                  >
                    <option value="5">5 records per page</option>
                    <option value="10">10 records per page</option>
                    <option value="25">25 records per page</option>
                    <option value="50">50 records per page</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)]/20 transition-all">
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">High-Contrast Emergency Mode</p>
                    <p className="text-xs text-[var(--text-muted)]">Enhance visibility of emergency dashboards with bold alarm backgrounds.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={displaySettings.highContrastSOS}
                    onChange={() => handleDisplayChange('highContrastSOS', !displaySettings.highContrastSOS)}
                    className="toggle-checkbox w-10 h-5 bg-gray-300 rounded-full appearance-none checked:bg-primary-600 cursor-pointer transition-colors relative"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)]/20 transition-all">
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">Welcome & Onboarding Cards</p>
                    <p className="text-xs text-[var(--text-muted)]">Show helpful quick tips and operation guidelines on the primary dashboard.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={displaySettings.showDashboardTips}
                    onChange={() => handleDisplayChange('showDashboardTips', !displaySettings.showDashboardTips)}
                    className="toggle-checkbox w-10 h-5 bg-gray-300 rounded-full appearance-none checked:bg-primary-600 cursor-pointer transition-colors relative"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-main)] flex justify-end">
                <button type="submit" className="btn btn-primary flex items-center gap-1.5 shadow-lg">
                  <Save size={16} /> Apply Layout Options
                </button>
              </div>
            </form>
          )}

          {activeTab === 'ehr' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-[var(--text-main)] pb-2 border-b border-[var(--border-main)] flex items-center gap-2">
                <Database size={18} className="text-primary-600" />
                EHR Integration Node Linkage
              </h2>

              <div className="bg-primary-600/10 border border-primary-600/20 rounded-xl p-4 flex gap-3 text-sm text-primary-800">
                <Database size={20} className="flex-shrink-0 mt-0.5 text-primary-600" />
                <div>
                  <p className="font-bold">Electronic Health Record (EHR) Bridge</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Connect CareConnect with your local Hospital EHR systems (Epic, Cerner, etc.) to automatically sync patient admissions, diagnostic notes, and medication plans.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">CareConnect Web API Key</label>
                  <div className="flex gap-2">
                    <div className="font-mono bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl p-3 flex-1 flex items-center justify-between text-xs overflow-x-auto select-all">
                      <span className="text-[var(--text-main)]">{ehrToken}</span>
                    </div>
                    <button
                      onClick={handleCopyToken}
                      className="btn bg-[var(--bg-main)] border border-[var(--border-main)] hover:bg-[var(--bg-card)] text-[var(--text-main)] flex items-center justify-center p-3 rounded-xl gap-2 font-bold"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    Include this token in the `Authorization: Bearer` header of your EHR API dispatch requests.
                  </p>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-3 text-xs text-[var(--text-main)]">
                  <ShieldAlert size={18} className="flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-bold text-red-500">Security Warning</p>
                    <p className="text-[var(--text-muted)] mt-0.5">
                      Keep your API token private. Rotating this credential will immediately terminate active EHR sync bridges.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleRegenerateToken}
                    className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Rotate API Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styled toggle switch helper styles */}
      <style>{`
        .toggle-checkbox:checked {
          background-color: var(--color-primary-600, #2563eb);
        }
        .toggle-checkbox:checked::after {
          transform: translateX(20px);
        }
        .toggle-checkbox::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background-color: white;
          transition: transform 0.2s;
        }
      `}</style>
    </div>
  );
};

export default HospitalSettings;
