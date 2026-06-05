import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, Heart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { selectCurrentUser, logOut } from '../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    dispatch(logOut());
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
            <Heart className="text-white" size={24} fill="currentColor" />
          </div>
          <span className={`text-2xl font-black tracking-tighter ${isScrolled ? 'text-gray-900' : 'text-primary-600'}`}>
            CareConnect
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`font-bold text-sm hover:text-primary-600 transition-colors ${location.pathname === link.path ? 'text-primary-600' : 'text-gray-600'}`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-gray-200"></div>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="btn btn-primary text-sm px-5 flex items-center gap-2">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-600 font-bold text-sm hover:text-primary-600">Log In</Link>
              <Link to="/register" className="btn btn-primary text-sm px-6">Join Now</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden text-gray-900" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t mt-4 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-bold text-gray-900 border-b pb-2"
                >
                  {link.name}
                </Link>
              ))}
              {!user ? (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn border border-gray-200 text-center">Login</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary text-center">Register</Link>
                </div>
              ) : (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="btn btn-primary text-center">Dashboard</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Header;
