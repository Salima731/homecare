const mongoose = require('mongoose');

const careReportSchema = new mongoose.Schema(
  {
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      required: [true, 'Caregiver is required'],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportDate: {
      type: Date,
      required: [true, 'Report date is required'],
      default: Date.now,
    },
    patientCondition: {
      type: String,
      enum: ['stable', 'improving', 'declining', 'critical'],
      required: [true, 'Patient condition is required'],
    },
    activitiesPerformed: {
      type: [String],
      default: [],
    },
    vitals: {
      bloodPressure: {
        systolic: Number,   // mmHg
        diastolic: Number,  // mmHg
        status: { type: String, enum: ['normal', 'low', 'elevated', 'high', 'critical'] },
      },
      bloodSugar: {
        value: Number,      // mg/dL
        type: { type: String, enum: ['fasting', 'post_meal', 'random'] },
        status: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
      },
      oxygenSaturation: {
        value: Number,      // SpO2 %
        status: { type: String, enum: ['normal', 'low', 'critical'] },
      },
      heartRate: {
        value: Number,      // BPM
        status: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
      },
      temperature: {
        value: Number,      // Celsius
        status: { type: String, enum: ['normal', 'low', 'fever', 'high_fever'] },
      },
      weight: Number,       // kg
    },
    remarks: {
      type: String,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      default: '',
    },
    attachments: [
      {
        url: { type: String },
        publicId: { type: String },
        name: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
careReportSchema.index({ patient: 1, reportDate: -1 });
careReportSchema.index({ booking: 1 });
careReportSchema.index({ caregiver: 1 });

module.exports = mongoose.model('CareReport', careReportSchema);
