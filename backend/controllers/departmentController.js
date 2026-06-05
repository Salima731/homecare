const asyncHandler = require('../utils/asyncHandler');
const Department = require('../models/Department');
const Hospital = require('../models/Hospital');
const { successResponse } = require('../utils/responseHandler');

// @desc    Add department
// @route   POST /api/departments
// @access  Private (hospital)
const addDepartment = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }

  const { name, code, description, floor, phone } = req.body;

  const existing = await Department.findOne({ hospital: hospital._id, code });
  if (existing) {
    res.status(400);
    throw new Error(`Department with code '${code}' already exists in this hospital`);
  }

  const department = await Department.create({
    hospital: hospital._id,
    name,
    code,
    description,
    floor,
    phone,
  });

  // Push reference to hospital.departments array
  hospital.departments.push(department._id);
  await hospital.save();

  successResponse(res, 201, 'Department added', department);
});

// @desc    Get all departments for a hospital (public)
// @route   GET /api/departments/hospital/:hospitalId
// @access  Public
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({
    hospital: req.params.hospitalId,
    isActive: true,
  }).populate('headDoctor', 'name specialization');
  successResponse(res, 200, 'Departments fetched', departments);
});

// @desc    Get MY hospital's departments
// @route   GET /api/departments/my
// @access  Private (hospital)
const getMyDepartments = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  if (!hospital) {
    res.status(404);
    throw new Error('Hospital profile not found');
  }
  const departments = await Department.find({ hospital: hospital._id })
    .populate('headDoctor', 'name specialization');
  successResponse(res, 200, 'Your departments fetched', departments);
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (hospital)
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  const hospital = await Hospital.findOne({ user: req.user._id });
  if (department.hospital.toString() !== hospital._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this department');
  }

  const updatedDept = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  successResponse(res, 200, 'Department updated', updatedDept);
});

// @desc    Soft-delete (deactivate) department
// @route   DELETE /api/departments/:id
// @access  Private (hospital)
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }

  const hospital = await Hospital.findOne({ user: req.user._id });
  if (department.hospital.toString() !== hospital._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this department');
  }

  department.isActive = false;
  await department.save();

  successResponse(res, 200, 'Department deactivated successfully', department);
});

module.exports = {
  addDepartment,
  getDepartments,
  getMyDepartments,
  updateDepartment,
  deleteDepartment,
};
