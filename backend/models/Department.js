const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  headDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  description: String,
  floor: String,
  phone: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
