const asyncHandler = require('../utils/asyncHandler');
const EmergencyIncident = require('../models/EmergencyIncident');
const User = require('../models/User');
const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const Hospital = require('../models/Hospital');
const Caregiver = require('../models/Caregiver');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../services/notificationService');

// ─── Helper: Get nearest hospital by GPS ─────────────────────────────────────
const findNearestHospital = async (lat, lng) => {
  // Simple approach: find approved hospitals and return the first one
  // In production use $geoNear with 2dsphere index
  const hospital = await Hospital.findOne({ status: 'approved' }).select('_id hospitalName emergencyContact');
  return hospital;
};

// ─── Helper: Get all notifiable users for a patient ──────────────────────────
const getNotifiableUsers = async (patientId, triggeredByUserId) => {
  const notifyIds = [];

  if (patientId) {
    const patient = await User.findById(patientId).populate('familyMembers');
    if (patient?.familyMembers?.length) {
      patient.familyMembers.forEach((fm) => {
        if (fm.canReceiveEmergencyAlerts && String(fm.user) !== String(triggeredByUserId)) {
          notifyIds.push(fm.user);
        }
      });
    }
    if (patient?.assignedCaregiver) {
      const Caregiver = require('../models/Caregiver');
      const cg = await Caregiver.findById(patient.assignedCaregiver).select('user');
      if (cg?.user) notifyIds.push(cg.user);
    }
  }

  return notifyIds;
};

// ─── Trigger SOS ─────────────────────────────────────────────────────────────
// POST /api/emergency/sos
const triggerSOS = asyncHandler(async (req, res) => {
  const { lat, lng, address, accuracy, type, description, bookingId, patientId, severity } = req.body;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('GPS coordinates (lat, lng) are required to trigger SOS');
  }

  // Find nearest hospital
  const nearestHospital = await findNearestHospital(lat, lng);

  // Get users to notify
  const notifyUserIds = await getNotifiableUsers(patientId, req.user._id);

  const incident = await EmergencyIncident.create({
    triggeredBy: req.user._id,
    triggerRole: req.user.role,
    patient: patientId || undefined,
    booking: bookingId || undefined,
    location: { lat, lng, address: address || '', accuracy: accuracy || null },
    type: type || 'medical',
    description: description || '',
    status: 'active',
    severity: severity || 'high',
    notifiedUsers: notifyUserIds,
    notifiedHospital: nearestHospital?._id || undefined,
    locationHistory: [{ lat, lng, recordedAt: new Date() }],
  });

  // ── Real-time Socket.io broadcast ───────────────────────────────────────────
  if (req.io) {
    const sosPayload = {
      incidentId: incident._id,
      triggeredBy: req.user._id,
      triggerRole: req.user.role,
      location: { lat, lng, address },
      type: incident.type,
      severity: incident.severity,
      description: incident.description,
      timestamp: incident.createdAt,
    };

    // Notify each family member / assigned caregiver
    notifyUserIds.forEach((uid) => {
      req.io.to(`user_${uid}`).emit('sos_alert', sosPayload);
    });

    // Notify all admin users (they joined 'admin_room' on connection)
    req.io.to('admin_room').emit('sos_alert', sosPayload);

    // Notify hospital if found
    if (nearestHospital) {
      req.io.to(`hospital_${nearestHospital._id}`).emit('sos_alert', sosPayload);
    }

    // Notify the persisted users via Notification model
    await Promise.all(
      notifyUserIds.map((uid) =>
        createNotification(req.io, {
          recipient: uid,
          type: 'emergency_sos',
          title: '🚨 Emergency SOS Triggered',
          message: `An emergency SOS has been triggered. Location: ${address || `${lat}, ${lng}`}`,
          data: { incidentId: incident._id },
        })
      )
    );
  }

  successResponse(res, 201, 'SOS triggered — help is on the way', incident);
});

// ─── Update Live Location ─────────────────────────────────────────────────────
// POST /api/emergency/:id/location
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, address } = req.body;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('lat and lng are required');
  }

  const incident = await EmergencyIncident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error('Emergency incident not found');
  }

  if (String(incident.triggeredBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Only the SOS initiator can update location');
  }

  incident.location = { lat, lng, address: address || '' };
  incident.locationHistory.push({ lat, lng, recordedAt: new Date() });
  await incident.save();

  // Broadcast live location to all observers
  if (req.io) {
    incident.notifiedUsers.forEach((uid) => {
      req.io.to(`user_${uid}`).emit('sos_location_update', {
        incidentId: incident._id,
        lat, lng, address,
        recordedAt: new Date(),
      });
    });
    req.io.to('admin_room').emit('sos_location_update', { incidentId: incident._id, lat, lng });
  }

  successResponse(res, 200, 'Location updated', { lat, lng, locationHistory: incident.locationHistory });
});

// ─── Acknowledge SOS ─────────────────────────────────────────────────────────
// PUT /api/emergency/:id/acknowledge
const acknowledgeSOS = asyncHandler(async (req, res) => {
  const incident = await EmergencyIncident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error('Emergency incident not found');
  }

  if (incident.status !== 'active') {
    res.status(400);
    throw new Error(`Cannot acknowledge — incident is already '${incident.status}'`);
  }

  incident.status = 'acknowledged';
  incident.respondedBy = req.user._id;
  incident.respondedAt = new Date();
  await incident.save();

  // Notify the SOS initiator that help is acknowledged
  if (req.io) {
    req.io.to(`user_${incident.triggeredBy}`).emit('sos_acknowledged', {
      incidentId: incident._id,
      respondedBy: req.user._id,
      respondedAt: incident.respondedAt,
    });
  }

  successResponse(res, 200, 'SOS acknowledged', incident);
});

