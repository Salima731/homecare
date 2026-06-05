const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentMedications: [{ name: String, dosage: String, frequency: String }],
  pastSurgeries: [{ name: String, date: Date, hospital: String }],
  familyHistory: [String],
  lifestyle: {
    smoking: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    exerciseFrequency: { type: String, enum: ['none', 'rarely', 'weekly', 'daily'], default: 'none' },
    dietType: { type: String, default: '' },
  },
  disability: { hasDisability: { type: Boolean, default: false }, description: String },
  primaryPhysician: { name: String, phone: String, hospital: String },
}, { timestamps: true });

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
