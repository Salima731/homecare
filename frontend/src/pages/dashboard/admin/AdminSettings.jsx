import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Percent, DollarSign, Shield, Bell, Save, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGetPlatformSettingsQuery, useUpdatePlatformSettingsMutation } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
  const { data: settingsData, isLoading } = useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdatePlatformSettingsMutation();
  
  const [settings, setSettings] = useState({
    PLATFORM_COMMISSION: 10,
    MINIMUM_BOOKING_AMOUNT: 500,
    TAX_RATE: 5,
    AUTO_APPROVE_AGENCY: false,
    MAINTENANCE_MODE: false
  });

  useEffect(() => {
    if (settingsData?.data) {
      setSettings(prev => ({
        ...prev,
        ...settingsData.data
      }));
    }
  }, [settingsData]);

  const handleSave = async () => {
    try {
      await updateSettings(settings).unwrap();
      toast.success('Platform settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Platform Settings</h1>
          <p className="text-[var(--text-muted)] font-medium">Configure global business rules and platform behavior.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isUpdating}
          className="btn btn-primary px-8 py-3 flex items-center gap-2 font-black uppercase tracking-widest"
        >
          {isUpdating ? <RotateCcw className="animate-spin" size={20} /> : <Save size={20} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <DollarSign className="text-primary-600" size={20} />
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Financial Configuration</h3>
          </div>
          
          <div className="card p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[var(--text-main)]">Platform Commission (%)</label>
                <span className="text-primary-600 font-black">{settings.PLATFORM_COMMISSION}%</span>
              </div>
              <div className="flex items-center gap-4">
                <Percent className="text-[var(--text-muted)]" size={20} />
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="0.5"
                  value={settings.PLATFORM_COMMISSION}
                  onChange={(e) => setSettings(prev => ({ ...prev, PLATFORM_COMMISSION: parseFloat(e.target.value) }))}
                  className="w-full h-2 bg-[var(--bg-main)] rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">Percentage taken from every successful caregiver booking.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-main)]">Tax Rate (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={settings.TAX_RATE}
                  onChange={(e) => setSettings(prev => ({ ...prev, TAX_RATE: parseFloat(e.target.value) }))}
                  className="input pl-4 h-12 font-bold"
                />
                <Percent className="absolute right-4 top-3.5 text-[var(--text-muted)]" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-main)]">Minimum Booking Amount</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={settings.MINIMUM_BOOKING_AMOUNT}
                  onChange={(e) => setSettings(prev => ({ ...prev, MINIMUM_BOOKING_AMOUNT: parseFloat(e.target.value) }))}
                  className="input pl-10 h-12 font-bold"
                />
                <DollarSign className="absolute left-4 top-3.5 text-[var(--text-muted)]" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* System Behavior */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <Shield className="text-primary-600" size={20} />
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">System Controls</h3>
          </div>

          <div className="card p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">Auto-Approve Agencies</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">If enabled, agencies won't need manual verification.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.AUTO_APPROVE_AGENCY}
                  onChange={(e) => setSettings(prev => ({ ...prev, AUTO_APPROVE_AGENCY: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-[var(--bg-main)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">Maintenance Mode</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 text-red-500/70 font-medium flex items-center gap-1">
                  <AlertTriangle size={12} /> Disables all frontend operations for users.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.MAINTENANCE_MODE}
                  onChange={(e) => setSettings(prev => ({ ...prev, MAINTENANCE_MODE: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-[var(--bg-main)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="p-4 bg-primary-50/10 border border-primary-500/20 rounded-2xl flex items-start gap-4">
              <ShieldCheck className="text-primary-600 shrink-0" size={24} />
              <div>
                <h5 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">Security Audit</h5>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">All changes to these settings are logged with your administrator ID and timestamp for security compliance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
