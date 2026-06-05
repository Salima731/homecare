import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, User, LogOut, Settings, UserCircle, Shield, Moon, Sun, LayoutDashboard, Calendar, DollarSign, Star, MessageSquare, Heart, History, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import { selectCurrentUser, logOut } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';
import { Toaster } from 'react-hot-toast' ;
import { useGetNotificationsQuery, useMarkAllAsReadMutation, useMarkAsReadMutation } from '../features/notifications/notificationApiSlice';

const ROLE_ROUTES = {
  admin: [
    { label: 'Overview', path: '/dashboard/admin', icon: <LayoutDashboard size={16} /> },
    { label: 'Agencies', path: '/dashboard/admin/agencies', icon: <Shield size={16} /> },
    { label: 'Users', path: '/dashboard/admin/users', icon: <User size={16} /> },
    { label: 'Bookings', path: '/dashboard/admin/bookings', icon: <Calendar size={16} /> },
    { label: 'Payments', path: '/dashboard/admin/payments', icon: <DollarSign size={16} /> },
    { label: 'Complaints', path: '/dashboard/admin/complaints', icon: <Bell size={16} /> },
    { label: 'Profile', path: '/dashboard/admin/profile', icon: <UserCircle size={16} /> },
    { label: 'Settings', path: '/dashboard/admin/settings', icon: <Settings size={16} /> },
  ],
  agency: [
    { label: 'Overview', path: '/dashboard/agency', icon: <LayoutDashboard size={16} /> },
    { label: 'Caregivers', path: '/dashboard/agency/caregivers', icon: <User size={16} /> },
    { label: 'Bookings', path: '/dashboard/agency/bookings', icon: <Calendar size={16} /> },
    { label: 'Earnings', path: '/dashboard/agency/earnings', icon: <DollarSign size={16} /> },
    { label: 'Messages', path: '/dashboard/agency/messages', icon: <MessageSquare size={16} /> },
    { label: 'Profile', path: '/dashboard/agency/profile', icon: <UserCircle size={16} /> },
    { label: 'Settings', path: '/dashboard/agency/settings', icon: <Settings size={16} /> },
  ],
  caregiver: [
    { label: 'Schedule', path: '/dashboard/caregiver', icon: <Calendar size={16} /> },
    { label: 'Assigned Jobs', path: '/dashboard/caregiver/jobs', icon: <History size={16} /> },
    { label: 'Health Monitoring', path: '/dashboard/caregiver/health', icon: <Heart size={16} /> },
    { label: 'Earnings', path: '/dashboard/caregiver/earnings', icon: <DollarSign size={16} /> },
    { label: 'Messages', path: '/dashboard/caregiver/messages', icon: <MessageSquare size={16} /> },
    { label: 'Reviews', path: '/dashboard/caregiver/reviews', icon: <Star size={16} /> },
    { label: 'Profile', path: '/dashboard/caregiver/profile', icon: <UserCircle size={16} /> },
    { label: 'Settings', path: '/dashboard/caregiver/settings', icon: <Settings size={16} /> },
  ],
  user: [
    { label: 'Dashboard', path: '/dashboard/user', icon: <LayoutDashboard size={16} /> },
    { label: 'Find Caregivers', path: '/dashboard/user/caregivers', icon: <Search size={16} /> },
    { label: 'My Favorites', path: '/dashboard/user/favorites', icon: <Heart size={16} /> },
    { label: 'My Bookings', path: '/dashboard/user/bookings', icon: <Calendar size={16} /> },
    { label: 'Payments', path: '/dashboard/user/payments', icon: <DollarSign size={16} /> },
    { label: 'Complaints', path: '/dashboard/user/complaints', icon: <AlertTriangle size={16} /> },
    { label: 'Messages', path: '/dashboard/user/messages', icon: <MessageSquare size={16} /> },
    { label: 'Profile', path: '/dashboard/user/profile', icon: <UserCircle size={16} /> },
    { label: 'Settings', path: '/dashboard/user/settings', icon: <Settings size={16} /> },
  ],
  hospital: [
    { label: 'Dashboard', path: '/dashboard/hospital', icon: <LayoutDashboard size={16} /> },
    { label: 'Departments', path: '/dashboard/hospital/departments', icon: <Shield size={16} /> },
    { label: 'Doctors', path: '/dashboard/hospital/doctors', icon: <User size={16} /> },
    { label: 'Patients', path: '/dashboard/hospital/patients', icon: <Heart size={16} /> },
    { label: 'Referrals', path: '/dashboard/hospital/referrals', icon: <Calendar size={16} /> },
    { label: 'Emergencies', path: '/dashboard/hospital/emergencies', icon: <AlertTriangle size={16} /> },
    { label: 'Profile', path: '/dashboard/hospital/profile', icon: <UserCircle size={16} /> },
    { label: 'Settings', path: '/dashboard/hospital/settings', icon: <Settings size={16} /> },
  ],
  family: [
    { label: 'Dashboard', path: '/dashboard/family', icon: <LayoutDashboard size={16} /> },
    { label: 'Patient Overview', path: '/dashboard/family/patient', icon: <User size={16} /> },
    { label: 'Health Reports', path: '/dashboard/family/health', icon: <Heart size={16} /> },
    { label: 'Medications', path: '/dashboard/family/medications', icon: <History size={16} /> },
    { label: 'Attendance', path: '/dashboard/family/attendance', icon: <Calendar size={16} /> },
    { label: 'Bookings', path: '/dashboard/family/bookings', icon: <Calendar size={16} /> },
    { label: 'Emergencies', path: '/dashboard/family/emergencies', icon: <AlertTriangle size={16} /> },
    { label: 'Messages', path: '/dashboard/family/messages', icon: <MessageSquare size={16} /> },
    { label: 'Profile', path: '/dashboard/family/profile', icon: <UserCircle size={16} /> },
    { label: 'Settings', path: '/dashboard/family/settings', icon: <Settings size={16} /> },
  ],
  doctor: [
    { label: 'Dashboard', path: '/dashboard/doctor', icon: <LayoutDashboard size={16} /> },
    { label: 'Profile', path: '/dashboard/doctor/profile', icon: <UserCircle size={16} /> },
  ],
  patient: [
    { label: 'Dashboard', path: '/dashboard/patient', icon: <LayoutDashboard size={16} /> },
    { label: 'Profile', path: '/dashboard/patient/profile', icon: <UserCircle size={16} /> },
  ],
};

