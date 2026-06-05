import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Target, Eye, Users } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="space-y-20 pb-20">
      <section className="bg-primary-600 py-20 text-white text-center">
        <div className="container mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            About CareConnect
          </motion.h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            We are dedicated to revolutionizing home care by connecting compassionate caregivers with families through technology and trust.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            { icon: <Target className="text-primary-600" />, title: 'Our Mission', desc: 'To provide accessible, high-quality home care services that enhance the quality of life for seniors and individuals in need.' },
            { icon: <Eye className="text-primary-600" />, title: 'Our Vision', desc: 'To become the most trusted global platform for home care, setting new standards for safety, reliability, and compassion.' },
            { icon: <Heart className="text-primary-600" />, title: 'Our Values', desc: 'Compassion, Integrity, Excellence, and Community. These values drive everything we do.' }
          ].map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                {React.cloneElement(item.icon, { size: 32 })}
              </div>
              <h3 className="text-2xl font-bold">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=2070" 
              alt="Our Team" 
              className="rounded-2xl shadow-xl"
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-3xl font-bold">Bridging the Gap in Healthcare</h2>
            <p className="text-gray-600">
              Founded in 2024, CareConnect was born from a personal need to find reliable care for an elderly family member. We realized that the traditional agency model was often slow, expensive, and opaque.
            </p>
            <p className="text-gray-600">
              Our platform empowers families to directly connect with verified professionals, while also providing agencies with the tools they need to manage their staff and grow their business.
            </p>
            <div className="flex gap-4 items-center">
              <div className="text-primary-600 font-bold text-3xl">100+</div>
              <div className="text-gray-500 text-sm font-medium">Expert team members working to support you.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
