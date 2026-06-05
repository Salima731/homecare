import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Star, ShieldCheck, Mail, Phone, MessageSquare, X, Send } from 'lucide-react';
import { useGetAgencyCaregiversQuery, useVerifyCaregiverMutation, useToggleCaregiverStatusMutation } from '../../../features/agencies/agencyApiSlice';
import { useSendMessageMutation } from '../../../features/messages/messageApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AgencyCaregivers = () => {
  const { data: response, isLoading, error, refetch } = useGetAgencyCaregiversQuery();
  const [verifyCaregiver] = useVerifyCaregiverMutation();
  const [toggleStatus] = useToggleCaregiverStatusMutation();
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = React.useState(null);
  const [messageText, setMessageText] = React.useState('');
  
  const caregivers = response?.data || [];
  const filteredCaregivers = caregivers.filter(cg => 
    cg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cg._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerify = async (id) => {
    if (!window.confirm('Are you sure you want to verify this caregiver? This will make them visible to users.')) return;
    try {
      await verifyCaregiver({ id, verify: true }).unwrap();
      toast.success('Caregiver verified successfully!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to verify caregiver');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this caregiver?`)) return;
    try {
      await toggleStatus({ id, isActive: !currentStatus }).unwrap();
      toast.success(`Caregiver ${action}d successfully!`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || `Failed to ${action} caregiver`);
    }
  };

  const handleOpenMessage = (user) => {
    setSelectedCaregiver(user);
    setShowMessageModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedCaregiver) return;
    
    const recipientId = selectedCaregiver._id || selectedCaregiver;
    
    try {
      await sendMessage({ 
        recipientId, 
        content: messageText.trim() 
      }).unwrap();
      
      toast.success('Message sent to staff!');
      setMessageText('');
      setShowMessageModal(false);
    } catch (err) {
      console.error('Message Error:', err);
      toast.error(err?.data?.message || 'Failed to send message');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (response && response.data === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-primary-600/20 p-6 rounded-full text-primary-600">
          <ShieldCheck size={64} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Agency Profile Required</h1>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mt-2 font-medium">
            You need to complete your agency profile setup before you can manage caregivers.
          </p>
        </div>
        <Link to="/dashboard/agency/setup" className="btn btn-primary px-8 py-3">
          Complete Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Caregiver Management</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage your staff, their profiles, and verification status.</p>
        </div>
        <Link to="/dashboard/agency/caregivers/add" className="btn btn-primary flex items-center gap-2 px-6 py-3 shadow-xl shadow-primary-900/20">
          <Plus size={20} /> Add New Caregiver
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-muted)] opacity-50">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search caregivers by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 h-12 bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-main)]"
          />
        </div>
        <button className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] flex items-center gap-2 h-12 px-8 font-black uppercase tracking-widest text-[10px]">
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Caregivers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCaregivers.length > 0 ? (
          filteredCaregivers.map((caregiver, i) => (
            <motion.div
              key={caregiver._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="card p-0 overflow-hidden hover:shadow-2xl transition-all bg-[var(--bg-card)] border-[var(--border-main)]"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={caregiver.profileImage?.url || `https://i.pravatar.cc/100?u=${caregiver._id}`} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--border-main)] shadow-xl"
                      alt={caregiver.name}
                    />
                    <div>
                      <h3 className="font-black text-[var(--text-main)] text-lg tracking-tight">{caregiver.name}</h3>
                      <p className="text-[10px] text-primary-600 font-black uppercase tracking-[0.2em]">
                        {caregiver.serviceType?.replace('_', ' ') || 'Specialist'}
                      </p>
                      <div className="flex items-center text-yellow-500 mt-1">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-black text-[var(--text-main)] ml-1">{caregiver.avgRating || '0'}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-[var(--bg-main)] rounded-xl transition-colors border border-transparent hover:border-[var(--border-main)]">
                    <MoreVertical size={20} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] bg-[var(--bg-main)]/50 p-3 rounded-2xl border border-[var(--border-main)]/50">
                    <Mail size={14} className="text-primary-600" />
                    <span className="truncate font-bold">{caregiver.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] bg-[var(--bg-main)]/50 p-3 rounded-2xl border border-[var(--border-main)]/50">
                    <Phone size={14} className="text-primary-600" />
                    <span className="font-bold">{caregiver.user?.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[var(--border-main)]">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shadow-sm ${caregiver.isVerified ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      {caregiver.isVerified ? 'Verified' : 'Pending'}
                      {!caregiver.isActive && <span className="ml-1 text-red-500 font-black tracking-widest">(Inactive)</span>}
                    </span>
                    {!caregiver.isVerified && (
                      <button 
                        onClick={() => handleVerify(caregiver._id)}
                        className="ml-2 px-3 py-1 bg-primary-600 text-white rounded-lg text-[8px] font-black tracking-[0.2em] shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                      >
                        VERIFY
                      </button>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleOpenMessage(caregiver.user)}
                      className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <MessageSquare size={12} /> Message
                    </button>
                    <Link 
                      to={`/dashboard/user/caregivers/${caregiver._id}`}
                      className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors"
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={() => handleToggleStatus(caregiver._id, caregiver.isActive)}
                      className={`text-[10px] font-black ${caregiver.isActive ? 'text-red-500/60 hover:text-red-500' : 'text-green-500/60 hover:text-green-500'} uppercase tracking-widest transition-colors`}
                    >
                      {caregiver.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center card border-dashed border-2 border-[var(--border-main)] bg-[var(--bg-card)]/30">
            <div className="w-20 h-20 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border-main)]">
              <Plus size={40} className="text-[var(--text-muted)] opacity-20" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">No Caregivers Registered</h3>
            <p className="text-[var(--text-muted)] max-w-sm mx-auto mt-2 font-medium">Start by adding your first caregiver to expand your agency's reach.</p>
            <Link to="/dashboard/agency/caregivers/add" className="btn btn-primary mt-8 px-10 py-4 font-black uppercase tracking-widest text-xs">Add Caregiver</Link>
          </div>
        )}
      </div>

      {/* Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-[var(--border-main)]"
            >
              <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-primary-600 text-white">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-widest">Message Staff</h3>
                  <p className="text-[10px] font-bold opacity-80">To: {selectedCaregiver?.name}</p>
                </div>
                <button onClick={() => setShowMessageModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-90">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest ml-1">Message Content</label>
                  <textarea
                    required
                    autoFocus
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message to the caregiver..."
                    className="input min-h-[150px] py-4 bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] rounded-2xl px-6 font-bold focus:border-primary-500 transition-all resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 btn btn-outline border-[var(--border-main)] text-[var(--text-main)] py-4 font-black uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={sendingMessage}
                    className="flex-1 btn btn-primary py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
                  >
                    {sendingMessage ? 'Sending...' : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgencyCaregivers;
