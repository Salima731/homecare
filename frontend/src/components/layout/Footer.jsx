import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="text-primary-500 w-6 h-6" />
              <span className="text-xl font-bold text-white tracking-tight">
                Care<span className="text-primary-500">Connect</span>
              </span>
            </Link>
            <p className="text-sm">
              Connecting families with compassionate caregivers and trusted agencies to provide the best home care services.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary-500 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-primary-500 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-primary-500 transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-primary-500 transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard/user/caregivers" className="hover:text-primary-500">Find Caregivers</Link></li>
              <li><Link to="/services" className="hover:text-primary-500">Our Services</Link></li>
              <li><Link to="/about" className="hover:text-primary-500">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="hover:text-primary-500">FAQ</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-500">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-500">Terms of Service</Link></li>
              <li><Link to="/help" className="hover:text-primary-500">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Newsletter</h3>
            <p className="text-sm mb-4">Subscribe to get the latest updates and news.</p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="bg-gray-800 border-none rounded-l-lg px-4 py-2 w-full focus:ring-1 focus:ring-primary-500 outline-none text-white text-sm"
              />
              <button className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-r-lg transition-colors">
                Join
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} CareConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
