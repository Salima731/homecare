import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Calendar, ArrowUpRight, 
  Wallet, Download, Filter, Search
} from 'lucide-react';
import { useGetCaregiverEarningsQuery } from '../../../features/caregivers/caregiverApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const CaregiverEarnings = () => {
  const { data: response, isLoading, refetch } = useGetCaregiverEarningsQuery();
  const { totalEarned = 0, completedBookings = 0, payments = [] } = response?.data || {};

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  React.useEffect(() => { refetch(); }, [refetch]);

  // Filter payments by search term
  const filteredPayments = payments.filter(payment => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      payment.booking?.serviceType?.toLowerCase().includes(term) ||
      payment.razorpayPaymentId?.toLowerCase().includes(term) ||
      payment._id?.toLowerCase().includes(term);
    return matchesSearch;
  });

  // Export as CSV
  const handleExport = () => {
    if (!payments.length) {
      toast.error('No payment records to export.');
      return;
    }
    const headers = ['Date', 'Service', 'Type', 'Payment ID', 'Amount (INR)'];
    const rows = payments.map(p => [
      format(new Date(p.createdAt), 'yyyy-MM-dd'),
      p.booking?.serviceType?.replace('_', ' ') || 'N/A',
      p.booking?.durationType || 'N/A',
      p.razorpayPaymentId || p._id,
      p.agencyAmount
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  if (isLoading) return <LoadingSpinner />;

  const stats = [
    {
      icon: <Wallet size={24} />,
      label: 'Total Earned',
      value: `₹${totalEarned.toLocaleString()}`,
      footer: <><TrendingUp size={14} /> +12% from last month</>,
      gradient: 'from-primary-500 to-primary-700',
      textColor: 'text-white',
      footerColor: 'text-primary-100',
      borderColor: 'border-white/10',
      iconBg: 'bg-white/20',
    },
    {
      icon: <TrendingUp size={24} />,
      label: 'Completed Jobs',
      value: completedBookings,
      footer: <><ArrowUpRight size={14} /> High performance</>,
      gradient: null,
      textColor: 'text-[var(--text-main)]',
      footerColor: 'text-green-500',
      borderColor: 'border-[var(--border-main)]',
      iconBg: 'bg-green-500/10 text-green-500',
    },
    {
      icon: <Calendar size={24} />,
      label: 'Next Payout',
      value: '₹0',
      footer: 'Estimated for next Friday',
      gradient: null,
      textColor: 'text-[var(--text-main)]',
      footerColor: 'text-[var(--text-muted)]',
      borderColor: 'border-[var(--border-main)]',
      iconBg: 'bg-amber-500/10 text-amber-500',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Earnings</h1>
          <p className="text-[var(--text-muted)] font-medium">Track your income and payment history</p>
        </div>
        <button
          onClick={handleExport}
          className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] flex items-center gap-2 px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all"
        >
          <Download size={18} /> Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className={`card p-8 space-y-4 overflow-hidden relative ${stat.gradient ? `bg-gradient-to-br ${stat.gradient} border-0` : 'bg-[var(--bg-card)] border border-[var(--border-main)]'} shadow-xl`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${stat.footerColor} opacity-80`}>{stat.label}</p>
              <h2 className={`text-4xl font-black mt-1 ${stat.textColor}`}>{stat.value}</h2>
            </div>
            <div className={`pt-4 border-t ${stat.borderColor} flex items-center gap-2 text-xs font-bold ${stat.footerColor}`}>
              {stat.footer}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="card overflow-hidden bg-[var(--bg-card)] border border-[var(--border-main)]">
        <div className="p-8 border-b border-[var(--border-main)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Recent Payments</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input py-2 pl-10 text-sm w-full md:w-64 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] focus:ring-primary-500/30 transition-all"
              />
            </div>
            <button className="p-2 border border-[var(--border-main)] rounded-xl hover:bg-[var(--bg-main)] transition-colors text-[var(--text-muted)]">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-main)]/60">
              <tr>
                {['Date', 'Service', 'Type', 'Status', 'Amount'].map((h, i) => (
                  <th key={h} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-[var(--text-main)]">{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-tighter">ID: {payment.razorpayPaymentId || payment._id.slice(-8)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-[var(--text-main)] capitalize">{payment.booking?.serviceType?.replace('_', ' ')}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {payment.booking?.startDate ? format(new Date(payment.booking.startDate), 'MMM dd') : 'N/A'} –{' '}
                      {payment.booking?.endDate ? format(new Date(payment.booking.endDate), 'MMM dd') : 'N/A'}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-[var(--text-muted)] capitalize">{payment.booking?.durationType}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                      Paid
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-lg font-black text-[var(--text-main)]">₹{payment.agencyAmount}</p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto border border-dashed border-[var(--border-main)]">
                        <DollarSign size={24} className="text-[var(--text-muted)] opacity-30" />
                      </div>
                      <p className="text-[var(--text-muted)] font-medium">
                        {searchTerm ? 'No transactions match your search.' : 'No payment history found yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CaregiverEarnings;
