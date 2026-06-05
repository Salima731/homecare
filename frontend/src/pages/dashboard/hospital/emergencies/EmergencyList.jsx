import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, AlertCircle, Activity, MapPin } from 'lucide-react';
import { useGetHospitalEmergenciesQuery } from '../../../../features/hospitals/hospitalApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectCurrentToken } from '../../../../features/auth/authSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5005';

const EmergencyList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [liveEmergencies, setLiveEmergencies] = useState([]);
  
  const { data: response, isLoading } = useGetHospitalEmergenciesQuery();
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectCurrentToken);

  // Initialize from API
  useEffect(() => {
    if (response?.data) {
      setLiveEmergencies(response.data);
    }
  }, [response]);

  // Socket Connection for Real-time Updates
  useEffect(() => {
    if (!user || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to emergency socket');
      socket.emit('authenticate', token);
    });

    socket.on('emergency_created', (data) => {
      // Add new emergency to the top
      setLiveEmergencies((prev) => [data, ...prev.filter(e => e._id !== data._id)]);
      toast.error('NEW EMERGENCY ALERT!', {
        icon: '🚨',
        style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '1.2rem', padding: '16px' },
      });
    });

    socket.on('emergency_updated', (data) => {
      setLiveEmergencies((prev) => prev.map(e => e._id === data._id ? { ...e, ...data } : e));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token]);

  const filteredEmergencies = liveEmergencies.filter(e => 
    e.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Emergency Response</h1>
          <p className="text-[var(--text-muted)] font-medium">Monitor active SOS alerts and dispatched emergencies.</p>
        </div>
      </div>

      <div className="card p-0 bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-main)]/30">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by patient or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 bg-[var(--bg-card)] border-[var(--border-main)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Monitoring</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {filteredEmergencies.length > 0 ? (
                  filteredEmergencies.map((incident) => (
                    <tr key={incident._id} className={`hover:bg-[var(--bg-main)]/50 transition-colors ${incident.status === 'active' ? 'bg-red-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        {incident.severity === 'critical' ? (
                           <div className="flex items-center gap-2 text-red-600">
                             <AlertTriangle size={18} className="animate-pulse" />
                             <span className="font-black text-xs uppercase tracking-widest">Critical</span>
                           </div>
                        ) : (
                           <div className="flex items-center gap-2 text-orange-500">
                             <AlertCircle size={18} />
                             <span className="font-bold text-xs uppercase tracking-widest">{incident.severity}</span>
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[var(--text-main)] text-sm">{incident.patient?.name || 'Unknown Patient'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[var(--bg-main)] border border-[var(--border-main)] px-2 py-1 rounded text-xs font-bold capitalize text-[var(--text-main)]">
                          {incident.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          incident.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          incident.status === 'active' ? 'bg-red-500/10 text-red-600 border-red-500/30' : 
                          'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-main)]">
                        {incident.location?.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-[var(--text-muted)]" />
                            <span className="truncate max-w-[150px] inline-block" title={incident.location.address}>
                              {incident.location.address}
                            </span>
                          </div>
                        ) : 'Location pending...'}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-[var(--text-muted)]">
                        {new Date(incident.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-[var(--text-muted)]">
                      <Activity size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="font-bold text-lg">No Active Emergencies</p>
                      <p className="text-sm mt-1 text-green-500 font-bold">All clear. Monitoring is active.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyList;
