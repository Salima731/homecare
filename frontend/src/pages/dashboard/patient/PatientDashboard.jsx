import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { 
  useGetPatientProfileQuery, 
  useGenerateFamilyAccessCodeMutation 
} from '../../../features/families/familyApiSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { 
  Users, Key, Clock, Copy, RefreshCw, 
  User, ShieldCheck, Heart, UserCheck, Stethoscope 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PatientDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: profileResponse, isLoading, refetch } = useGetPatientProfileQuery();
  const [generateCode, { isLoading: isGenerating }] = useGenerateFamilyAccessCodeMutation();
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateCode().unwrap();
      toast.success('Family access code generated successfully!');
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

  if (isLoading) return <LoadingSpinner />;

  const patient = profileResponse?.data;
  const familyMembers = patient?.familyMembers || [];
  const hasCode = patient?.familyAccessCode && new Date(patient?.familyAccessCodeExpires) > new Date();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Patient Dashboard</h1>
        <p className="text-[var(--text-muted)] font-medium mt-1">
          Welcome back, <span className="font-bold text-primary-600">{user?.name}</span>. Manage your linked family members and care team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Access Code Generation */}
        <div className="lg:col-span-1 bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 border border-gray-100 dark:border-[var(--border-main)] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[var(--text-main)] mb-2 flex items-center gap-2">
              <Key size={20} className="text-primary-500" />
              Family Access Code
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed mb-6">
              Generate a temporary, secure access code to link a family member to your account. The code will expire after 24 hours.
            </p>

            {hasCode ? (
              <div className="space-y-6">
                <div className="relative group">
                  <div className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-[var(--bg-main)] border-2 border-dashed border-primary-500/30 rounded-2xl font-mono text-xl font-black text-center tracking-widest text-primary-600">
                    <span className="flex-1 select-all">{patient.familyAccessCode}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(patient.familyAccessCode)}
                      className="p-2 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl text-primary-600 transition-colors cursor-pointer"
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
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 dark:bg-[var(--bg-main)] rounded-2xl border border-gray-100 dark:border-[var(--border-main)] mb-6">
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">No Active Code</p>
                <p className="text-[10px] text-gray-400 mt-1">Generate a code to link family members.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="w-full mt-6 btn btn-primary py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            {hasCode ? (
              <>
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                Regenerate Access Code
              </>
            ) : (
              <>
                <Key size={14} className={isGenerating ? 'animate-spin' : ''} />
                Generate Access Code
              </>
            )}
          </button>
        </div>

        {/* Linked Family Members */}
        <div className="lg:col-span-2 bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 border border-gray-100 dark:border-[var(--border-main)] shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-[var(--text-main)] mb-6 flex items-center gap-2">
            <Users size={20} className="text-primary-500" />
            Linked Family Members
          </h3>

          {familyMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase text-[var(--text-muted)] font-black tracking-wider border-b border-gray-100 dark:border-[var(--border-main)]">
                  <tr>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Relationship</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[var(--border-main)]">
                  {familyMembers.map((fm) => (
                    <tr key={fm._id} className="text-sm font-bold text-gray-800 dark:text-[var(--text-main)] border-b border-gray-50 dark:border-[var(--border-main)]">
                      <td className="py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">
                          {fm.name[0].toUpperCase()}
                        </div>
                        {fm.name}
                      </td>
                      <td className="py-4 capitalize font-semibold text-gray-500">{fm.relationship}</td>
                      <td className="py-4 font-mono text-xs text-gray-600">{fm.phone || 'N/A'}</td>
                      <td className="py-4 space-y-1">
                        {fm.canReceiveHealthReports && (
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 rounded mr-1">Health</span>
                        )}
                        {fm.canReceiveEmergencyAlerts && (
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded mr-1">SOS</span>
                        )}
                        {fm.isEmergencyContact && (
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Emergency</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-[var(--bg-main)] rounded-2xl border border-gray-100 dark:border-[var(--border-main)]">
              <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={32} />
              <p className="text-sm font-black text-gray-900 dark:text-[var(--text-main)] uppercase tracking-widest">No Family Linked</p>
              <p className="text-xs text-gray-400 mt-1">Provide a Family Access Code to link family members.</p>
            </div>
          )}
        </div>
      </div>

      {/* Care Team Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Caregiver */}
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 border border-gray-100 dark:border-[var(--border-main)] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
              <UserCheck size={32} />
            </div>
            <div>
              <h4 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">Assigned Caregiver</h4>
              {patient?.assignedCaregiver ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-black text-gray-900 dark:text-[var(--text-main)]">{patient.assignedCaregiver.name}</span>
                </div>
              ) : (
                <p className="text-base font-bold text-gray-500 mt-1">No caregiver assigned</p>
              )}
            </div>
          </div>
          {patient?.assignedCaregiver && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
          )}
        </div>

        {/* Doctor */}
        <div className="bg-white dark:bg-[var(--bg-card)] rounded-3xl p-6 border border-gray-100 dark:border-[var(--border-main)] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Stethoscope size={32} />
            </div>
            <div>
              <h4 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">Assigned Doctor</h4>
              {patient?.assignedDoctor ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-black text-gray-900 dark:text-[var(--text-main)]">{patient.assignedDoctor.name}</span>
                </div>
              ) : (
                <p className="text-base font-bold text-gray-500 mt-1">No doctor assigned</p>
              )}
            </div>
          </div>
          {patient?.assignedDoctor && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default PatientDashboard;
