import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Phone, Mail, Heart, AlertTriangle,
  Calendar, Droplet, Shield, MapPin, Activity, UserCheck, Clock,
} from 'lucide-react';
import { useGetPatientByIdQuery } from '../../../../features/hospitals/hospitalApiSlice';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const InfoCard = ({ title, icon: Icon, iconColor = 'text-primary-500', children }) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-2 rounded-lg bg-[var(--bg-main)] ${iconColor}`}>
        <Icon size={18} />
      </div>
      <h3 className="font-black text-[var(--text-main)] text-sm uppercase tracking-widest">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, mono = false }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{label}</p>
    <p className={`text-sm font-semibold text-[var(--text-main)] ${mono ? 'font-mono' : ''}`}>
      {value || <span className="text-[var(--text-muted)] italic font-normal">Not provided</span>}
    </p>
  </div>
);

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useGetPatientByIdQuery(id);

  const patient = response?.data;

  if (isLoading) return <div className="p-12"><LoadingSpinner /></div>;

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--text-muted)]">
        <AlertTriangle size={48} className="mb-4 text-red-400" />
        <p className="font-bold text-lg">Patient not found</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary mt-6">Go Back</button>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bloodGroupColors = {
    'A+': 'bg-red-500/10 text-red-500 border-red-500/20',
    'A-': 'bg-red-500/10 text-red-500 border-red-500/20',
    'B+': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'B-': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'AB+': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'AB-': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'O+': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'O-': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-[var(--border-main)] hover:bg-[var(--bg-main)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Patient Details</h1>
          <p className="text-[var(--text-muted)] font-medium text-sm">Full medical profile and admission info</p>
        </div>
      </div>

      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center font-black text-3xl flex-shrink-0 border-2 border-primary-500/20">
            {patient.profileImage?.url ? (
              <img src={patient.profileImage.url} alt={patient.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              patient.name?.charAt(0)?.toUpperCase() || 'P'
            )}
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-[var(--text-main)]">{patient.name}</h2>
              {patient.bloodGroup && patient.bloodGroup !== 'unknown' && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase border ${bloodGroupColors[patient.bloodGroup] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                  <Droplet size={10} className="inline mr-1" />{patient.bloodGroup}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase border bg-blue-500/10 text-blue-500 border-blue-500/20">
                Admitted
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)] mt-2">
              {patient.user?.email && (
                <span className="flex items-center gap-1.5"><Mail size={13} />{patient.user.email}</span>
              )}
              {patient.user?.phone && (
                <span className="flex items-center gap-1.5"><Phone size={13} />{patient.user.phone}</span>
              )}
              {age && (
                <span className="flex items-center gap-1.5"><Calendar size={13} />{age} years old</span>
              )}
              {patient.gender && (
                <span className="flex items-center gap-1.5"><User size={13} capitalize>{patient.gender}</User>{patient.gender}</span>
              )}
            </div>
          </div>

          {/* ID badge */}
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-black">Patient ID</p>
            <p className="font-mono font-bold text-[var(--text-main)] text-sm mt-0.5">
              PT-{patient._id?.substring(0, 6).toUpperCase()}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 justify-end">
              <Clock size={11} />
              Admitted {format(new Date(patient.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Medical Info */}
        <InfoCard title="Medical Information" icon={Activity} iconColor="text-rose-500">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Blood Group" value={patient.bloodGroup !== 'unknown' ? patient.bloodGroup : null} />
              <Field label="Date of Birth" value={patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd MMM yyyy') : null} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Allergies</p>
              {patient.allergies?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((a, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">{a}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-[var(--text-muted)] italic">None reported</p>}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Chronic Conditions</p>
              {patient.chronicConditions?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {patient.chronicConditions.map((c, i) => (
                    <span key={i} className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">{c}</span>
                  ))}
                </div>
              ) : <p className="text-sm text-[var(--text-muted)] italic">None reported</p>}
            </div>
          </div>
        </InfoCard>

        {/* Emergency Contact */}
        <InfoCard title="Emergency Contact" icon={AlertTriangle} iconColor="text-amber-500">
          {patient.emergencyContact?.name ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={patient.emergencyContact.name} />
                <Field label="Relationship" value={patient.emergencyContact.relationship} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" value={patient.emergencyContact.phone} />
                <Field label="Email" value={patient.emergencyContact.email} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">No emergency contact on file</p>
          )}
        </InfoCard>

        {/* Insurance */}
        <InfoCard title="Insurance" icon={Shield} iconColor="text-emerald-500">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Provider" value={patient.insuranceProvider} />
              <Field label="Policy Number" value={patient.insurancePolicyNumber} mono />
            </div>
          </div>
        </InfoCard>

        {/* Address */}
        <InfoCard title="Address" icon={MapPin} iconColor="text-sky-500">
          {patient.address?.city ? (
            <div className="space-y-4">
              <Field label="Street" value={patient.address.street} />
              <div className="grid grid-cols-3 gap-4">
                <Field label="City" value={patient.address.city} />
                <Field label="State" value={patient.address.state} />
                <Field label="ZIP" value={patient.address.zipCode} mono />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">No address on file</p>
          )}
        </InfoCard>

        {/* Assignments */}
        <InfoCard title="Care Assignments" icon={UserCheck} iconColor="text-violet-500">
          <div className="space-y-4">
            <Field label="Assigned Doctor" value={patient.assignedDoctor?.name} />
            <Field label="Assigned Caregiver" value={patient.assignedCaregiver?.name} />
            <Field label="Assigned Hospital" value={patient.assignedHospital?.hospitalName || patient.assignedHospital?.name} />
          </div>
        </InfoCard>

        {/* Family Members */}
        <InfoCard title="Family Members" icon={Heart} iconColor="text-pink-500">
          {patient.familyMembers?.length > 0 ? (
            <div className="space-y-2">
              {patient.familyMembers.map((fm, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)]">
                  <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-sm">
                    {fm.name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">{fm.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{fm.relationship} {fm.phone ? `• ${fm.phone}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">No family members linked</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
};

export default PatientDetail;
