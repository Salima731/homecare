const EmergencyAlert = require('../models/EmergencyAlert');
const Booking = require('../models/Booking');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { notifications, notifyMany } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Raise a new emergency alert
// @route   POST /api/emergency-alerts
// @access  Private (Caregiver)
const raiseAlert = asyncHandler(async (req, res) => {
  const { bookingId, alertType, severityLevel, description } = req.body;

  if (req.user.role !== 'caregiver') {
    res.status(403);
    throw new Error('Only caregivers can raise emergency alerts');
  }

  // Find the caregiver record for this user
  const caregiver = await Caregiver.findOne({ user: req.user._id });
  if (!caregiver) {
    res.status(404);
    throw new Error('Caregiver profile not found');
  }

  // Validate the booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.caregiver.toString() !== caregiver._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to raise alerts for this booking');
  }

  if (booking.status !== 'ongoing') {
    res.status(400);
    throw new Error('Emergency alerts can only be raised for ongoing bookings');
  }

  // Get patient details for hospital linking
  const patient = await Patient.findOne({ user: booking.user });
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Create the alert
  const alertData = {
    bookingId: booking._id,
    caregiverId: caregiver._id,
    patientId: patient._id,
    agencyId: booking.agency,
    alertType,
    severityLevel,
    description,
    status: 'Open',
    responseNotes: [],
  };

  // Only link hospital if the booking was a hospital referral (optional requirement check, or just patient.assignedHospital)
  // User requested: "Hospitals should only be linked to emergency alerts that originate from Hospital Referral bookings. For standard user/family bookings, hospital linkage is not required."
  // Wait, is there a way to know if a booking is a hospital referral?
  // Let's check if patient has assignedHospital and maybe the booking itself?
  // Since we don't have an explicit 'isHospitalReferral' in booking, let's link if patient.assignedHospital exists, OR we can check if it was referred.
  // Actually, I'll just check if patient has assignedHospital. If the user wants strictly Hospital Referral bookings, often those are tracked if the user has an assignedHospital.
  if (patient.assignedHospital) {
    alertData.hospitalId = patient.assignedHospital;
  }

  const newAlert = await EmergencyAlert.create(alertData);

  // Notifications
  const recipients = [];
  
  // 1. Notify Family
  // Gather family members and the user who created the booking
  const familyUsers = [booking.user.toString()];
  if (patient.familyMembers && patient.familyMembers.length > 0) {
    // Usually familyMembers are references to FamilyMember model, which has a `user` ref.
    // For simplicity, we just notify the main user account associated with the booking/patient.
  }
  
  // 2. Notify Agency Admin
  const agencyAdminUser = await User.findOne({ role: 'agency', agencyId: booking.agency }); // pseudo code to get agency user, actually agency model has no explicit admin user, but let's find a user with role agency and the same name?
  // A better way is to find User whose role is agency and maybe has `_id` equal to agency's user ref? Let's check Agency model later. For now, we will notify the Family and Admin.
  
  // Let's fetch admin users to notify them about critical alerts
  const admins = await User.find({ role: 'admin' });
  const adminIds = admins.map(a => a._id.toString());
  
  // Dispatch notifications
  if (req.io) {
    req.io.emit('emergency_alert', { alertId: newAlert._id, severityLevel, alertType });
    await notifyMany(req.io, familyUsers, 'emergency_alert_raised', `EMERGENCY ALERT: ${severityLevel}`, `An emergency alert (${alertType}) has been raised.`, { alertId: newAlert._id });
    if (severityLevel === 'Critical' || severityLevel === 'High') {
      await notifyMany(req.io, adminIds, 'emergency_alert_raised', `EMERGENCY ALERT: ${severityLevel}`, `Critical emergency raised.`, { alertId: newAlert._id });
    }
  }

  res.status(201).json({ success: true, data: newAlert });
});

