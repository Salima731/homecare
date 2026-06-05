import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Heart, Droplet, User, Phone, AlertTriangle,
  Activity, Shield, Save, Loader2, Plus, X, ChevronDown
} from 'lucide-react';
import {
  useGetPatientProfileQuery,
  useUpdatePatientProfileMutation,
} from '../../../features/families/familyApiSlice';

const TAG_PRESETS = {
  allergies: ['Penicillin', 'Aspirin', 'Sulfa', 'Latex', 'Peanuts', 'Shellfish', 'Dust', 'Pollen'],
  chronicConditions: ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis', 'COPD', 'Epilepsy', 'Depression'],
};

const TagInput = ({ label, value = [], onChange, presets = [] }) => {
  const [input, setInput] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const add = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
        {label}
      </label>

      {/* Existing tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-600 border border-primary-500/20 rounded-xl text-xs font-bold"
            >
              {tag}
              <button type="button" onClick={() => remove(tag)} className="hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Presets */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPresets((p) => !p)}
          className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <Plus size={12} /> Quick Add
          <ChevronDown size={12} className={`transition-transform ${showPresets ? 'rotate-180' : ''}`} />
        </button>
        {showPresets && (
          <div className="absolute z-20 top-6 left-0 flex flex-wrap gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-64">
            {presets.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => { add(p); setShowPresets(false); }}
                disabled={value.includes(p)}
                className="px-3 py-1 text-[10px] font-black border border-[var(--border-main)] rounded-xl text-[var(--text-muted)] hover:border-primary-500 hover:text-primary-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder={`Type and press Enter…`}
          className="input flex-1 py-3 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 text-sm"
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="btn btn-outline px-4 py-3 text-[10px] font-black uppercase tracking-widest"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

const PatientHealthProfile = () => {
  const { data: profileData, isLoading: profileLoading, refetch } = useGetPatientProfileQuery();
  const [updatePatient, { isLoading: saving }] = useUpdatePatientProfileMutation();

  const [allergies, setAllergies] = useState([]);
  const [chronicConditions, setChronicConditions] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const p = profileData?.data;
    if (p) {
      reset({
        gender: p.gender || '',
        bloodGroup: p.bloodGroup || 'unknown',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
        insuranceProvider: p.insuranceProvider || '',
        insurancePolicyNumber: p.insurancePolicyNumber || '',
        // Emergency Contact
        emergencyContactName: p.emergencyContact?.name || '',
        emergencyContactRelationship: p.emergencyContact?.relationship || '',
        emergencyContactPhone: p.emergencyContact?.phone || '',
        emergencyContactEmail: p.emergencyContact?.email || '',
      });
      setAllergies(p.allergies || []);
      setChronicConditions(p.chronicConditions || []);
    }
  }, [profileData, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        dateOfBirth: data.dateOfBirth || undefined,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
        allergies: JSON.stringify(allergies),
        chronicConditions: JSON.stringify(chronicConditions),
        emergencyContact: JSON.stringify({
          name: data.emergencyContactName,
          relationship: data.emergencyContactRelationship,
          phone: data.emergencyContactPhone,
          email: data.emergencyContactEmail,
        }),
      };

      await updatePatient(payload).unwrap();
      toast.success('Health profile updated! Family members can now see your blood group.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update health profile');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const inputCls = 'input py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20';
  const labelCls = 'text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Basic Medical Info ─────────────────────────────────────── */}
      <div className="card p-8 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
            <Droplet size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Medical Information</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              This data is visible to your family members and caregivers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Blood Group */}
          <div className="space-y-2">
            <label className={labelCls}>Blood Group</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-red-500">
                <Droplet size={18} />
              </span>
              <select
                {...register('bloodGroup')}
                className={`${inputCls} pl-12 appearance-none cursor-pointer`}
              >
                <option value="unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className={labelCls}>Gender</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)]">
                <User size={18} />
              </span>
              <select
                {...register('gender')}
                className={`${inputCls} pl-12 appearance-none cursor-pointer`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label className={labelCls}>Date of Birth</label>
            <input
              type="date"
              {...register('dateOfBirth')}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Allergies & Conditions ────────────────────────────────── */}
      <div className="card p-8 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Allergies & Conditions</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              Critical for caregivers to know before administering medications.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <TagInput
            label="Allergies"
            value={allergies}
            onChange={setAllergies}
            presets={TAG_PRESETS.allergies}
          />
          <TagInput
            label="Chronic Conditions"
            value={chronicConditions}
            onChange={setChronicConditions}
            presets={TAG_PRESETS.chronicConditions}
          />
        </div>
      </div>

      {/* ── Emergency Contact ─────────────────────────────────────── */}
      <div className="card p-8 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
            <Phone size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Emergency Contact</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              Contacted in case of a medical emergency.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className={labelCls}>Contact Name</label>
            <input {...register('emergencyContactName')} placeholder="Full Name" className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Relationship</label>
            <select {...register('emergencyContactRelationship')} className={`${inputCls} appearance-none cursor-pointer`}>
              <option value="">Select Relationship</option>
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Phone Number</label>
            <input {...register('emergencyContactPhone')} type="tel" placeholder="+1 555 000 0000" className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Email Address</label>
            <input {...register('emergencyContactEmail')} type="email" placeholder="email@example.com" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Insurance ─────────────────────────────────────────────── */}
      <div className="card p-8 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">Insurance</h3>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Optional — used for hospital billing.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className={labelCls}>Insurance Provider</label>
            <input {...register('insuranceProvider')} placeholder="e.g. BlueCross, Aetna" className={inputCls} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Policy Number</label>
            <input {...register('insurancePolicyNumber')} placeholder="Policy / Member ID" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Save Button ───────────────────────────────────────────── */}
      <div className="flex justify-end pb-4">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary flex items-center gap-3 px-12 py-4 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary-600/40 active:scale-95 transition-all"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Health Profile
        </button>
      </div>
    </form>
  );
};

export default PatientHealthProfile;
