import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer, CheckCircle2, Building2, User as UserIcon, Calendar, Hash } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-3xl bg-white text-gray-900 rounded-[2rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none"
        >
          {/* Controls - Hidden during print */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="btn btn-outline py-2 px-4 flex items-center gap-2 text-xs"
              >
                <Printer size={16} /> Print
              </button>
              <button className="btn btn-primary py-2 px-4 flex items-center gap-2 text-xs">
                <Download size={16} /> Download
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Invoice Body */}
          <div className="p-12 space-y-12 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible">
            {/* Logo & Status */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">C</div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900">CareConnect</h1>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>123 Healthcare Blvd, Suite 400</p>
                  <p>San Francisco, CA 94103</p>
                  <p>support@careconnect.com</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest ${
                  payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <CheckCircle2 size={14} /> {payment.status}
                </div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">Invoice #{payment.razorpayOrderId?.slice(-8).toUpperCase() || payment._id.slice(-8).toUpperCase()}</p>
                <p className="text-gray-900 font-bold">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Bill To / From */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-100">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <UserIcon size={14} /> Bill To
                </h4>
                <div className="space-y-1">
                  <p className="font-black text-lg text-gray-900">{payment.user?.name}</p>
                  <p className="text-sm text-gray-500">{payment.user?.email}</p>
                </div>
              </div>
              <div className="space-y-4 text-right md:text-left md:pl-12 md:border-l border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Building2 size={14} /> Service Provider
                </h4>
                <div className="space-y-1">
                  <p className="font-black text-lg text-gray-900">{payment.agency?.agencyName}</p>
                  <p className="text-sm text-gray-500">Caregiver: {payment.caregiver?.name}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Service</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-6">
                        <p className="font-bold text-gray-900">{payment.booking?.serviceType} Care</p>
                        <p className="text-xs text-gray-500 mt-1">{payment.booking?.durationType} assignment</p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {payment.booking?.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right font-bold text-gray-900">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end pt-8">
              <div className="w-full md:w-64 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Subtotal</span>
                  <span className="text-gray-900 font-bold">{payment.currency} {payment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Tax (0%)</span>
                  <span className="text-gray-900 font-bold">{payment.currency} 0.00</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t-2 border-gray-900">
                  <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total</span>
                  <span className="text-2xl font-black text-gray-900">{payment.currency} {payment.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-12 border-t border-gray-100 text-center space-y-2">
              <p className="text-sm font-bold text-gray-900">Thank you for choosing CareConnect!</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Payment via {payment.paymentMethod?.toUpperCase()}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InvoiceModal;