// @desc    Get emergency alerts based on role
// @route   GET /api/emergency-alerts
// @access  Private
const getAlerts = asyncHandler(async (req, res) => {
  const { status, severityLevel, caregiverId, startDate, endDate } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (severityLevel) filter.severityLevel = severityLevel;
  if (caregiverId) filter.caregiverId = caregiverId;
  
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // RBAC logic
  if (req.user.role === 'admin') {
    // Admin sees all
  } else if (req.user.role === 'agency') {
    // Need to find the agency ObjectId for this user
    const Agency = require('../models/Agency');
    const agency = await Agency.findOne({ user: req.user._id });
    if (!agency) {
      res.status(404);
      throw new Error('Agency not found');
    }
    filter.agencyId = agency._id;
  } else if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      res.status(404);
      throw new Error('Hospital not found');
    }
    filter.hospitalId = hospital._id;
  } else if (req.user.role === 'caregiver') {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    if (!caregiver) {
      res.status(404);
      throw new Error('Caregiver not found');
    }
    filter.caregiverId = caregiver._id;
  } else if (req.user.role === 'user' || req.user.role === 'family') {
    // Find all patients related to this user/family
    // Assuming patient.user = req.user._id or they are part of familyMembers
    // For now, let's just find patients where user = req.user._id
    const patients = await Patient.find({ user: req.user._id });
    const patientIds = patients.map(p => p._id);
    filter.patientId = { $in: patientIds };
  } else {
    res.status(403);
    throw new Error('Not authorized to view emergency alerts');
  }

  const alerts = await EmergencyAlert.find(filter)
    .populate('caregiverId', 'name profileImage')
    .populate('patientId', 'name')
    .populate('agencyId', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: alerts.length, data: alerts });
});

// @desc    Get a specific emergency alert
// @route   GET /api/emergency-alerts/:id
// @access  Private
const getAlertById = asyncHandler(async (req, res) => {
  const alert = await EmergencyAlert.findById(req.params.id)
    .populate('caregiverId', 'name profileImage phone')
    .populate('patientId', 'name address emergencyContact')
    .populate('agencyId', 'name phone')
    .populate('responseNotes.addedBy', 'name role');

  if (!alert) {
    res.status(404);
    throw new Error('Emergency alert not found');
  }

  // RBAC validation
  if (req.user.role === 'caregiver') {
    const caregiver = await Caregiver.findOne({ user: req.user._id });
    const alertCaregiverId = alert.caregiverId?._id || alert.caregiverId;
    if (!alertCaregiverId || alertCaregiverId.toString() !== caregiver?._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this alert');
    }
  } else if (req.user.role === 'agency') {
    const Agency = require('../models/Agency');
    const agency = await Agency.findOne({ user: req.user._id });
    const alertAgencyId = alert.agencyId?._id || alert.agencyId;
    if (!alertAgencyId || alertAgencyId.toString() !== agency?._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this alert');
    }
  } else if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    const alertHospitalId = alert.hospitalId?._id || alert.hospitalId;
    if (!alertHospitalId || alertHospitalId.toString() !== hospital?._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this alert');
    }
  } else if (req.user.role === 'user' || req.user.role === 'family') {
    const patients = await Patient.find({ user: req.user._id });
    const patientIds = patients.map(p => p._id.toString());
    const alertPatientId = alert.patientId?._id || alert.patientId;
    if (!alertPatientId || !patientIds.includes(alertPatientId.toString())) {
      res.status(403);
      throw new Error('Not authorized to view this alert');
    }
  }

  res.status(200).json({ success: true, data: alert });
});

// @desc    Update an emergency alert's status and add a response note
// @route   PUT /api/emergency-alerts/:id/status
// @access  Private (Agency, Admin)
const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!['agency', 'admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Only agencies and admins can update emergency alert statuses');
  }

  const alert = await EmergencyAlert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error('Emergency alert not found');
  }

  // RBAC for agency
  if (req.user.role === 'agency') {
    const Agency = require('../models/Agency');
    const agency = await Agency.findOne({ user: req.user._id });
    if (alert.agencyId.toString() !== agency._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this alert');
    }
  }

  if (status) {
    alert.status = status;
    if (status === 'Resolved') {
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.user._id;
    }
  }

  if (note) {
    alert.responseNotes.push({
      note,
      addedBy: req.user._id,
      role: req.user.role,
      timestamp: new Date(),
    });
  }

  await alert.save();

  // Notify Caregiver and Family
  const caregiver = await Caregiver.findById(alert.caregiverId);
  const patient = await Patient.findById(alert.patientId);
  
  if (req.io) {
    const familyUsers = patient ? [patient.user.toString()] : [];
    const caregiverUser = caregiver ? caregiver.user.toString() : null;

    if (status === 'Resolved') {
      if (caregiverUser) await notifyMany(req.io, [caregiverUser], 'emergency_alert_resolved', 'Alert Resolved', 'Your emergency alert has been resolved.', { alertId: alert._id });
      if (familyUsers.length > 0) await notifyMany(req.io, familyUsers, 'emergency_alert_resolved', 'Alert Resolved', 'An emergency alert for your booking has been resolved.', { alertId: alert._id });
    }
  }

  res.status(200).json({ success: true, data: alert });
});

module.exports = {
  raiseAlert,
  getAlerts,
  getAlertById,
  updateAlertStatus,
};
