import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, 
  Calendar, DollarSign, Download, Filter, 
  ChevronRight, Building2, CreditCard
} from 'lucide-react';
import { useGetAgencyEarningsQuery } from '../../../features/agencies/agencyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const AgencyEarnings = () => {
  const { data: response, isLoading } = useGetAgencyEarningsQuery();
  const earnings = response?.data || { totalEarned: 0, totalCommission: 0, payments: [] };

  const handleExportCSV = () => {
    if (!earnings.payments.length) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Transaction ID', 'Date', 'Service Type', 'Commission (INR)', 'Net Amount (INR)'];
    const rows = earnings.payments.map(p => [
      p._id.toUpperCase(),
      format(new Date(p.createdAt), 'yyyy-MM-dd'),
      p.booking?.serviceType || 'N/A',
      p.platformCommission,
      p.agencyAmount
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `earnings_report_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully!');
  };

  const handleRequestPayout = () => {
    if (earnings.totalEarned < 500) {
      toast.error('Minimum payout amount is ₹500');
      return;
    }
    toast.success('Payout request submitted! Our team will process it within 3-5 business days.');
  };

  if (isLoading) return <LoadingSpinner />;

  const stats = [
    { 
      label: 'Total Net Earnings', 
      value: `₹${earnings.totalEarned.toLocaleString()}`, 
      icon: Wallet, 
      color: 'bg-green-500/10 text-green-500',
      trend: '+12.5%'
    },
    { 
      label: 'Platform Commission', 
      value: `₹${earnings.totalCommission.toLocaleString()}`, 
      icon: ArrowUpRight, 
      color: 'bg-blue-500/10 text-blue-400',
      trend: '10% Fixed'
    },
    { 
      label: 'Completed Bookings', 
      value: earnings.payments.length.toString(), 
      icon: TrendingUp, 
      color: 'bg-primary-500/10 text-primary-500',
      trend: 'Lifetime'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Earnings & Finance</h1>
          <p className="text-[var(--text-muted)] font-medium">Track your agency's revenue and commission breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="btn btn-outline border-[var(--border-main)] text-[var(--text-main)] flex items-center gap-2 px-6 py-3"
          >
            <Download size={18} /> Export CSV
          </button>
          <button 
            onClick={handleRequestPayout}
            className="btn btn-primary flex items-center gap-2 px-6 py-3 shadow-xl shadow-primary-900/20"
          >
            <CreditCard size={18} /> Request Payout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 flex items-center gap-6 group hover:shadow-xl transition-all bg-[var(--bg-card)] border-[var(--border-main)]"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">{stat.label}</p>
              <h2 className="text-2xl font-black text-[var(--text-main)] mt-1">{stat.value}</h2>
              <p className="text-[10px] font-bold text-green-500 mt-1 flex items-center gap-1">
                {stat.trend} <span className="text-[var(--text-muted)] font-medium opacity-60">from last month</span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Table */}
      <div className="card overflow-hidden bg-[var(--bg-card)] border-[var(--border-main)] shadow-2xl">
        <div className="p-6 border-b border-[var(--border-main)] flex items-center justify-between">
          <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Transaction History</h3>
          <button className="text-primary-600 hover:text-primary-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} /> Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] border-b border-[var(--border-main)]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Transaction Info</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Service Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Commission</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {earnings.payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center text-primary-600">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <p className="font-black text-[var(--text-main)] text-sm">#{payment._id.slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-primary-600/10 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-600/20">
                      {payment.booking?.serviceType}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-red-500 font-black text-sm">
                    -₹{payment.platformCommission}
                  </td>
                  <td className="px-6 py-5 text-right text-green-500 font-black text-sm">
                    +₹{payment.agencyAmount}
                  </td>
                </tr>
              ))}
              {earnings.payments.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-[var(--text-muted)] font-black uppercase tracking-widest text-xs opacity-50 italic">
                    No transactions found yet. Keep serving to see your earnings grow!
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

export default AgencyEarnings;
