import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, AlertCircle, Search, Filter, Calendar, Clock, 
  User, RefreshCw, X, ArrowRight, Activity, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetAlertsQuery } from '../../../features/emergencyAlerts/emergencyAlertApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const SEVERITY_COLORS = {
  'Critical': 'bg-red-500/10 text-red-600 border-red-500/30 animate-pulse',
  'High': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'Medium': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'Low': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const STATUS_COLORS = {
  'Open': 'bg-red-600 text-white shadow-lg shadow-red-600/10',
  'In Progress': 'bg-amber-500 text-white shadow-lg shadow-amber-500/10',
  'Resolved': 'bg-green-600 text-white shadow-lg shadow-green-600/10',
};

const EmergencyAlertsDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    severityLevel: '',
    startDate: '',
    endDate: '',
  });

  const { data: alertsResponse, isLoading, isFetching, refetch } = useGetAlertsQuery(
    { ...filters },
    { refetchOnMountOrArgChange: true }
  );

  const alerts = alertsResponse?.data || [];

  const handleClearFilters = () => {
    setFilters({ status: '', severityLevel: '', startDate: '', endDate: '' });
    setSearchTerm('');
  };

  const filteredAlerts = alerts.filter(alert => {
    const term = searchTerm.toLowerCase();
    return (
      alert.alertType?.toLowerCase().includes(term) ||
      alert.description?.toLowerCase().includes(term) ||
      alert.patientId?.name?.toLowerCase().includes(term) ||
      alert.caregiverId?.name?.toLowerCase().includes(term) ||
      alert.agencyId?.name?.toLowerCase().includes(term)
    );
  });

  // Sort critical alerts to the top
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    if (a.severityLevel === 'Critical' && b.severityLevel !== 'Critical') return -1;
    if (a.severityLevel !== 'Critical' && b.severityLevel === 'Critical') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg text-white animate-pulse">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Emergency Alerts</h1>
            <p className="text-sm font-medium text-[var(--text-muted)]">
              {user?.role === 'admin' ? 'Global incident and SOS alert panel' : 'Monitor and update active emergency tickets'}
            </p>
          </div>
        </div>

        <button 
          onClick={refetch}
          className="p-3 rounded-xl border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-card)]/50 transition-colors bg-[var(--bg-card)] shadow-sm self-start flex items-center gap-2 font-bold text-xs"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Live Indicator Banner */}
      <div className="bg-red-600/5 border-l-4 border-red-600 p-4 rounded-r-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <div>
            <p className="text-xs font-black text-red-600 uppercase tracking-widest">Live SOS Alert Dispatch Active</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Critical response team is continuously monitoring incoming signals.</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] shadow-sm p-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search alerts by caregiver, patient, type or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none text-[var(--text-main)]"
          />
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-red-500 focus:outline-none min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select 
            value={filters.severityLevel}
            onChange={(e) => setFilters(prev => ({ ...prev, severityLevel: e.target.value }))}
            className="bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-red-500 focus:outline-none min-w-[140px]"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-[var(--bg-main)]/50 border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-main)] focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {(searchTerm || filters.status || filters.severityLevel || filters.startDate || filters.endDate) && (
            <button 
              onClick={handleClearFilters}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Clear filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : sortedAlerts.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-main)] shadow-sm p-16 text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">All Safe</h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            {searchTerm || filters.status || filters.severityLevel || filters.startDate || filters.endDate
              ? "We couldn't find any emergency records matching your search filters."
              : "No emergency alerts are currently active in the system."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedAlerts.map((alert) => (
            <div 
              key={alert._id} 
              className={`bg-[var(--bg-card)] rounded-2xl border ${
                alert.status !== 'Resolved' && alert.severityLevel === 'Critical' 
                  ? 'border-red-500/50 shadow-red-500/5 bg-gradient-to-r from-red-500/5 to-transparent' 
                  : 'border-[var(--border-main)]'
              } shadow-sm overflow-hidden p-6 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 justify-between items-start md:items-center`}
            >
              <div className="space-y-4 flex-1">
                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${SEVERITY_COLORS[alert.severityLevel]}`}>
                    {alert.severityLevel}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[alert.status]}`}>
                    {alert.status}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">{alert.alertType}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">{alert.description}</p>
                </div>

                {/* Patient/Caregiver info */}
                <div className="flex flex-wrap gap-4 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-main)]/50 p-3 rounded-xl max-w-2xl border border-[var(--border-main)]">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary-600" />
                    <span>Patient: <span className="text-[var(--text-main)] font-black">{alert.patientId?.name || 'Loading...'}</span></span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-[var(--border-main)] pl-4">
                    <Activity size={14} className="text-orange-500" />
                    <span>Caregiver: <span className="text-[var(--text-main)] font-black">{alert.caregiverId?.name || 'Loading...'}</span></span>
                  </div>
                  {alert.agencyId && (
                    <div className="flex items-center gap-2 border-l border-[var(--border-main)] pl-4">
                      <ShieldAlert size={14} className="text-blue-500" />
                      <span>Agency: <span className="text-[var(--text-main)] font-black">{alert.agencyId?.name}</span></span>
                    </div>
                  )}
                </div>
              </div>

              {/* View details button */}
              <button
                onClick={() => navigate(`/dashboard/${user.role}/emergency-alerts/${alert._id}`)}
                className="btn bg-[var(--text-main)] text-[var(--bg-card)] hover:bg-[var(--text-muted)] font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2 shadow-md w-full md:w-auto justify-center"
              >
                View Details
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyAlertsDashboard;
