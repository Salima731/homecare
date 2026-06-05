import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, ArrowUpRight, CheckCircle, Clock, XCircle, Info } from 'lucide-react';
import { useGetAllBookingsQuery } from '../../../features/admin/adminApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const AdminBookings = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: response, isLoading } = useGetAllBookingsQuery({ 
    status: statusFilter,
    search: searchTerm 
  });
  
  const bookings = response?.data || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight uppercase tracking-widest">Master Bookings</h1>
          <p className="text-[var(--text-muted)] font-medium">Global oversight of all service appointments across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-sm outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="assigned">Assigned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] border-b border-[var(--border-main)]">
              <tr>
                <th className="px-6 py-5">ID & Service</th>
                <th className="px-6 py-5">Client</th>
                <th className="px-6 py-5">Agency / Staff</th>
                <th className="px-6 py-5">Date & Duration</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-primary-600/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-600/10 text-primary-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{booking.serviceType.replace('_', ' ')}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-bold">#{booking._id.substring(18).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[var(--text-main)]">{booking.user?.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{booking.user?.email}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-primary-600 uppercase tracking-tighter">{booking.agency?.agencyName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase">{booking.caregiver?.name || 'Unassigned'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[var(--text-main)]">{new Date(booking.startDate).toLocaleDateString()}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-black uppercase">{booking.durationType}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border flex items-center gap-1.5 w-fit ${
                        booking.status === 'completed' ? 'bg-green-600/10 text-green-500 border-green-600/20' :
                        booking.status === 'cancelled' ? 'bg-red-600/10 text-red-500 border-red-600/20' :
                        booking.status === 'ongoing' ? 'bg-blue-600/10 text-blue-500 border-blue-600/20' :
                        booking.status === 'assigned' ? 'bg-indigo-600/10 text-indigo-500 border-indigo-600/20' :
                        'bg-amber-600/10 text-amber-500 border-amber-600/20'
                      }`}>
                        {booking.status === 'completed' && <CheckCircle size={10} />}
                        {booking.status === 'pending' && <Clock size={10} />}
                        {booking.status === 'cancelled' && <XCircle size={10} />}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-sm font-black text-[var(--text-main)] tracking-tight">₹{booking.totalAmount}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest ${booking.isPaid ? 'text-green-500' : 'text-amber-500'}`}>
                        {booking.isPaid ? 'PAID' : 'PENDING'}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Info size={48} className="mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest">No bookings found</p>
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

export default AdminBookings;
