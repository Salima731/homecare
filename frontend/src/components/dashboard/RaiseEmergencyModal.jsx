import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, AlertCircle } from 'lucide-react';
import { useRaiseAlertMutation } from '../../features/emergencyAlerts/emergencyAlertApiSlice';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const RaiseEmergencyModal = ({ isOpen, onClose, booking }) => {
  const [alertType, setAlertType] = useState('Medical Emergency');
  const [severityLevel, setSeverityLevel] = useState('Critical');
  const [description, setDescription] = useState('');
  const [raiseAlert, { isLoading }] = useRaiseAlertMutation();

  const alertTypes = [
    'Medical Emergency',
    'Fall Incident',
    'Breathing Difficulty',
    'Medication Reaction',
    'Injury',
    'Hospital Transfer Required',
    'Other'
  ];

  const severityLevels = ['Low', 'Medium', 'High', 'Critical'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please provide a description of the emergency');
      return;
    }

    try {
      await raiseAlert({
        bookingId: booking._id,
        alertType,
        severityLevel,
        description: description.trim(),
      }).unwrap();

      toast.success('Emergency alert raised successfully! Notifications sent.');
      setDescription('');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to raise emergency alert');
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--bg-card)] rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-red-500/30"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white relative">
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <AlertTriangle className="animate-bounce" size={28} /> Raise Emergency Alert
            </h2>
            <p className="text-red-100 text-xs font-bold uppercase tracking-widest mt-2">
              For Booking #{booking._id.slice(-6)} — Patient: {booking.user?.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Warning Box */}
            <div className="p-5 bg-red-500/10 rounded-2xl flex items-start gap-4 border border-red-500/20">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Immediate Notification Dispatch</p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1 font-medium">
                  Submitting this alert will immediately notify the Agency, patient's Family, and Platform Admins. Use only for genuine emergencies.
                </p>
              </div>
            </div>

            {/* Alert Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Emergency Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {alertTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAlertType(type)}
                    className={`p-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      alertType === type
                        ? 'bg-red-500/15 border-red-500 text-red-600'
                        : 'bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] hover:border-red-500/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Level */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Severity Level</label>
              <div className="grid grid-cols-4 gap-2">
                {severityLevels.map((level) => {
                  let colorClass = '';
                  if (level === 'Low') colorClass = severityLevel === level ? 'bg-blue-500/15 border-blue-500 text-blue-600' : 'hover:border-blue-500/40';
                  if (level === 'Medium') colorClass = severityLevel === level ? 'bg-yellow-500/15 border-yellow-500 text-yellow-600' : 'hover:border-yellow-500/40';
                  if (level === 'High') colorClass = severityLevel === level ? 'bg-orange-500/15 border-orange-500 text-orange-600' : 'hover:border-orange-500/40';
                  if (level === 'Critical') colorClass = severityLevel === level ? 'bg-red-500/15 border-red-500 text-red-600 border-2 font-black' : 'hover:border-red-500/40';

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverityLevel(level)}
                      className={`p-3 text-xs font-bold rounded-xl border text-center transition-all ${colorClass} bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)]`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Emergency Description & Current Status</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the situation, e.g., Patient has fallen in the kitchen, complaining of severe back pain. We have called 911..."
                className="input min-h-[120px] py-4 bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] rounded-2xl px-6 font-bold focus:border-red-500 transition-all resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-4 pt-4 border-t border-[var(--border-main)]">
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] flex-1 py-4 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Send size={14} /> Raise Alert
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RaiseEmergencyModal;
