import React from 'react';
import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4"
    >
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
        <Construction size={40} />
      </div>
      <h1 className="text-3xl font-black text-gray-900">{title}</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        We're working hard to bring you the best experience. This page is currently under construction and will be available soon!
      </p>
      <button 
        onClick={() => window.history.back()}
        className="btn btn-primary px-8 py-3"
      >
        Go Back
      </button>
    </motion.div>
  );
};

export default PlaceholderPage;
