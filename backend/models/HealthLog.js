const mongoose = require('mongoose');

const healthLogSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  logDate: { type: Date, required: true, default: Date.now },
  vitals: {
    bloodPressure: {
      systolic: Number,    // mmHg
      diastolic: Number,   // mmHg
      status: { type: String, enum: ['normal', 'low', 'elevated', 'high', 'critical'] },
    },
    bloodSugar: {
      value: Number,       // mg/dL
      type: { type: String, enum: ['fasting', 'post_meal', 'random'] },
      status: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
    },
    oxygenSaturation: {
      value: Number,       // SpO2 %
      status: { type: String, enum: ['normal', 'low', 'critical'] },
    },
    heartRate: {
      value: Number,       // BPM
      status: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
    },
    temperature: {
      value: Number,       // Celsius
      status: { type: String, enum: ['normal', 'low', 'fever', 'high_fever'] },
    },
    weight: Number,        // kg
    height: Number,        // cm (for BMI)
  },
  symptoms: [String],
  notes: { type: String, maxlength: 1000 },
  mood: { type: String, enum: ['great', 'good', 'okay', 'poor', 'critical'] },
  medicationAdherence: {
    type: String,
    enum: ['not_tracked', 'excellent', 'good', 'fair', 'poor', 'missed'],
    default: 'not_tracked',
  },
  isAbnormal: { type: Boolean, default: false }, // auto-set by pre-save hook
  alertSent: { type: Boolean, default: false },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedByRole: {
    type: String,
    enum: ['patient', 'caregiver', 'doctor', 'admin', 'family', 'hospital', 'user'],
  },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedByRole: {
    type: String,
    enum: ['patient', 'caregiver', 'doctor', 'admin', 'family', 'hospital', 'user'],
  },
  updateHistory: [{
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByRole: {
      type: String,
      enum: ['patient', 'caregiver', 'doctor', 'admin', 'family', 'hospital', 'user'],
    },
    updatedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

healthLogSchema.pre('save', function () {
  const v = this.vitals;
  const abnormal = (
    v?.bloodPressure?.status === 'critical' ||
    v?.bloodSugar?.status === 'critical' ||
    v?.oxygenSaturation?.status === 'critical' ||
    v?.heartRate?.status === 'critical' ||
    v?.temperature?.status === 'high_fever'
  );
  this.isAbnormal = abnormal;
});

module.exports = mongoose.model('HealthLog', healthLogSchema);
