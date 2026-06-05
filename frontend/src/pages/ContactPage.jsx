import React from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ContactPage = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    toast.success('Message sent! We will get back to you soon.');
    reset();
  };

  return (
    <div className="pb-20">
      <section className="bg-primary-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Have questions or need assistance? Our support team is here to help you 24/7.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          {/* Contact Info */}
          <div className="lg:w-1/3 bg-gray-900 text-white p-12 space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-gray-400">Fill out the form and our team will get back to you within 24 hours.</p>
            </div>

            <div className="space-y-6">
              {[
                { icon: <Phone size={20} />, label: 'Call Us', value: '+1 (555) 000-0000' },
                { icon: <Mail size={20} />, label: 'Email Us', value: 'support@careconnect.com' },
                { icon: <MapPin size={20} />, label: 'Office', value: '123 Care Street, NY 10001' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg text-primary-500">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-12">
              <p className="text-sm font-bold mb-4">Follow Us</p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                    <MessageCircle size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:w-2/3 p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                    })}
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  {...register('subject', { required: 'Subject is required' })}
                  className={`input ${errors.subject ? 'border-red-500' : ''}`}
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  {...register('message', { required: 'Message is required' })}
                  rows="6"
                  className={`input ${errors.message ? 'border-red-500' : ''}`}
                  placeholder="Tell us more about your needs..."
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full md:w-auto px-10 py-3 flex items-center justify-center gap-2">
                <Send size={18} /> Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
