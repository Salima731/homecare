import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Activity, Heart, Thermometer, Droplet, Wind, Weight, MessageSquare } from 'lucide-react';
import { useCreateHealthLogMutation } from '../../features/health/healthLogApiSlice';

const HealthLogForm = ({ patientId, patientName, bookingId, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      vitals: {
        bloodPressure: { systolic: '', diastolic: '' },
        bloodSugar: { value: '', type: 'random' },
        oxygenSaturation: { value: '' },
        heartRate: { value: '' },
        temperature: { value: '' },
        weight: '',
      },
      symptoms: [],
      mood: 'good',
      medicationAdherence: 'not_tracked',
      notes: '',
    },
  });

  const [createHealthLog, { isLoading }] = useCreateHealthLogMutation();
  const symptoms = watch('symptoms') || [];

  const commonSymptoms = [
    'headache',
    'dizziness',
    'nausea',
    'fatigue',
    'shortness_of_breath',
    'chest_pain',
    'cough',
    'fever',
    'rash',
    'confusion',
  ];

  const onSubmit = async (data) => {
    try {
      console.log('Submitting health log', data);

      await createHealthLog({
        patientId,
        bookingId,
        vitals: {
          bloodPressure:
            data.vitals.bloodPressure.systolic && data.vitals.bloodPressure.diastolic
              ? {
                  systolic: parseInt(data.vitals.bloodPressure.systolic),
                  diastolic: parseInt(data.vitals.bloodPressure.diastolic),
                }
              : undefined,
          bloodSugar:
            data.vitals.bloodSugar.value
              ? {
                  value: parseInt(data.vitals.bloodSugar.value),
                  type: data.vitals.bloodSugar.type,
                }
              : undefined,
          oxygenSaturation: data.vitals.oxygenSaturation.value
            ? {
                value: parseInt(data.vitals.oxygenSaturation.value),
              }
            : undefined,
          heartRate: data.vitals.heartRate.value
            ? {
                value: parseInt(data.vitals.heartRate.value),
              }
            : undefined,
          temperature: data.vitals.temperature.value
            ? {
                value: parseFloat(data.vitals.temperature.value),
              }
            : undefined,
          weight: data.vitals.weight ? parseFloat(data.vitals.weight) : undefined,
        },
        symptoms: data.symptoms,
        mood: data.mood,
        medicationAdherence: data.medicationAdherence,
        notes: data.notes,
      }).unwrap();

      toast.success('Health log recorded successfully! 📊');
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error recording health log:', err);
      toast.error(err?.data?.message || 'Failed to record health log');
    }
  };

  const toggleSymptom = (symptom) => {
    const current = symptoms || [];
    const updated = current.includes(symptom)
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];
    // Note: This would need to be integrated with react-hook-form properly
  };

  return (
    <div className="card p-8 space-y-8 bg-white shadow-lg rounded-2xl border border-gray-200">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Health Log for {patientName}</h2>
        <p className="text-gray-500">Record vital signs and health observations</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Blood Pressure */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <Heart className="text-red-500" size={24} />
            Blood Pressure (mmHg)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                {...register('vitals.bloodPressure.systolic')}
                placeholder="Systolic (e.g., 120)"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Systolic</p>
            </div>
            <div>
              <input
                type="number"
                {...register('vitals.bloodPressure.diastolic')}
                placeholder="Diastolic (e.g., 80)"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Diastolic</p>
            </div>
          </div>
        </div>

        {/* Blood Sugar */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <Droplet className="text-blue-500" size={24} />
            Blood Sugar (mg/dL)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              {...register('vitals.bloodSugar.value')}
              placeholder="e.g., 120"
              className="input"
            />
            <select {...register('vitals.bloodSugar.type')} className="input">
              <option value="fasting">Fasting</option>
              <option value="post_meal">Post Meal</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>

        {/* Oxygen Saturation */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <Wind className="text-green-500" size={24} />
            Oxygen Saturation (%)
          </label>
          <input
            type="number"
            {...register('vitals.oxygenSaturation.value')}
            placeholder="e.g., 98"
            min="0"
            max="100"
            className="input"
          />
        </div>

        {/* Heart Rate */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <Activity className="text-purple-500" size={24} />
            Heart Rate (BPM)
          </label>
          <input
            type="number"
            {...register('vitals.heartRate.value')}
            placeholder="e.g., 72"
            className="input"
          />
        </div>

        {/* Temperature */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <Thermometer className="text-orange-500" size={24} />
            Temperature (°C)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('vitals.temperature.value')}
            placeholder="e.g., 37.5"
            className="input"
          />
        </div>

        {/* Weight */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <Weight className="text-amber-500" size={24} />
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            {...register('vitals.weight')}
            placeholder="e.g., 75"
            className="input"
          />
        </div>

        {/* Symptoms */}
        <div className="border-t pt-6">
          <label className="block text-lg font-bold text-gray-900 mb-4">Symptoms</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {commonSymptoms.map((symptom) => (
              <label key={symptom} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={symptom}
                  {...register('symptoms')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">{symptom.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="border-t pt-6">
          <label className="block text-lg font-bold text-gray-900 mb-4">Mood</label>
          <select {...register('mood')} className="input">
            <option value="great">Great</option>
            <option value="good">Good</option>
            <option value="okay">Okay</option>
            <option value="poor">Poor</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Medication Adherence */}
        <div className="border-t pt-6">
          <label className="block text-lg font-bold text-gray-900 mb-4">Medication Adherence</label>
          <select {...register('medicationAdherence')} className="input">
            <option value="not_tracked">Not Tracked</option>
            <option value="excellent">Excellent (All doses taken)</option>
            <option value="good">Good (Most doses taken)</option>
            <option value="fair">Fair (Some doses missed)</option>
            <option value="poor">Poor (Many doses missed)</option>
            <option value="missed">Missed (No doses taken)</option>
          </select>
        </div>

        {/* Notes */}
        <div className="border-t pt-6">
          <label className="flex items-center gap-3 text-lg font-bold text-gray-900 mb-4">
            <MessageSquare className="text-indigo-500" size={24} />
            Notes & Observations
          </label>
          <textarea
            {...register('notes')}
            placeholder="Any additional observations about the patient's condition..."
            maxLength="1000"
            className="input min-h-[120px] py-3"
          />
          <p className="text-xs text-gray-400 mt-1">Max 1000 characters</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full py-4 text-lg font-bold"
        >
          {isLoading ? 'Recording...' : '✓ Record Health Log'}
        </button>
      </form>
    </div>
  );
};

export default HealthLogForm;
