const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relationship: { type: String, enum: ['parent', 'spouse', 'child', 'sibling', 'guardian', 'other'], required: true },
  name: { type: String, required: true },
  phone: String,
  canReceiveHealthReports: { type: Boolean, default: true },
  canReceiveEmergencyAlerts: { type: Boolean, default: true },
  canChatWithCaregiver: { type: Boolean, default: true },
  isEmergencyContact: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
