const asyncHandler = require('../utils/asyncHandler');
const PatientReferral = require('../models/PatientReferral');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Agency = require('../models/Agency');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');

// ─── Create Referral (Hospital/Doctor) ────────────────────────────────────────
const createReferral = asyncHandler(async (req, res) => {
  const { patientId, hospitalId, assignedAgencyId, serviceType, medicalNotes, urgency, homeCarePlan } = req.body;

  let referredBy = {};
  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      res.status(404);
      throw new Error('Hospital profile not found');
    }
    referredBy = { entityId: hospital._id, entityType: 'Hospital' };
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor profile not found');
    }
    referredBy = { entityId: doctor._id, entityType: 'Doctor' };
  } else {
    res.status(403);
    throw new Error('Only Hospitals or Doctors can create referrals');
  }

  const referral = new PatientReferral({
    patient: patientId,
    referredBy,
    hospital: hospitalId || (req.user.role === 'hospital' ? referredBy.entityId : req.body.hospitalId),
    assignedAgency: assignedAgencyId || undefined,
    serviceType,
    medicalNotes,
    urgency,
    homeCarePlan,
    status: 'pending'
  });

  await referral.save();
  successResponse(res, 201, 'Patient referral created successfully', referral);
});

// ─── Update Referral Status (Agency/Admin/Hospital) ───────────────────────────
const updateReferralStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  
  const referral = await PatientReferral.findById(req.params.id);
  if (!referral) {
    res.status(404);
    throw new Error('Referral not found');
  }

  if (req.user.role === 'agency') {
    const agency = await Agency.findOne({ user: req.user._id });
    if (String(referral.assignedAgency) !== String(agency._id)) {
      res.status(403);
      throw new Error('Not authorized to update this referral');
    }
  }

  if (status) referral.status = status;
  if (adminNote) referral.adminNote = adminNote;

  const updatedReferral = await referral.save();

  if (req.io && status && ['accepted', 'rejected', 'in_progress', 'completed'].includes(status)) {
    const hospital = await Hospital.findById(referral.hospital);
    if (hospital && hospital.user) {
      req.io.to(`user_${hospital.user}`).emit('referral_status_updated', {
        referralId: referral._id,
        status: status
      });
      await createNotification(req.io, {
        recipient: hospital.user,
        type: 'hospital_referral',
        title: 'Referral Status Updated',
        message: `Your referral for patient has been ${status} by the assigned agency.`,
        data: { referralId: referral._id }
      });
    }
  }

  successResponse(res, 200, 'Referral updated', updatedReferral);
});

// ─── Get Referrals ────────────────────────────────────────────────────────────
const getReferrals = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    filter.hospital = hospital._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    filter['referredBy.entityId'] = doctor._id;
  } else if (req.user.role === 'agency') {
    const agency = await Agency.findOne({ user: req.user._id });
    filter.assignedAgency = agency._id;
  } else if (req.user.role === 'user') {
    // The user IS the patient — filter by their own user ID
    filter.patient = req.user._id;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const { docs, pagination } = await paginate(PatientReferral, filter, {
    page: req.query.page,
    limit: req.query.limit,
    populate: [
      { path: 'patient', select: 'name profileImage' },
      { path: 'hospital', select: 'name' },
      { path: 'assignedAgency', select: 'agencyName' },
      { path: 'referredBy.entityId', select: 'name' }
    ],
    sort: { createdAt: -1 },
  });

  paginatedResponse(res, 200, 'Referrals fetched', docs, pagination);
});

// ─── Get Referral By ID ───────────────────────────────────────────────────────
const getReferralById = asyncHandler(async (req, res) => {
  const referral = await PatientReferral.findById(req.params.id)
    .populate('patient')
    .populate('hospital', 'name email phone')
    .populate('assignedAgency', 'agencyName email')
    .populate('referredBy.entityId', 'name email');

  if (!referral) {
    res.status(404);
    throw new Error('Referral not found');
  }

  successResponse(res, 200, 'Referral details fetched', referral);
});

module.exports = {
  createReferral,
  updateReferralStatus,
  getReferrals,
  getReferralById
};
