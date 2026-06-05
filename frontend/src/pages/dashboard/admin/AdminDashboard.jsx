import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserX, AlertTriangle, TrendingUp, Users, Home } from 'lucide-react';
import { useGetAdminStatsQuery, useVerifyEntityMutation } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { data, isLoading, refetch } = useGetAdminStatsQuery();
  const [verifyEntity] = useVerifyEntityMutation();

  const handleVerify = async (id, type, status) => {
    try {
      await verifyEntity({ 
        id, 
        type, 
        status: status === 'approve' ? 'active' : 'rejected',
        remarks: status === 'approve' ? 'Verified by Admin' : 'Rejected by Admin'
      }).unwrap();
      toast.success(`${type} ${status}d successfully`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Verification failed');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const analytics = data?.data;
  const overview = analytics?.overview;

  const stats = [
    { label: 'Total Users', value: overview?.totalUsers || 0, icon: <Users className="text-blue-500" />, color: 'bg-blue-600/10' },
    { label: 'Pending Agencies', value: overview?.pendingAgencies || 0, icon: <Home className="text-amber-500" />, color: 'bg-amber-600/10' },
    { label: 'Open Complaints', value: overview?.openComplaints || 0, icon: <AlertTriangle className="text-red-500" />, color: 'bg-red-600/10' },
    { label: 'Total Revenue', value: `₹${overview?.platformRevenue || 0}`, icon: <TrendingUp className="text-green-500" />, color: 'bg-green-600/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Admin Control Center</h1>
        <p className="text-[var(--text-muted)] font-medium mt-1">Overview of platform health, verifications, and performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 border-[var(--border-main)] bg-[var(--bg-card)] hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-2xl font-black text-[var(--text-main)] mt-1">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Verifications */}
        <div className="card p-0 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
          <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
            <h3 className="font-black text-lg text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tight">
              <ShieldCheck className="text-primary-600" /> Pending Verifications
            </h3>
            <button className="text-primary-600 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="p-6 space-y-4">
            {analytics?.pendingVerifications?.length > 0 ? (
              analytics.pendingVerifications.map((entity) => (
                <div key={entity._id} className="flex items-center justify-between p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-main)] hover:border-primary-600/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-600/10 text-primary-600 rounded-xl flex items-center justify-center font-black text-lg border border-primary-600/20">
                      {entity.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-main)]">{entity.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">
                        {entity.type} • {new Date(entity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleVerify(entity._id, entity.type, 'reject')}
                      className="px-4 py-2 bg-red-600/10 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleVerify(entity._id, entity.type, 'approve')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)] italic font-medium opacity-50">
                <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
                No pending verifications
              </div>
            )}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card p-0 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
          <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
            <h3 className="font-black text-lg text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tight">
              <AlertTriangle className="text-red-500" /> Critical Complaints
            </h3>
            <button className="text-primary-600 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="p-6 space-y-4">
            {analytics?.recentComplaints?.length > 0 ? (
              analytics.recentComplaints.map((complaint) => (
                <div key={complaint._id} className="flex items-start gap-4 p-4 border border-red-500/20 bg-red-600/5 rounded-2xl hover:bg-red-600/10 transition-all group">
                  <div className="p-3 bg-red-600/10 rounded-xl text-red-500 mt-0.5 border border-red-500/20">
                    <UserX size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-[var(--text-main)]">{complaint.subject || 'Harassment Allegation'}</p>
                      <span className="text-[8px] font-black text-red-500 bg-red-600/10 px-2 py-1 rounded-full uppercase tracking-widest border border-red-500/20">HIGH PRIORITY</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium mb-3">
                      Reported by <span className="font-black text-[var(--text-main)]">{complaint.raisedBy?.name}</span> against <span className="font-black text-[var(--text-main)]">{complaint.against?.entityId?.name || 'Caregiver'}</span>
                    </p>
                    <div className="flex gap-4">
                      <button className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] hover:text-primary-700 transition-colors">Investigate</button>
                      <button className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] hover:text-red-500 transition-colors">Dismiss</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)] italic font-medium opacity-50">
                <AlertTriangle size={40} className="mx-auto mb-3 opacity-20" />
                No high-priority complaints
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
