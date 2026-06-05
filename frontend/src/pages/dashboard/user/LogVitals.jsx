import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  HeartPulse, Wind, Droplet, Thermometer, Activity,
  Send, Loader2, AlertCircle, CheckCircle, Clock, Info
} from 'lucide-react';
import {
  useGetPatientProfileQuery,
  useLogVitalsMutation,
  useGetMyHealthLogsQuery,
} from '../../../features/families/familyApiSlice';

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ isAbnormal }) =>
  isAbnormal ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-wider">
      <AlertCircle size={10} /> Abnormal
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-600 border border-green-200 rounded-full text-[10px] font-black uppercase tracking-wider">
      <CheckCircle size={10} /> Normal
    </span>
  );

// ── Vital Input Card ──────────────────────────────────────────────────────────
const VitalCard = ({ icon: Icon, color, title, children }) => (
  <div className={`card p-6 border border-[var(--border-main)] bg-[var(--bg-card)] shadow-lg space-y-4 relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 ${color}`} />
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color}`}>
        <Icon size={20} />
      </div>
      <h4 className="font-black text-sm text-[var(--text-main)] uppercase tracking-widest">{title}</h4>
    </div>
    {children}
  </div>
);

const inputCls = 'input py-3 bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-main)] font-bold focus:ring-primary-600/20 text-sm';
const labelCls = 'text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest';

// ── Main Component ────────────────────────────────────────────────────────────
const LogVitals = () => {
  const { data: profileData, isLoading: profileLoading } = useGetPatientProfileQuery();
  const patientId = profileData?.data?._id;

  const [logVitals, { isLoading: submitting }] = useLogVitalsMutation();
  const { data: logsData, refetch: refetchLogs } = useGetMyHealthLogsQuery(patientId, { skip: !patientId });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [mood, setMood] = useState('');

  const MOODS = [
    { emoji: '🤩', label: 'Great', value: 'great' },
    { emoji: '😊', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😔', label: 'Poor', value: 'poor' },
    { emoji: '🚨', label: 'Critical', value: 'critical' },
  ];

  const onSubmit = async (data) => {
    if (!patientId) {
      toast.error('Patient profile not found. Please set up your health profile first.');
      return;
    }

    try {
      const vitals = {};

      if (data.bpSystolic || data.bpDiastolic) {
        vitals.bloodPressure = {
          systolic: data.bpSystolic ? Number(data.bpSystolic) : undefined,
          diastolic: data.bpDiastolic ? Number(data.bpDiastolic) : undefined,
        };
      }
      if (data.heartRate) {
        vitals.heartRate = { value: Number(data.heartRate) };
      }
      if (data.oxygenSaturation) {
        vitals.oxygenSaturation = { value: Number(data.oxygenSaturation) };
      }
      if (data.bloodSugar) {
        vitals.bloodSugar = {
          value: Number(data.bloodSugar),
          type: data.bloodSugarType || 'fasting',
        };
      }
      if (data.temperature) {
        vitals.temperature = { value: Number(data.temperature) };
      }

      if (Object.keys(vitals).length === 0) {
        toast.error('Please enter at least one vital measurement.');
        return;
      }

      await logVitals({
        patientId,
        vitals,
        mood: mood || undefined,
        symptoms: data.symptoms ? data.symptoms.split(',').map((s) => s.trim()).filter(Boolean) : [],
        notes: data.notes,
        logDate: new Date().toISOString(),
      }).unwrap();

      toast.success('✅ Vitals logged! Family dashboard updated.');
      reset();
      setMood('');
      refetchLogs();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to log vitals');
    }
  };

  const logs = logsData?.data || [];

  if (profileLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Info Banner ────────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-primary-500/5 border border-primary-500/20 flex items-start gap-4">
        <Info size={20} className="text-primary-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-black text-[var(--text-main)]">Who sees this data?</p>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
            Vitals you log here appear on the <span className="font-black text-primary-600">Family Dashboard → Health Reports</span> and are also visible to your assigned Caregiver and Doctor.
          </p>
        </div>
      </div>

      {/* ── Vital Entry Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-widest">
          Log Today's Vitals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Blood Pressure */}
          <VitalCard icon={Activity} color="bg-red-500" title="Blood Pressure">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Systolic</label>
                <div className="relative">
                  <input
                    type="number"
                    min="60" max="250"
                    {...register('bpSystolic')}
                    placeholder="120"
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black">mmHg</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Diastolic</label>
                <div className="relative">
                  <input
                    type="number"
                    min="40" max="150"
                    {...register('bpDiastolic')}
                    placeholder="80"
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black">mmHg</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Normal: 120/80 mmHg</p>
          </VitalCard>

          {/* Heart Rate */}
          <VitalCard icon={HeartPulse} color="bg-pink-500" title="Heart Rate">
            <div className="space-y-1.5">
              <label className={labelCls}>BPM</label>
              <div className="relative">
                <input
                  type="number"
                  min="30" max="250"
                  {...register('heartRate')}
                  placeholder="72"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black">bpm</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Normal: 60–100 bpm</p>
          </VitalCard>

          {/* Oxygen Saturation */}
          <VitalCard icon={Wind} color="bg-blue-500" title="Oxygen (SpO₂)">
            <div className="space-y-1.5">
              <label className={labelCls}>Saturation</label>
              <div className="relative">
                <input
                  type="number"
                  min="50" max="100"
                  step="0.1"
                  {...register('oxygenSaturation')}
                  placeholder="98"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black">%</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Normal: 95–100%</p>
          </VitalCard>

          {/* Blood Sugar */}
          <VitalCard icon={Droplet} color="bg-orange-500" title="Blood Sugar">
            <div className="space-y-1.5">
              <label className={labelCls}>Glucose Level</label>
              <div className="relative">
                <input
                  type="number"
                  min="20" max="600"
                  {...register('bloodSugar')}
                  placeholder="95"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black">mg/dL</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Reading Type</label>
              <select {...register('bloodSugarType')} className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="fasting">Fasting</option>
                <option value="post_meal">Post Meal</option>
                <option value="random">Random</option>
                <option value="bedtime">Bedtime</option>
              </select>
            </div>
          </VitalCard>

          {/* Temperature */}
          <VitalCard icon={Thermometer} color="bg-yellow-500" title="Temperature">
            <div className="space-y-1.5">
              <label className={labelCls}>Celsius (°C)</label>
              <div className="relative">
                <input
                  type="number"
                  min="30" max="45"
                  step="0.1"
                  {...register('temperature')}
                  placeholder="36.6"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] font-black">°C</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Normal: 36.1–37.2°C</p>
          </VitalCard>

          {/* Mood */}
          <VitalCard icon={Activity} color="bg-purple-500" title="How Do You Feel?">
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all active:scale-95 ${
                    mood === m.value
                      ? 'border-primary-500 bg-primary-500/10 shadow-inner'
                      : 'border-[var(--border-main)] hover:border-primary-400'
                  }`}
                >
                  <span className="text-2xl leading-none">{m.emoji}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)]">{m.label}</span>
                </button>
              ))}
            </div>
          </VitalCard>
        </div>

        {/* Symptoms & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border border-[var(--border-main)] bg-[var(--bg-card)] space-y-3">
            <label className={labelCls}>Symptoms (comma separated)</label>
            <input
              {...register('symptoms')}
              placeholder="e.g. Headache, Fatigue, Chest pain"
              className={inputCls}
            />
          </div>
          <div className="card p-6 border border-[var(--border-main)] bg-[var(--bg-card)] space-y-3">
            <label className={labelCls}>Notes for Caregiver</label>
            <input
              {...register('notes')}
              placeholder="Any additional observations…"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary flex items-center gap-3 px-12 py-4 text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary-600/40 active:scale-95 transition-all"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Submit Vitals
          </button>
        </div>
      </form>

      {/* ── Recent Logs History ────────────────────────────────────── */}
      {logs.length > 0 && (
        <div className="card border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between">
            <h3 className="font-black text-[var(--text-main)] text-sm uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-primary-600" /> Recent Logs
            </h3>
            <span className="px-3 py-1 bg-primary-500/10 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-500/20">
              {logs.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-main)] text-[var(--text-muted)]">
                <tr>
                  {['Date & Time', 'BP', 'Heart Rate', 'O₂', 'Sugar', 'Temp', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-4 font-black uppercase tracking-widest text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-black text-[var(--text-main)]">{new Date(log.logDate).toLocaleDateString()}</p>
                      <p className="text-[var(--text-muted)] text-[10px]">{new Date(log.logDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                      {log.vitals?.bloodPressure?.systolic || log.vitals?.bloodPressure?.diastolic
                        ? `${log.vitals.bloodPressure.systolic || '--'}/${log.vitals.bloodPressure.diastolic || '--'} mmHg`
                        : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                      {log.vitals?.heartRate?.value
                        ? `${log.vitals.heartRate.value} bpm`
                        : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                      {log.vitals?.oxygenSaturation?.value
                        ? `${log.vitals.oxygenSaturation.value}%`
                        : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                      {log.vitals?.bloodSugar?.value
                        ? `${log.vitals.bloodSugar.value} mg/dL`
                        : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-4 font-bold text-[var(--text-main)]">
                      {log.vitals?.temperature?.value
                        ? `${log.vitals.temperature.value}°C`
                        : <span className="text-[var(--text-muted)] opacity-40">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge isAbnormal={log.isAbnormal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogVitals;
