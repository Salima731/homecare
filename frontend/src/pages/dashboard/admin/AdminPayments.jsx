import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Search, Download, ArrowUpRight, TrendingUp, ShieldCheck, DollarSign } from 'lucide-react';
import { useGetAllPaymentsQuery } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminPayments = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: response, isLoading } = useGetAllPaymentsQuery({ status: statusFilter });
  const payments = response?.data || [];

  const handleExport = () => {
    if (payments.length === 0) {
      toast.error('No transactions available to export');
      return;
    }
    
    // Define headers
    const headers = ['Transaction ID', 'Date', 'User', 'Agency', 'Service', 'Amount', 'Commission', 'Status'];
    
    // Helper to escape CSV values
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Map data
    const rows = payments.map(p => [
      escapeCSV(p.razorpayPaymentId || p._id),
      escapeCSV(new Date(p.paidAt || p.createdAt).toLocaleString()),
      escapeCSV(p.user?.name || 'N/A'),
      escapeCSV(p.agency?.agencyName || 'N/A'),
      escapeCSV(p.booking?.serviceType || 'N/A'),
      escapeCSV(p.amount),
      escapeCSV(p.platformCommission),
      escapeCSV(p.status)
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    try {
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `CareConnect_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Ledger exported successfully!');
    } catch (err) {
      console.error('Export Error:', err);
      toast.error('Failed to export ledger');
    }
  };

  const totalPlatformVolume = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPlatformRevenue = payments.reduce((acc, curr) => acc + curr.platformCommission, 0);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">Platform Transactions</h1>
          <p className="text-[var(--text-muted)] font-medium">Real-time financial stream oversight and commission tracking.</p>
        </div>
        <button 
          onClick={handleExport}
          className="btn-primary py-2 px-6 flex items-center gap-2 group"
        >
          <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> 
          Export Ledger
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Volume', value: `₹${totalPlatformVolume.toLocaleString()}`, icon: <TrendingUp className="text-blue-500" />, color: 'bg-blue-600/10' },
          { label: 'Platform Revenue', value: `₹${totalPlatformRevenue.toLocaleString()}`, icon: <ShieldCheck className="text-green-500" />, color: 'bg-green-600/10' },
          { label: 'Total Transactions', value: payments.length, icon: <CreditCard className="text-purple-500" />, color: 'bg-purple-600/10' },
        ].map((stat, i) => (
          <div key={i} className="card p-6 border-[var(--border-main)] bg-[var(--bg-card)] hover:shadow-xl transition-all group">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-2xl font-black text-[var(--text-main)] mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
        <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
          <h3 className="font-black text-lg text-[var(--text-main)] flex items-center gap-3 uppercase tracking-tight">
            <CreditCard className="text-primary-600" /> Transaction Ledger
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
              <input 
                type="text" 
                placeholder="Find transaction..."
                className="pl-8 pr-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg text-[10px] outline-none"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] border-b border-[var(--border-main)]">
              <tr>
                <th className="px-6 py-5">Transaction ID</th>
                <th className="px-6 py-5">Source / Destination</th>
                <th className="px-6 py-5">Booking Details</th>
                <th className="px-6 py-5">Total Amount</th>
                <th className="px-6 py-5">Platform cut</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-primary-600/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-[var(--text-main)] uppercase">{payment.razorpayPaymentId || 'CASH'}</p>
                      <ArrowUpRight size={12} className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[8px] text-[var(--text-muted)] mt-1">{new Date(payment.paidAt || payment.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[var(--text-main)]">{payment.user?.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1 h-1 rounded-full bg-primary-600"></div>
                      <p className="text-[10px] font-black text-primary-600 uppercase tracking-tighter">{payment.agency?.agencyName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[var(--text-main)] uppercase tracking-tight">{payment.booking?.serviceType.replace('_', ' ')}</p>
                    <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">Start: {new Date(payment.booking?.startDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-black text-[var(--text-main)] tracking-tight">₹{payment.amount}</p>
                    <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">Via {payment.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-5 text-green-500">
                    <p className="text-sm font-black tracking-tight">+₹{payment.platformCommission}</p>
                    <p className="text-[8px] font-black uppercase opacity-60">Revenue</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-green-600/10 text-green-500 border border-green-600/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
