import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, MapPin, Camera, Save, Loader2, ShieldCheck, Copy, Clock, Users, Key, RefreshCw } from 'lucide-react';
import { selectCurrentUser, setCredentials } from '../../../features/auth/authSlice';
import { useUpdateProfileMutation } from '../../../features/users/userApiSlice';
import { useGetPatientProfileQuery, useGenerateFamilyAccessCodeMutation } from '../../../features/families/familyApiSlice';
import { toast } from 'react-hot-toast';

const FamilyAccessCodeCard = () => {
  const { data: patientProfile, isLoading, refetch } = useGetPatientProfileQuery();
  const [generateCode, { isLoading: isGenerating }] = useGenerateFamilyAccessCodeMutation();
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateCode().unwrap();
      toast.success('New family access code generated!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to generate code');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Access code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="card p-8 border-[var(--border-main)] bg-[var(--bg-card)] flex justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={24} />
      </div>
    );
  }

  const patient = patientProfile?.data;
  const hasCode = patient?.familyAccessCode && new Date(patient?.familyAccessCodeExpires) > new Date();

  return (
    <div className="card p-8 border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <h4 className="font-black text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-6 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse"></div>
        Family Member Access
      </h4>

      {hasCode ? (
        <div className="space-y-6">
          <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
            Share this secure code with your family members. They can enter it on their dashboard to monitor your care.
          </p>

          <div className="relative group/code">
            <div className="w-full flex items-center justify-between p-4 bg-[var(--bg-main)] border-2 border-dashed border-primary-500/30 rounded-2xl font-mono text-lg font-black text-center tracking-widest text-primary-600">
              <span className="flex-1 select-all">{patient.familyAccessCode}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(patient.familyAccessCode)}
                className="p-2 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl text-primary-600 transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copied ? <span className="text-[10px] font-black uppercase text-green-600 tracking-normal">Copied!</span> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider bg-primary-50/50 dark:bg-primary-900/10 p-3 rounded-xl border border-primary-100/10">
            <Clock size={12} className="text-primary-500 animate-pulse" />
            <span>
              Expires in:{' '}
              {Math.max(
                0,
                Math.round(
                  (new Date(patient.familyAccessCodeExpires) - new Date()) / (1000 * 60 * 60)
                )
              )}{' '}
              hours
            </span>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="w-full btn btn-outline py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-50 transition-all active:scale-95"
          >
            <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
            Regenerate Code
          </button>
        </div>
      ) : (
        <div className="space-y-6 text-center py-2">
          <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto text-primary-600 mb-4">
            <Users size={22} />
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
            Link your family members so they can monitor your vitals, medications, attendance, and emergency SOS logs.
          </p>
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="w-full btn btn-primary py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Key size={14} className={isGenerating ? 'animate-spin' : ''} />
            Generate Access Code
          </button>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.avatar?.url || user?.profileImage?.url || null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
    }
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await updateProfile(formData).unwrap();
      dispatch(setCredentials({ user: res.data || res.user, token: localStorage.getItem('token') }));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Account Settings</h1>
        <p className="text-[var(--text-muted)] font-medium mt-1">Update your personal information and profile preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Role */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card text-center p-8 border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
            <div className="relative inline-block mb-6">
              <div className="w-36 h-36 rounded-3xl bg-[var(--bg-main)] flex items-center justify-center border-4 border-[var(--bg-card)] shadow-2xl overflow-hidden ring-1 ring-[var(--border-main)]">
                {previewImage ? (
                  <img src={previewImage} alt="Avatar" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" />
                ) : (
                  <User size={64} className="text-[var(--text-muted)] opacity-20" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-xl cursor-pointer hover:bg-primary-700 hover:scale-110 transition-all active:scale-95 ring-4 ring-[var(--bg-card)]">
                <Camera size={20} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <h3 className="text-xl font-black text-[var(--text-main)] tracking-tight">{user?.name}</h3>
            <p className="text-xs font-black text-primary-600 uppercase tracking-widest mt-1 mb-6">{user?.role}</p>
            {user?.isVerified && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-inner">
                <ShieldCheck size={14} /> Verified Member
              </div>
            )}
          </div>

          {user?.role === 'user' && <FamilyAccessCodeCard />}

          <div className="card p-8 border-[var(--border-main)] bg-[var(--bg-card)]">
            <h4 className="font-black text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
              Quick Stats
            </h4>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">Member Since</span>
                <span className="font-black text-[var(--text-main)]">{user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">Trust Level</span>
                <span className="font-black text-primary-600 uppercase tracking-widest">Elite</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-8 border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] group-focus-within:text-primary-600 transition-colors">
                    <User size={18} />
                  </span>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] opacity-40">
                    <Mail size={18} />
                  </span>
                  <input
                    {...register('email')}
                    disabled
                    className="input pl-12 py-3.5 bg-[var(--bg-main)]/50 border-[var(--border-main)] text-[var(--text-main)] font-bold opacity-50 cursor-not-allowed"
                    placeholder="email@example.com"
                  />
                </div>
                <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest ml-1 opacity-40 italic">Permanently linked to account</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] group-focus-within:text-primary-600 transition-colors">
                    <Phone size={18} />
                  </span>
                  <input
                    {...register('phone')}
                    className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Location / Address</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--text-muted)] group-focus-within:text-primary-600 transition-colors">
                    <MapPin size={18} />
                  </span>
                  <input
                    {...register('address')}
                    className="input pl-12 py-3.5 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20"
                    placeholder="City, State"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Bio / About Me</label>
              <textarea
                {...register('bio')}
                rows="4"
                className="input py-4 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-medium focus:ring-primary-600/20 resize-none"
                placeholder="Share a bit about yourself..."
              ></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex items-center gap-3 px-10 py-4 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary-600/40 active:scale-95 transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