// ─── Mark Responding ─────────────────────────────────────────────────────────
// PUT /api/emergency/:id/respond
const markResponding = asyncHandler(async (req, res) => {
  const incident = await EmergencyIncident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error('Emergency incident not found');
  }

  incident.status = 'responding';
  if (!incident.respondedBy) incident.respondedBy = req.user._id;
  if (!incident.respondedAt) incident.respondedAt = new Date();
  await incident.save();

  if (req.io) {
    req.io.to(`user_${incident.triggeredBy}`).emit('sos_responding', {
      incidentId: incident._id,
      message: 'Responder is on the way',
    });
  }

  successResponse(res, 200, 'SOS marked as responding', incident);
});

// ─── Resolve SOS ─────────────────────────────────────────────────────────────
// PUT /api/emergency/:id/resolve
const resolveSOS = asyncHandler(async (req, res) => {
  const { resolutionNote, isFalseAlarm } = req.body;

  const incident = await EmergencyIncident.findById(req.params.id);
  if (!incident) {
    res.status(404);
    throw new Error('Emergency incident not found');
  }

  incident.status = isFalseAlarm ? 'false_alarm' : 'resolved';
  incident.resolvedAt = new Date();
  incident.resolutionNote = resolutionNote || '';
  await incident.save();

  // Notify all involved parties of resolution
  if (req.io) {
    const allNotify = [incident.triggeredBy, ...incident.notifiedUsers];
    allNotify.forEach((uid) => {
      req.io.to(`user_${uid}`).emit('sos_resolved', {
        incidentId: incident._id,
        status: incident.status,
        resolvedAt: incident.resolvedAt,
        resolutionNote: incident.resolutionNote,
      });
    });
    req.io.to('admin_room').emit('sos_resolved', { incidentId: incident._id, status: incident.status });
  }

  successResponse(res, 200, `SOS ${incident.status}`, incident);
});

// ─── Get My Incidents (user/caregiver/patient/family) ─────────────────────────
// GET /api/emergency/my
const getMyIncidents = asyncHandler(async (req, res) => {
  const filter = { triggeredBy: req.user._id };

  const { docs, pagination } = await paginate(EmergencyIncident, filter, {
    page: req.query.page,
    limit: req.query.limit,
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Your emergency history', docs, pagination);
});

// ─── Get All Incidents (Admin) ────────────────────────────────────────────────
// GET /api/emergency
const getAllIncidents = asyncHandler(async (req, res) => {
  const filter = {};

  // Hospital can only see incidents they were notified about
  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital) filter.notifiedHospital = hospital._id;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.type) filter.type = req.query.type;

  const { docs, pagination } = await paginate(EmergencyIncident, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: [
      { path: 'triggeredBy', select: 'name email role' },
      { path: 'patient', select: 'name' },
      { path: 'notifiedHospital', select: 'hospitalName' },
      { path: 'respondedBy', select: 'name role' },
    ],
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'All emergency incidents', docs, pagination);
});

// ─── Get Single Incident ──────────────────────────────────────────────────────
// GET /api/emergency/:id
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await EmergencyIncident.findById(req.params.id)
    .populate('triggeredBy', 'name email role avatar')
    .populate('patient', 'name profileImage emergencyContact')
    .populate('booking', 'serviceType startDate status')
    .populate('notifiedHospital', 'hospitalName emergencyContact')
    .populate('respondedBy', 'name role');

  if (!incident) {
    res.status(404);
    throw new Error('Emergency incident not found');
  }

  // Only allow access to the incident's involved parties or admin
  const isAdmin = req.user.role === 'admin';
  const isTriggerer = String(incident.triggeredBy._id) === String(req.user._id);
  const isNotified = incident.notifiedUsers.some((uid) => String(uid) === String(req.user._id));

  if (!isAdmin && !isTriggerer && !isNotified) {
    res.status(403);
    throw new Error('Access denied to this incident');
  }

  successResponse(res, 200, 'Incident details fetched', incident);
});

// ─── Get Patient Incidents (Family/Admin) ──────────────────────────────────────
const getPatientIncidents = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  let patient = await Patient.findById(patientId);
  if (!patient) {
    patient = await Patient.findOne({ user: patientId });
  }

  const User = require('../models/User');
  if (!patient) {
    const userExists = await User.findById(patientId);
    if (!userExists) {
      res.status(404);
      throw new Error('Patient not found');
    }
    patient = {
      _id: null,
      user: userExists._id,
      name: userExists.name,
    };
  }

  const patientUserId = patient.user?._id || patient.user;
  const patientDocId = patient._id;

  // Access control
  const isAdmin = req.user.role === 'admin';
  const isOwner = String(patientUserId) === String(req.user._id);
  
  let isFamilyAuthorized = false;
  if (req.user.role === 'family') {
    const FamilyMember = require('../models/FamilyMember');
    const orQuery = [{ patient: patientUserId }];
    if (patientDocId) orQuery.push({ patient: patientDocId });
    const fm = await FamilyMember.findOne({
      user: req.user._id,
      $or: orQuery,
    });
    isFamilyAuthorized = !!fm;
  }

  if (!isAdmin && !isOwner && !isFamilyAuthorized) {
    res.status(403);
    throw new Error('Access denied to patient emergency incidents');
  }

  const filter = { patient: patientUserId };
  if (req.query.status) filter.status = req.query.status;

  const { docs, pagination } = await paginate(EmergencyIncident, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'triggeredBy', select: 'name email role' },
      { path: 'respondedBy', select: 'name role' },
    ],
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Patient emergency incidents fetched', docs, pagination);
});

module.exports = {
  triggerSOS,
  updateLocation,
  acknowledgeSOS,
  markResponding,
  resolveSOS,
  getMyIncidents,
  getAllIncidents,
  getIncidentById,
  getPatientIncidents,
};
