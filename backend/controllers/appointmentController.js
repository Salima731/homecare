const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate } = require('../utils/paginate');

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Private (user)
const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, reason } = req.body;

  if (!doctorId || !appointmentDate || !reason) {
    res.status(400);
    throw new Error('Please provide doctorId, appointmentDate, and reason');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.isActive || doctor.isSuspended) {
    res.status(400);
    throw new Error('Doctor not available');
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctor._id,
    hospital: doctor.hospital,
    appointmentDate,
    reason,
    status: 'pending'
  });

  successResponse(res, 201, 'Appointment requested successfully', appointment);
});

// @desc    Get my appointments (Role-aware)
// @route   GET /api/appointments
// @access  Private (user, doctor, hospital, family, admin)
const getMyAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  const { status, patientId, doctorId } = req.query;

  if (status) filter.status = status;

  if (req.user.role === 'user') {
    filter.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) filter.doctor = doctor._id;
  } else if (req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital) {
      filter.hospital = hospital._id;
      if (doctorId) filter.doctor = doctorId;
    }
  } else if (req.user.role === 'family') {
    if (!patientId) {
       res.status(400);
       throw new Error('Patient ID is required for family members');
    }
    const FamilyMember = require('../models/FamilyMember');
    const fm = await FamilyMember.findOne({ user: req.user._id, patient: patientId });
    if (!fm) {
       res.status(403);
       throw new Error('Not authorized to view this patient\'s appointments');
    }
    filter.patient = patientId;
  } else if (req.user.role === 'admin') {
     if (patientId) filter.patient = patientId;
     if (doctorId) filter.doctor = doctorId;
  }

  const { docs, pagination } = await paginate(Appointment, filter, {
    page: req.query.page,
    limit: req.query.limit || 10,
    populate: [
      { path: 'doctor', select: 'name specialization profileImage consultationFee' },
      { path: 'patient', select: 'name profileImage dateOfBirth gender' },
      { path: 'hospital', select: 'hospitalName' }
    ],
    sort: { appointmentDate: 1 }
  });

  paginatedResponse(res, 200, 'Appointments fetched', docs, pagination);
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('doctor', 'name specialization profileImage phone')
    .populate('patient', 'name profileImage dateOfBirth gender bloodGroup')
    .populate('hospital', 'hospitalName address contact');

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Basic access check (admin can see all)
  if (req.user.role !== 'admin') {
     let isAuthorized = false;
     
     if (req.user.role === 'user') {
       if (String(appointment.patient._id) === String(req.user._id)) isAuthorized = true;
     } else if (req.user.role === 'doctor') {
       const doctor = await Doctor.findOne({ user: req.user._id });
       if (doctor && String(appointment.doctor._id) === String(doctor._id)) isAuthorized = true;
     } else if (req.user.role === 'hospital') {
       const hospital = await Hospital.findOne({ user: req.user._id });
       if (hospital && String(appointment.hospital._id) === String(hospital._id)) isAuthorized = true;
     } else if (req.user.role === 'family') {
       const FamilyMember = require('../models/FamilyMember');
       const fm = await FamilyMember.findOne({ user: req.user._id, patient: appointment.patient._id });
       if (fm) isAuthorized = true;
     }

     if (!isAuthorized) {
       res.status(403);
       throw new Error('Not authorized to view this appointment');
     }
  }

  successResponse(res, 200, 'Appointment fetched', appointment);
});

// @desc    Update appointment status (accept, reject, complete)
// @route   PUT /api/appointments/:id/status
// @access  Private (doctor)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  
  if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
     res.status(400);
     throw new Error('Invalid status');
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor || String(appointment.doctor) !== String(doctor._id)) {
    res.status(403);
    throw new Error('Only the assigned doctor can update this appointment');
  }

  appointment.status = status;
  if (notes) appointment.notes = notes;
  
  await appointment.save();

  successResponse(res, 200, 'Appointment status updated', appointment);
});

// @desc    Cancel appointment (user)
// @route   DELETE /api/appointments/:id
// @access  Private (user, admin)
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (req.user.role !== 'admin') {
    if (String(appointment.patient) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to cancel this appointment');
    }
  }

  appointment.status = 'cancelled';
  await appointment.save();

  successResponse(res, 200, 'Appointment cancelled successfully');
});

// @desc    Get all appointments for the hospital
// @route   GET /api/appointments/hospital
// @access  Private (hospital)
const getHospitalAppointments = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const { status, doctorId } = req.query;
  const filter = { hospital: hospital._id };
  if (status) filter.status = status;
  if (doctorId) filter.doctor = doctorId;

  const { docs, pagination } = await paginate(Appointment, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name dateOfBirth gender' },
    ],
    sort: { appointmentDate: -1 },
  });

  paginatedResponse(res, 200, 'Hospital appointments fetched', docs, pagination);
});

// @desc    Get all appointments platform-wide
// @route   GET /api/admin/appointments
// @access  Private (admin)
const getAdminAllAppointments = asyncHandler(async (req, res) => {
  const { status, doctorId, patientId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (doctorId) filter.doctor = doctorId;
  if (patientId) filter.patient = patientId;

  const { docs, pagination } = await paginate(Appointment, filter, {
    page: req.query.page,
    limit: req.query.limit || 20,
    populate: [
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name' },
      { path: 'hospital', select: 'hospitalName' },
    ],
    sort: { appointmentDate: -1 },
  });

  paginatedResponse(res, 200, 'All appointments fetched', docs, pagination);
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getHospitalAppointments,
  getAdminAllAppointments,
};
