import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  useGetHospitalProfileQuery, 
  useUpdateHospitalProfileMutation 
} from '../../../../features/hospitals/hospitalApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Shield, ShieldAlert, ShieldCheck, Save, Building, Phone, Mail, Globe, MapPin, AlertCircle } from 'lucide-react';

const HospitalProfile = () => {
  const { data: response, isLoading } = useGetHospitalProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateHospitalProfileMutation();
  
  const hospital = response?.data;

  // Active form section
  const [activeSection, setActiveSection] = useState('general');

  // Form State
  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationNumber: '',
    type: 'private',
    phone: '',
    email: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      email: ''
    }
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (hospital) {
      setFormData({
        hospitalName: hospital.hospitalName || '',
        registrationNumber: hospital.registrationNumber || '',
        type: hospital.type || 'private',
        phone: hospital.phone || '',
        email: hospital.email || '',
        website: hospital.website || '',
        address: {
          street: hospital.address?.street || '',
          city: hospital.address?.city || '',
          state: hospital.address?.state || '',
          country: hospital.address?.country || '',
          zipCode: hospital.address?.zipCode || ''
        },
        emergencyContact: {
          name: hospital.emergencyContact?.name || '',
          phone: hospital.emergencyContact?.phone || '',
          email: hospital.emergencyContact?.email || ''
        }
      });
    }
  }, [hospital]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hospitalName.trim() || !formData.registrationNumber.trim()) {
      toast.error('Hospital Name and Registration Number are required.');
      return;
    }

    try {
      await updateProfile({
        id: hospital._id,
        ...formData
      }).unwrap();
      toast.success('Hospital profile updated successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Verification badge renderer
  const renderVerificationBadge = () => {
    switch (hospital?.status) {
      case 'approved':
        return (
          <div className="flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={18} />
            Verified & Active
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
            <ShieldAlert size={18} />
            Verification Rejected
          </div>
        );
      case 'suspended':
        return (
          <div className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
            <ShieldAlert size={18} />
            Account Suspended
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest animate-pulse">
            <Shield size={18} />
            Verification Pending
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header and status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Hospital Profile</h1>
          <p className="text-[var(--text-muted)] font-medium">Manage verification credentials, public presentation, and emergency communication channels.</p>
        </div>
        <div>
          {renderVerificationBadge()}
        </div>
      </div>

      {hospital?.status === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-sm text-yellow-700">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Awaiting Admin Verification</p>
            <p className="text-xs text-yellow-600 mt-1">Some actions, such as admitting patients and assigning home care referrals, are restricted until the admin team approves your license credentials.</p>
          </div>
        </div>
      )}

      {hospital?.adminNote && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex gap-3 text-sm text-[var(--text-main)]">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-bold text-red-500">Notice from Administrators</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 whitespace-pre-wrap">{hospital.adminNote}</p>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="card bg-[var(--bg-card)] border-[var(--border-main)] p-4 space-y-2 lg:col-span-1">
          <button
            onClick={() => setActiveSection('general')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
              activeSection === 'general'
              ? 'bg-primary-600/10 text-primary-600 border-l-4 border-primary-600'
              : 'hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Building size={16} />
            General Info
          </button>
          <button
            onClick={() => setActiveSection('address')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
              activeSection === 'address'
              ? 'bg-primary-600/10 text-primary-600 border-l-4 border-primary-600'
              : 'hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <MapPin size={16} />
            Address / Location
          </button>
          <button
            onClick={() => setActiveSection('emergency')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
              activeSection === 'emergency'
              ? 'bg-primary-600/10 text-primary-600 border-l-4 border-primary-600'
              : 'hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Phone size={16} />
            Emergency Contacts
          </button>
        </div>

        {/* Editor Form */}
        <div className="lg:col-span-3 card bg-[var(--bg-card)] border-[var(--border-main)] shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {activeSection === 'general' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-[var(--text-main)] pb-2 border-b border-[var(--border-main)]">General Institution Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Hospital Name</label>
                    <input
                      required
                      type="text"
                      name="hospitalName"
                      value={formData.hospitalName}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="City General Hospital"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Registration / License Number</label>
                    <input
                      required
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className="input font-mono bg-[var(--bg-main)]/50"
                      placeholder="HOSP-9921-202"
                      disabled={hospital?.isVerified} // Disable editing once verified for security
                    />
                    {hospital?.isVerified && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Contact careconnect support to request changes to verified registration credentials.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Hospital Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="government">Government Hospital</option>
                      <option value="private">Private Hospital</option>
                      <option value="clinic">Outpatient Clinic</option>
                      <option value="nursing_home">Nursing & Rehabilitation Home</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Website URL</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Globe size={16} />
                      </span>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="input pl-9"
                        placeholder="https://hospital.org"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">General Phone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Phone size={16} />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input pl-9"
                        placeholder="+1 (555) 019-2834"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">General Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input pl-9"
                        placeholder="info@hospital.org"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'address' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-[var(--text-main)] pb-2 border-b border-[var(--border-main)]">Physical Location Address</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={e => handleNestedInputChange('address', 'street', e.target.value)}
                      className="input"
                      placeholder="100 Medical Center Parkway"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={e => handleNestedInputChange('address', 'city', e.target.value)}
                      className="input"
                      placeholder="Metro City"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">State / Province</label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={e => handleNestedInputChange('address', 'state', e.target.value)}
                      className="input"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Zip / Postal Code</label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={e => handleNestedInputChange('address', 'zipCode', e.target.value)}
                      className="input font-mono"
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Country</label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={e => handleNestedInputChange('address', 'country', e.target.value)}
                      className="input"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'emergency' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-[var(--text-main)] pb-2 border-b border-[var(--border-main)]">Emergency Dispatch Channels</h2>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Configure the primary contact channels used for real-time SOS alerts and high-urgency notifications.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Dispatcher Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={e => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                      className="input"
                      placeholder="ER Desk / Head Nurse"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">SOS Phone Line</label>
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={e => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                      className="input font-semibold text-red-600"
                      placeholder="+1 (555) 911-0199"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Emergency Email</label>
                    <input
                      type="email"
                      value={formData.emergencyContact.email}
                      onChange={e => handleNestedInputChange('emergencyContact', 'email', e.target.value)}
                      className="input"
                      placeholder="er@hospital.org"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-[var(--border-main)] flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="btn btn-primary flex items-center justify-center gap-2 shadow-lg"
              >
                {isUpdating ? <LoadingSpinner size="sm" /> : <><Save size={16} /> Save Profile Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfile;
