import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-extrabold text-primary-600 tracking-widest">404</h1>
      <div className="bg-secondary-500 px-2 text-sm rounded rotate-12 absolute mb-16">
        Page Not Found
      </div>
      <p className="text-gray-500 mt-8 mb-12 text-lg max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="btn btn-primary flex items-center gap-2 px-6">
          <Home size={20} /> Back to Home
        </Link>
        <button 
          onClick={() => window.history.back()} 
          className="btn btn-outline flex items-center gap-2 px-6"
        >
          <ArrowLeft size={20} /> Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
