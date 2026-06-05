import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, AlertCircle, CheckCircle, Clock, Eye, MoreVertical, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { useGetComplaintsQuery, useUpdateComplaintStatusMutation } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminComplaints = () => {
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const { data: complaints, isLoading } = useGetComplaintsQuery(filters);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateComplaintStatusMutation();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatus({ id, status, adminNote }).unwrap();
      toast.success(`Complaint marked as ${status}`);
      setSelectedComplaint(null);
      setAdminNote('');
    } catch (err) {
      toast.error('Failed to update complaint');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Complaints & Disputes</h1>
        <p className="text-[var(--text-muted)] font-medium">Handle user disputes and service complaints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Complaints List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <select 
              className="input md:w-48 h-12 font-bold"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select 
              className="input md:w-48 h-12 font-bold"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="space-y-4">
            {complaints?.data?.length > 0 ? (
              complaints.data.map((complaint) => (
                <div 
                  key={complaint._id} 
                  className={`card p-6 cursor-pointer transition-all hover:shadow-xl group ${selectedComplaint?._id === complaint._id ? 'ring-2 ring-primary-500' : ''}`}
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setAdminNote(complaint.adminNote || '');
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${complaint.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-[var(--text-main)] group-hover:text-primary-600 transition-colors">{complaint.subject}</h4>
                        <p className="text-xs text-[var(--text-muted)] font-medium">By {complaint.raisedBy?.name} • {new Date(complaint.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      complaint.status === 'open' ? 'bg-red-100 text-red-700' :
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {complaint.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 card border-dashed border-2 border-[var(--border-main)] bg-[var(--bg-main)]">
                <MessageSquare size={64} className="mx-auto text-[var(--text-muted)] opacity-10 mb-4" />
                <p className="text-[var(--text-muted)] font-black uppercase tracking-widest">No complaints found</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
          {selectedComplaint ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-8 sticky top-24 space-y-8 shadow-2xl border-primary-500/20"
            >
              <div className="pb-6 border-b border-[var(--border-main)]">
                <h3 className="text-lg font-black text-[var(--text-main)] mb-1">Take Action</h3>
                <p className="text-xs text-[var(--text-muted)] font-medium">Complaint ID: {selectedComplaint._id.slice(-8)}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Resolution Notes</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="input h-40 text-sm p-4 font-medium"
                    placeholder="Enter notes about the investigation and resolution..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => handleStatusUpdate(selectedComplaint._id, 'in_review')}
                    className="btn btn-outline py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Clock size={16} /> Mark In Review
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedComplaint._id, 'resolved')}
                    className="btn btn-primary py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Resolve Complaint
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border-main)] space-y-4">
                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[var(--text-muted)]">Against</span>
                    <span className="text-[var(--text-main)]">{selectedComplaint.against?.entityId?.name || selectedComplaint.against?.entityId?.agencyName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[var(--text-muted)]">Priority</span>
                    <span className={`capitalize ${selectedComplaint.priority === 'high' ? 'text-red-500' : 'text-blue-500'}`}>{selectedComplaint.priority}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center card border-dashed border-2 border-[var(--border-main)] text-center bg-[var(--bg-main)] opacity-50">
              <AlertTriangle size={48} className="text-[var(--text-muted)] mb-4" />
              <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Select a complaint to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminComplaints;
