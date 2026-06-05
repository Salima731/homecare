import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Eye, FileText, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { useGetPendingVerificationsQuery, useVerifyEntityMutation } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminVerifications = () => {
  const { data: pending, isLoading, refetch } = useGetPendingVerificationsQuery();
  const [verifyEntity, { isLoading: isVerifying }] = useVerifyEntityMutation();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [remarks, setRemarks] = useState('');

  const handleVerify = async (type, id, status) => {
    try {
      await verifyEntity({ type, id, status, remarks }).unwrap();
      toast.success(`${type} ${status === 'active' ? 'verified' : 'rejected'} successfully`);
      setSelectedEntity(null);
      setRemarks('');
      refetch();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Entity Verifications</h1>
        <p className="text-[var(--text-muted)] font-medium">Review and approve new agencies and independent caregivers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input type="text" placeholder="Search pending..." className="input pl-10 h-10 text-sm font-bold" />
          </div>
          
          <div className="space-y-3">
            {pending?.data?.length > 0 ? (
              pending.data.map((entity) => (
                <div 
                  key={entity._id} 
                  onClick={() => setSelectedEntity(entity)}
                  className={`card p-4 cursor-pointer transition-all border-l-4 ${selectedEntity?._id === entity._id ? 'border-l-primary-600 bg-primary-50/10 ring-1 ring-primary-500/20 shadow-lg' : 'border-l-[var(--border-main)] hover:border-l-primary-400'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${entity.type === 'agency' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                      {entity.type}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">{new Date(entity.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-[var(--text-main)]">{entity.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-1">{entity.email}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-16 card border-dashed border-2 border-[var(--border-main)] bg-[var(--bg-main)]">
                <CheckCircle size={48} className="mx-auto text-green-500/20 mb-4" />
                <p className="text-sm text-[var(--text-muted)] font-black uppercase tracking-widest">All caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Detail View */}
        <div className="lg:col-span-2">
          {selectedEntity ? (
            <motion.div 
              key={selectedEntity._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 sticky top-24"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6 pb-8 border-b border-[var(--border-main)]">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-3xl font-black text-primary-600 border border-[var(--border-main)] shadow-inner">
                    {selectedEntity.name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{selectedEntity.name}</h2>
                    <p className="text-primary-600 font-black uppercase text-xs tracking-widest mt-1">{selectedEntity.type} Verification</p>
                    <div className="flex gap-4 mt-3 text-sm text-[var(--text-muted)] font-medium">
                      <span className="flex items-center gap-1.5"><FileText size={16} /> ID: {selectedEntity._id.slice(-8)}</span>
                      <span className="flex items-center gap-1.5"><CheckCircle size={16} /> Registered: {new Date(selectedEntity.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-8 space-y-8">
                <div>
                  <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-5">Submitted Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Business License', 'Tax ID Certificate', 'Insurance Policy', 'Background Check'].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-main)] hover:border-primary-500/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[var(--bg-card)] rounded-xl text-primary-600 group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                            <FileText size={20} />
                          </div>
                          <span className="text-sm font-bold text-[var(--text-main)]">{doc}</span>
                        </div>
                        <Eye size={18} className="text-[var(--text-muted)] group-hover:text-primary-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Admin Remarks (Optional)</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="input h-32 text-sm font-medium"
                    placeholder="Enter notes about this verification decision..."
                  ></textarea>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-[var(--border-main)]">
                <button 
                  onClick={() => handleVerify(selectedEntity.type, selectedEntity._id, 'rejected')}
                  disabled={isVerifying}
                  className="btn btn-outline border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                >
                  <XCircle size={20} /> Reject Application
                </button>
                <button 
                  onClick={() => handleVerify(selectedEntity.type, selectedEntity._id, 'active')}
                  disabled={isVerifying}
                  className="btn btn-primary flex-1 py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                >
                  {isVerifying ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} Approve & Activate
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 card border-dashed border-2 border-[var(--border-main)] text-center bg-[var(--bg-main)]">
              <ShieldCheck size={80} className="text-[var(--text-muted)] opacity-10 mb-6" />
              <h2 className="text-2xl font-black text-[var(--text-muted)] tracking-tight">Select an entity to review</h2>
              <p className="text-[var(--text-muted)] max-w-sm mt-3 font-medium">Click on any pending application from the list on the left to start the verification process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVerifications;
