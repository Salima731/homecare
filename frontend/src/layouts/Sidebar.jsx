import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, User, Calendar, History, 
  Settings, LogOut, Bell, Menu, X, 
  ChevronRight, Users, Shield, Star, DollarSign,
  AlertCircle, MessageSquare, Heart, Search,
  Building2, FileText, ClipboardList, Stethoscope,
  HeartHandshake
} from 'lucide-react';
import { logOut, selectCurrentUser } from '../features/auth/authSlice';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
  };

  const getMenuItems = () => {
    const commonItems = [
      { name: 'Profile', icon: <User size={20} />, path: `/dashboard/${user?.role}/profile` },
      { name: 'Settings', icon: <Settings size={20} />, path: `/dashboard/${user?.role}/settings` },
    ];

    switch (user?.role) {
      case 'admin':
        return [
          { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/dashboard/admin' },
          { name: 'Agencies', icon: <Users size={20} />, path: '/dashboard/admin/agencies' },
          { name: 'Hospitals', icon: <Building2 size={20} />, path: '/dashboard/admin/hospitals' },
          { name: 'Doctors', icon: <Stethoscope size={20} />, path: '/dashboard/admin/doctors' },
          { name: 'Users', icon: <Shield size={20} />, path: '/dashboard/admin/users' },
          { name: 'Bookings', icon: <Calendar size={20} />, path: '/dashboard/admin/bookings' },
          { name: 'Appointments', icon: <ClipboardList size={20} />, path: '/dashboard/admin/appointments' },
          {
  name: 'Caregivers',
  icon: <Users size={20} />,
  path: '/dashboard/admin/caregivers'
},
          { name: 'Payments', icon: <DollarSign size={20} />, path: '/dashboard/admin/payments' },
          { name: 'Complaints', icon: <AlertCircle size={20} />, path: '/dashboard/admin/complaints' },
          ...commonItems
        ];
      case 'agency':
        return [
          { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/dashboard/agency' },
          { name: 'Caregivers', icon: <Users size={20} />, path: '/dashboard/agency/caregivers' },
          { name: 'Bookings', icon: <Calendar size={20} />, path: '/dashboard/agency/bookings' },
          { name: 'Earnings', icon: <DollarSign size={20} />, path: '/dashboard/agency/earnings' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/dashboard/agency/messages' },
          { name: 'Referrals', icon: <HeartHandshake size={20} />, path: '/dashboard/agency/referrals' },
          
          ...commonItems
        ];
      case 'caregiver':
        return [
          { name: 'Schedule', icon: <Calendar size={20} />, path: '/dashboard/caregiver' },
          { name: 'Assigned Jobs', icon: <History size={20} />, path: '/dashboard/caregiver/jobs' },
          { name: 'Health Monitoring', icon: <Heart size={20} />, path: '/dashboard/caregiver/health' },
          { name: 'Prescriptions', icon: <FileText size={20} />, path: '/dashboard/caregiver/prescriptions' },
          { name: 'Earnings', icon: <DollarSign size={20} />, path: '/dashboard/caregiver/earnings' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/dashboard/caregiver/messages' },
          { name: 'Reviews', icon: <Star size={20} />, path: '/dashboard/caregiver/reviews' },
          ...commonItems
        ];
      case 'hospital':
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard/hospital' },
          { name: 'Departments', icon: <Shield size={20} />, path: '/dashboard/hospital/departments' },
          { name: 'Doctors', icon: <Stethoscope size={20} />, path: '/dashboard/hospital/doctors' },
          { name: 'Appointments', icon: <Calendar size={20} />, path: '/dashboard/hospital/appointments' },
          { name: 'Prescriptions', icon: <FileText size={20} />, path: '/dashboard/hospital/prescriptions' },
          { name: 'Patients', icon: <Heart size={20} />, path: '/dashboard/hospital/patients' },
          { name: 'Referrals', icon: <ClipboardList size={20} />, path: '/dashboard/hospital/referrals' },
          // { name: 'Emergencies', icon: <AlertCircle size={20} />, path: '/dashboard/hospital/emergencies' },
          ...commonItems
        ];
      case 'family':
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard/family' },
          { name: 'Patient Overview', icon: <User size={20} />, path: '/dashboard/family/patient' },
          { name: 'Health Reports', icon: <Heart size={20} />, path: '/dashboard/family/health' },
          { name: 'Medications', icon: <History size={20} />, path: '/dashboard/family/medications' },
          
          { name: 'Bookings', icon: <Calendar size={20} />, path: '/dashboard/family/bookings' },
          { name: 'Emergencies', icon: <AlertCircle size={20} />, path: '/dashboard/family/emergencies' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/dashboard/family/messages' },
          ...commonItems
        ];
        
      case 'doctor':
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard/doctor' },
          { name: 'Appointments', icon: <Calendar size={20} />, path: '/dashboard/doctor/appointments' },
          { name: 'Patients', icon: <Users size={20} />, path: '/dashboard/doctor/patients' },
          { name: 'Prescriptions', icon: <FileText size={20} />, path: '/dashboard/doctor/prescriptions' },
          ...commonItems
        ];

      case 'user':
      default:
        return [
          { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard/user' },
          { name: 'Find Caregivers', icon: <Search size={20} />, path: '/dashboard/user/caregivers' },
          { name: 'Find Doctors', icon: <Search size={20} />, path: '/dashboard/user/doctors' },
          { name: 'My Favorites', icon: <Heart size={20} />, path: '/dashboard/user/favorites' },
          { name: 'My Bookings', icon: <ClipboardList size={20} />, path: '/dashboard/user/bookings' },
          { name: 'Doctor Appointments', icon: <Calendar size={20} />, path: '/dashboard/user/appointments' },
          { name: 'Prescriptions', icon: <FileText size={20} />, path: '/dashboard/user/prescriptions' },
          { name: 'Payments', icon: <DollarSign size={20} />, path: '/dashboard/user/payments' },
          { name: 'Complaints', icon: <AlertCircle size={20} />, path: '/dashboard/user/complaints' },
          { name: 'Messages', icon: <MessageSquare size={20} />, path: '/dashboard/user/messages' },
          ...commonItems
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--bg-card)] border-r border-[var(--border-main)] text-[var(--text-main)] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-main)]">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary-600">
            Care<span className={user?.role === 'admin' ? 'text-red-500' : 'text-primary-500'}>Connect</span>
          </Link>
        </div>

        {/* User Profile Summary */}
        <div className="p-6 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-lg font-bold text-white shadow-lg">
              {user?.name?.[0]?.toUpperCase() || <User size={20} />}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold truncate text-sm">{user?.name}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
                  : 'text-[var(--text-muted)] hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20'
                }`}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--border-main)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
