import React from 'react';
import { 
  CreditCard, ExternalLink, Download, 
  CheckCircle2, Clock, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Search
} from 'lucide-react';
import { useGetPaymentsQuery } from '../../../features/payments/paymentApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const UserPayments = () => {
  const { data: response, isLoading, error } = useGetPaymentsQuery();
  const payments = response?.data || [];

  const handleDownload = (payment) => {
    try {
      toast.loading('Generating invoice...', { id: 'invoice-gen' });
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Primary 600
      doc.text('CARECONNECT', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Muted color
    doc.text('TAX INVOICE', 14, 28);
    
    // Invoice Info
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice No: INV-${payment._id.slice(-8).toUpperCase()}`, 140, 22);
    doc.text(`Date: ${format(new Date(payment.createdAt), 'MMM dd, yyyy')}`, 140, 28);
    doc.text(`Status: ${payment.status.toUpperCase()}`, 140, 34);

    // From (Agency)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', 14, 45);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(payment.agency?.agencyName || 'Service Provider', 14, 52);
    doc.text(payment.agency?.address || 'Verified Care Provider', 14, 58);
    
    // To (User)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TO:', 140, 45);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(payment.user?.name || 'Customer', 140, 52);
    doc.text(payment.user?.email || '', 140, 58);

    // Table
    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Service Type', 'Date', 'Amount']],
      body: [
        [
          `Professional Home Care Service - Booking #${payment.booking?._id?.slice(-6).toUpperCase() || 'N/A'}`,
          payment.booking?.serviceType?.replace('_', ' ').toUpperCase() || 'CARE SERVICE',
          format(new Date(payment.createdAt), 'MMM dd, yyyy'),
          `INR ${payment.amount.toFixed(2)}`
        ]
      ],
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 70 }
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: INR ${payment.amount.toFixed(2)}`, 140, finalY);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('This is a computer-generated document and does not require a physical signature.', 14, finalY + 30);
    doc.text('Thank you for choosing CareConnect for your home care needs.', 14, finalY + 35);

    doc.save(`Invoice_${payment._id.slice(-8)}.pdf`);
      toast.success('Invoice downloaded successfully', { id: 'invoice-gen' });
    } catch (err) {
      console.error('Invoice PDF Generation Error:', err);
      toast.error('Failed to generate invoice PDF', { id: 'invoice-gen' });
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-100/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
        return 'bg-red-100/10 text-red-500 border-red-500/20';
      case 'refunded':
        return 'bg-gray-100/10 text-[var(--text-muted)] border-[var(--border-main)]';
      default:
        return 'bg-gray-100/10 text-[var(--text-muted)] border-[var(--border-main)]';
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Payment History</h1>
          <p className="text-[var(--text-muted)] font-medium">View and manage your transactions and invoices</p>
        </div>
        <div className="flex gap-4">
          <div className="card px-6 py-4 flex items-center gap-4 bg-primary-600 text-white border-none shadow-xl shadow-primary-600/20 active:scale-95 transition-all">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest opacity-80">Total Spent</p>
              <p className="text-2xl font-black">₹{payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card overflow-hidden border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
        <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-main)]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-black text-[var(--text-main)] flex items-center gap-3 uppercase tracking-widest text-xs">
            Recent Transactions
            <span className="px-2.5 py-0.5 rounded-lg bg-primary-600/10 text-primary-600 border border-primary-600/20 font-black">
              {payments.length}
            </span>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="input pl-10 py-2.5 text-xs w-full md:w-72 bg-[var(--bg-main)] border-[var(--border-main)] focus:ring-primary-600 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {payments.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-main)] bg-[var(--bg-main)]/10">
                  <th className="px-6 py-5">Transaction ID</th>
                  <th className="px-6 py-5">Service / Provider</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {payments.map((payment) => (
                  <tr key={payment._id} className="group hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl border ${payment.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {payment.status === 'completed' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-main)] font-mono">#{payment.razorpayPaymentId?.slice(-8) || payment._id.slice(-8)}</p>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mt-0.5">Razorpay</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--border-main)] shadow-sm">
                          <img 
                            src={payment.agency?.logo || `https://ui-avatars.com/api/?name=${payment.agency?.agencyName || 'Service'}&background=random`} 
                            className="w-full h-full object-cover"
                            alt="Agency"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-main)] group-hover:text-primary-600 transition-colors">{payment.booking?.serviceType?.replace('_', ' ').toUpperCase() || 'Service Payment'}</p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{payment.agency?.agencyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-[var(--text-main)]">
                        ₹{payment.amount.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest mt-0.5">{payment.currency}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleDownload(payment)}
                        className="p-2.5 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-600/10 rounded-xl transition-all active:scale-90"
                        title="Download Invoice"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-24 bg-[var(--bg-main)]/20">
              <div className="w-24 h-24 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <CreditCard size={40} className="text-[var(--text-muted)] opacity-20" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">No Transactions Yet</h3>
              <p className="text-[var(--text-muted)] max-w-xs mx-auto text-sm mt-2 font-medium">
                When you make a payment for a caregiver booking, your history will appear here.
              </p>
              <button className="btn btn-primary mt-10 px-10 py-3 font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 active:scale-95 transition-all">
                Book a Caregiver
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-start gap-4 bg-primary-600/5 border-primary-600/20 shadow-lg">
          <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-600/20">
            <CheckCircle2 size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Secure Payments</h4>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-tight">All transactions are encrypted and processed securely via Razorpay.</p>
          </div>
        </div>
        <div className="card p-6 flex items-start gap-4 bg-purple-500/5 border-purple-500/20 shadow-lg">
          <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-lg shadow-purple-500/20">
            <Download size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Tax Invoices</h4>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-tight">Download formal tax invoices for all your completed service bookings.</p>
          </div>
        </div>
        <div className="card p-6 flex items-start gap-4 bg-amber-500/5 border-amber-500/20 shadow-lg">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Refund Policy</h4>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-bold uppercase tracking-tight">Cancellations within 24 hours of service start are eligible for a partial refund.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPayments;
