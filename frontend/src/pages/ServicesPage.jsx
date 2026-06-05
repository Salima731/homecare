import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Home, HeartPulse, UserCheck, Baby, Stethoscope } from 'lucide-react';

const ServicesPage = () => {
  const services = [
    { icon: <HeartPulse />, title: 'Elderly Care', desc: 'Compassionate support for seniors, including mobility assistance, medication management, and companionship.' },
    { icon: <Stethoscope />, title: 'Post-Surgical Care', desc: 'Professional nursing care and rehabilitation support for patients recovering from surgery at home.' },
    { icon: <Baby />, title: 'Baby Sitting', desc: 'Trusted childcare services for infants and toddlers, provided by background-checked caregivers.' },
    { icon: <UserCheck />, title: 'Special Needs Care', desc: 'Expert care for individuals with physical or cognitive disabilities, tailored to their unique needs.' },
    { icon: <Home />, title: 'Personal Care', desc: 'Assistance with daily activities such as bathing, dressing, grooming, and meal preparation.' },
    { icon: <Shield />, title: 'Safety Monitoring', desc: 'Remote and in-person monitoring to ensure the safety and well-being of your loved ones 24/7.' },
  ];

  return (
    <div className="pb-20">
      <section className="bg-gray-900 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">Our Care Services</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We provide a wide range of home care services tailored to meet the diverse needs of families and individuals.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col"
            >
              <div className="bg-primary-50 text-primary-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                {React.cloneElement(service.icon, { size: 28 })}
              </div>
              <h3 className="text-xl font-bold mb-4">{service.title}</h3>
              <p className="text-gray-600 mb-6 flex-grow">{service.desc}</p>
              <button className="text-primary-600 font-bold hover:gap-2 flex items-center transition-all group">
                Learn More <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 mt-20 py-20 border-t">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-6">How It Works</h2>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Search and Filter', desc: 'Browse our extensive network of verified caregivers based on location, skills, and ratings.' },
                { step: '02', title: 'Consult and Book', desc: 'Schedule a free consultation or book instantly. Chat directly with your chosen caregiver.' },
                { step: '03', title: 'Receive Professional Care', desc: 'Our caregivers arrive on time to provide the high-quality care your family deserves.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-4xl font-black text-gray-100">{item.step}</span>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:w-1/2 order-1 md:order-2">
            <img 
              src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=2033" 
              alt="Caregiver helping patient" 
              className="rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
