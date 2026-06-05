const asyncHandler = require('../utils/asyncHandler');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const User = require('../models/User');
const PatientReferral = require('../models/PatientReferral');
const EmergencyIncident = require('../models/EmergencyIncident');
const { successResponse } = require('../utils/responseHandler');

// @desc    Register hospital profile
// @route   POST /api/hospitals/register
// @access  Private (hospital)
const registerHospital = asyncHandler(async (req, res) => {
  const { hospitalName, registrationNumber, type, address, phone, email, website } = req.body;

  let hospital = await Hospital.findOne({ user: req.user._id });
  
  if (hospital && hospital.hospitalName !== req.user.name) {
    res.status(400);
    throw new Error('Hospital profile already registered');
  }

  // Update the stub created during auth registration
  hospital = await Hospital.findOneAndUpdate(
    { user: req.user._id },
    {
      hospitalName,
      registrationNumber,
      type,
      address,
      phone,
      email,
      website,
      status: 'pending' // Admin needs to approve
    },
    { new: true, runValidators: true }
  );

  successResponse(res, 201, 'Hospital profile registered, pending admin approval', hospital);
});

// @desc    Get all approved hospitals
// @route   GET /api/hospitals
// @access  Public
const getHospitals = asyncHandler(async (req, res) => {
  const hospitals = await Hospital.find({ status: 'approved' }).select('-adminNote');
  successResponse(res, 200, 'Hospitals fetched', hospitals);
});

// @desc    Get hospital detail
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id)
    .populate('departments')
    .select('-adminNote');
  
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital not found');
  }

  successResponse(res, 200, 'Hospital fetched', hospital);
});

// @desc    Get my hospital profile
// @route   GET /api/hospitals/my
// @access  Private (hospital)
const getMyHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id }).populate('departments');
  
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  successResponse(res, 200, 'My hospital profile fetched', hospital);
});

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private (hospital, admin)
const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    res.status(404);
    throw new Error('Hospital not found');
  }

  // Check ownership unless admin
  if (req.user.role !== 'admin' && hospital.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this hospital');
  }

  const updatedHospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  successResponse(res, 200, 'Hospital updated', updatedHospital);
});

// @desc    Get Hospital Analytics (Stats for Dashboard)
// @route   GET /api/hospitals/analytics
// @access  Private (hospital)
const getHospitalAnalytics = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const hospitalId = hospital._id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalDoctors,
    totalDepartments,
    totalPatients,
    totalReferrals,
    pendingReferrals,
    completedReferrals,
    activeEmergencies,
    referralsTrend,
  ] = await Promise.all([
    Doctor.countDocuments({ hospital: hospitalId, isActive: true }),
    Department.countDocuments({ hospital: hospitalId, isActive: true }),
    User.countDocuments({ assignedHospital: hospitalId }),
    PatientReferral.countDocuments({ hospital: hospitalId }),
    PatientReferral.countDocuments({ hospital: hospitalId, status: 'pending' }),
    PatientReferral.countDocuments({ hospital: hospitalId, status: 'completed' }),
    EmergencyIncident.countDocuments({ notifiedHospital: hospitalId, status: 'active' }),
    PatientReferral.aggregate([
      {
        $match: {
          hospital: hospitalId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  successResponse(res, 200, 'Hospital analytics fetched', {
    overview: {
      totalDoctors,
      totalDepartments,
      totalPatients,
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      activeEmergencies,
    },
    referralsTrend,
  });
});

// @desc    Admit a patient to this hospital (link assignedHospital)
// @route   PUT /api/hospitals/admit/:patientId
// @access  Private (hospital)
const admitPatient = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const patient = await User.findById(req.params.patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  // Capture admission status BEFORE overwriting the field
  const wasAlreadyAdmitted = !!patient.assignedHospital;

  patient.assignedHospital = hospital._id;
  await patient.save();

  // Only increment the counter for a brand-new admission
  if (!wasAlreadyAdmitted) {
    await Hospital.findByIdAndUpdate(hospital._id, { $inc: { totalPatients: 1 } });
  }

  successResponse(res, 200, 'Patient admitted to hospital', patient);
});

module.exports = {
  registerHospital,
  getHospitals,
  getHospitalById,
  getMyHospital,
  updateHospital,
  getHospitalAnalytics,
  admitPatient,
};