const DashboardLayout = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  
  const user = useSelector(selectCurrentUser);
  const token = useSelector(state => state.auth.token);
  const { data: notifData } = useGetNotificationsQuery({ limit: 5 }, { skip: !user || !token });
  const [markAllRead] = useMarkAllAsReadMutation();
  const [markRead] = useMarkAsReadMutation();

  const notifications = notifData?.data?.notifications || [];
  const unreadCount = Number(notifData?.data?.unreadCount) || 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const allRoutes = ROLE_ROUTES[user?.role] || [];
  const filteredRoutes = searchQuery.trim()
    ? allRoutes.filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : allRoutes;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(i => Math.min(i + 1, filteredRoutes.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filteredRoutes[searchIndex]) {
      navigate(filteredRoutes[searchIndex].path);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
    if (e.key === 'Escape') { setIsSearchOpen(false); setSearchQuery(''); }
  };

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden transition-colors duration-300">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-main)] flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-primary-600">
              <Menu size={24} />
            </button>
            <Link to="/" className="text-xl font-bold text-primary-600">CareConnect</Link>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md relative" ref={searchRef}>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-muted)] pointer-events-none z-10">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search pages... (↑↓ navigate, Enter to go)"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); setSearchIndex(0); }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-main)] rounded-xl bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
            />
            <AnimatePresence>
              {isSearchOpen && filteredRoutes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2 space-y-0.5">
                    {filteredRoutes.map((route, i) => (
                      <button
                        key={route.path}
                        onClick={() => { navigate(route.path); setSearchQuery(''); setIsSearchOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                          i === searchIndex
                            ? 'bg-primary-600 text-white'
                            : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                        }`}
                      >
                        <span className={i === searchIndex ? 'text-white' : 'text-[var(--text-muted)]'}>{route.icon}</span>
                        {route.label}
                        {i === searchIndex && <span className="ml-auto text-[10px] font-black opacity-60 uppercase tracking-widest">Enter ↵</span>}
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-[var(--border-main)] text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-50">
                    {filteredRoutes.length} result{filteredRoutes.length !== 1 ? 's' : ''}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-90"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-full relative transition-all active:scale-90 ${isNotifOpen ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center animate-bounce">
                    {unreadCount > 9 ? '9+' : unreadCount || 0}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-[var(--border-main)] flex items-center justify-between bg-[var(--bg-card)]">
                      <h3 className="font-black text-[var(--text-main)] text-sm uppercase tracking-widest">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAllRead()}
                          className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-[var(--border-main)]">
                          {notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => {
                                if (!notif.isRead) markRead(notif._id);
                                if (notif.link) navigate(notif.link);
                                setIsNotifOpen(false);
                              }}
                              className={`p-4 hover:bg-[var(--bg-main)] cursor-pointer transition-colors ${!notif.isRead ? 'bg-primary-50/5 border-l-4 border-l-primary-500' : ''}`}
                            >
                              <div className="flex justify-between gap-2">
                                <p className={`text-xs ${!notif.isRead ? 'font-bold text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                  {notif.message}
                                </p>
                                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1"></div>}
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">
                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center py-12">
                          <Bell className="mx-auto text-[var(--text-muted)] opacity-10 mb-3" size={40} />
                          <p className="text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <Link 
                      to={`/dashboard/${user?.role}/notifications`} 
                      className="block p-4 text-center text-[10px] font-black text-[var(--text-muted)] bg-[var(--bg-main)] hover:text-primary-600 border-t border-[var(--border-main)] uppercase tracking-widest transition-colors"
                      onClick={() => setIsNotifOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 pl-4 border-l border-[var(--border-main)] group"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-bold text-[var(--text-main)] leading-tight group-hover:text-primary-600 transition-colors">{user?.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">{user?.role}</p>
                  </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-white font-bold transform group-hover:scale-105 transition-transform overflow-hidden">
                  {(user?.avatar?.url || user?.profileImage?.url) ? (
                    <img src={user?.avatar?.url || user?.profileImage?.url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0].toUpperCase()
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-main)] py-2"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border-main)] mb-2">
                      <p className="text-xs text-[var(--text-muted)] font-bold uppercase">Account</p>
                      <p className="text-sm font-bold text-[var(--text-main)] truncate">{user?.email}</p>
                    </div>
                    
                    <Link 
                      to={`/dashboard/${user?.role}/profile`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserCircle size={18} /> Edit Profile
                    </Link>
                    <Link 
                      to={`/dashboard/${user?.role}/settings`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={18} /> Settings
                    </Link>
                    
                    {user?.role === 'admin' && (
                      <Link 
                        to="/dashboard/admin"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Shield size={18} /> Admin Panel
                      </Link>
                    )}

                    <div className="border-t border-gray-50 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;
