import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Globe, MessageCircle, Shield, User, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-xl">
                <Heart className="text-white" size={20} fill="currentColor" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                CareConnect
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Empowering families with trusted, professional care. Our mission is to provide the highest quality home care services through verified professionals.
            </p>
            <div className="flex gap-4">
              {[Globe, MessageCircle, Shield, User].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/about" className="hover:text-primary-500 transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-primary-500 transition-colors">Our Services</Link></li>
              <li><Link to="/contact" className="hover:text-primary-500 transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/help" className="hover:text-primary-500 transition-colors">Help Center</Link></li>
              <li><Link to="/faq" className="hover:text-primary-500 transition-colors">FAQs</Link></li>
              <li><Link to="/careers" className="hover:text-primary-500 transition-colors">Careers</Link></li>
              <li><Link to="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">Subscribe to our newsletter for the latest updates and health tips.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-gray-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-primary-500"
              />
              <button className="btn btn-primary px-4">Join</button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} CareConnect. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Mail size={14} /> support@careconnect.com</span>
            <span className="flex items-center gap-1"><Phone size={14} /> +1 (555) 000-0000</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
