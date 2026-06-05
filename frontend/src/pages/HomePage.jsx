import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Clock, Star, Users, MapPin } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center bg-gradient-to-r from-primary-900 to-primary-700 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Compassionate Home Care for Your Loved Ones
            </h1>
            <p className="text-xl mb-8 text-primary-500 font-light">
              Connect with verified caregivers and agencies. Professional, reliable, and trusted support when you need it most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard/user/caregivers" className="btn bg-white text-primary-700 px-8 py-3 text-lg hover:bg-gray-100 text-center">
                Find a Caregiver
              </Link>
              <Link to="/register" className="btn btn-outline border-white text-white hover:bg-white/10 px-8 py-3 text-lg text-center">
                Join as a Partner
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose CareConnect?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">We provide a secure and efficient platform to manage all your home care needs.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck className="text-green-500" />, title: 'Verified Profiles', desc: 'Every caregiver and agency undergoes a rigorous background check and verification process.' },
            { icon: <Star className="text-yellow-500" />, title: 'Trust Scoring', desc: 'Our advanced algorithm calculates trust scores based on reviews, credentials, and experience.' },
            { icon: <Clock className="text-blue-500" />, title: '24/7 Support', desc: 'Real-time booking and scheduling with instant notifications and 24/7 emergency support.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="card text-center p-8 border-t-4 border-t-primary-500"
            >
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                {React.cloneElement(feature.icon, { size: 32 })}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Caregivers', value: '10,000+' },
              { label: 'Happy Families', value: '25,000+' },
              { label: 'Verified Agencies', value: '500+' },
              { label: 'Service Areas', value: '50+' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
