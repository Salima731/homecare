const mongoose = require('mongoose');

// ─── Audit Log Sub-Schema ─────────────────────────────────────────────────────
const auditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['uploaded', 'viewed', 'updated', 'deleted', 'downloaded'],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByRole: {
      type: String,
      enum: ['patient', 'doctor', 'hospital', 'caregiver', 'family', 'admin', 'user'],
    },
    ip: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Medical Record Schema ────────────────────────────────────────────────────
const medicalRecordSchema = new mongoose.Schema(
  {
    // ── Core References ─────────────────────────────────────────────────────
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedByRole: {
      type: String,
      enum: ['patient', 'doctor', 'hospital', 'caregiver', 'admin', 'user'],
      required: true,
    },
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver' },
    doctor:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    hospital:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },

    // ── Optional Links ───────────────────────────────────────────────────────
    appointment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },

    // ── Content ──────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Record title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: [
        'lab_report',
        'prescription',
        'scan_report',
        'discharge_summary',
        'medical_certificate',
        'vaccination_record',
        'other',
      ],
      required: [true, 'Category is required'],
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [500, 'Diagnosis cannot exceed 500 characters'],
      default: '',
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    tags: { type: [String], default: [] },

    // ── File ─────────────────────────────────────────────────────────────────
    reportFile: {
      url:          { type: String, default: '' },
      publicId:     { type: String, default: '' },
      originalName: { type: String, default: '' },
    },
    fileType: { type: String, default: '' },  // 'pdf', 'jpg', 'png', etc.
    fileSize: { type: Number, default: 0 },   // bytes

    // ── Access Control ────────────────────────────────────────────────────────
    // private  → patient + assigned doctor + assigned hospital only
    // caregiver → + assigned caregiver
    // family    → + family members with canReceiveHealthReports
    visibility: {
      type: String,
      enum: ['private', 'caregiver', 'family'],
      default: 'private',
    },

    // ── Audit Log ─────────────────────────────────────────────────────────────
    auditLog: { type: [auditEntrySchema], default: [] },

    // ── Soft Delete ───────────────────────────────────────────────────────────
    isDeleted:  { type: Boolean, default: false },
    deletedAt:  { type: Date },
    deletedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
medicalRecordSchema.index({ patient: 1, uploadedAt: -1 });
medicalRecordSchema.index({ category: 1 });
medicalRecordSchema.index({ hospital: 1 });
medicalRecordSchema.index({ doctor: 1 });
medicalRecordSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
