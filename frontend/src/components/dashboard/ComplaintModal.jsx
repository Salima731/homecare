import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertTriangle, Paperclip, AlertCircle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const ComplaintModal = ({ isOpen, onClose, booking }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('bookingId', booking._id);
      formData.append('subject', subject);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('againstId', booking.caregiver?._id || booking.agency?._id);
      formData.append('againstType', booking.caregiver ? 'Caregiver' : 'Agency');

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/complaints`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Complaint filed successfully. Our team will review it.');
        onClose();
      } else {
        toast.error(result.message || 'Failed to file complaint');
      }
    } catch (err) {
      toast.error('An error occurred while filing the complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-red-600 p-8 text-white relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <AlertTriangle size={28} /> Report an Issue
            </h2>
            <p className="text-red-100 font-medium mt-1">Filing a complaint regarding Booking #{booking._id.slice(-6)}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Warning Box */}
            <div className="p-4 bg-red-50 rounded-2xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-red-700 leading-relaxed font-medium">
                Please provide accurate details. Filing false complaints may lead to account suspension. 
                Our support team will investigate and respond within 24-48 hours.
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Subject / Reason</label>
              <input 
                required
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Caregiver arrived late, unprofessional behavior" 
                className="input py-3" 
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">Detailed Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe exactly what happened..." 
                className="input min-h-[120px] py-4" 
              />
            </div>

            {/* Priority & Attachments Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Priority Level</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="input py-3"
                >
                  <option value="low">Low - Minor issue</option>
                  <option value="medium">Medium - Standard issue</option>
                  <option value="high">High - Urgent concern</option>
                  <option value="critical">Critical - Safety issue</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Attachments (Optional)</label>
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-2xl hover:border-red-400 hover:bg-red-50 cursor-pointer transition-all">
                  <Paperclip size={18} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-500">Upload Evidence</span>
                  <input type="file" multiple onChange={handleFileChange} className="hidden" />
                </label>
                {attachments.length > 0 && (
                  <p className="text-[10px] font-bold text-gray-400 text-center">{attachments.length} files selected</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-50">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1 py-4">Cancel</button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200 flex-1 py-4 flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Send size={18} /> File Complaint
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

export default ComplaintModal;
