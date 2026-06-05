const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Caregiver', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, required: true },
  checkIn: {
    time: Date,
    location: { lat: Number, lng: Number, address: String },
    selfieUrl: String,
    selfiePublicId: String,
    isWithinGeofence: { type: Boolean, default: false },
    faceVerified: { type: Boolean, default: false },
    method: { type: String, enum: ['gps', 'selfie', 'face', 'manual'], default: 'gps' },
  },
  checkOut: {
    time: Date,
    location: { lat: Number, lng: Number, address: String },
    selfieUrl: String,
    selfiePublicId: String,
    isWithinGeofence: { type: Boolean, default: false },
    faceVerified: { type: Boolean, default: false },
  },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'on_leave'], default: 'absent' },
  workedHours: { type: Number, default: 0 },
  lateByMinutes: { type: Number, default: 0 },
  geofenceRadius: { type: Number, default: 200 }, // meters
  adminApproved: { type: Boolean, default: false },
  note: String,
}, { timestamps: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
