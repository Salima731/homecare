/**
 * tests/setup/fixtures.js
 * -----------------------
 * Factory functions for all test data.
 * Every factory creates a real Mongoose document in the in-memory DB.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Speed up tests by bypassing slow bcrypt CPU cycles
bcrypt.hash = async () => 'mocked-hash';
bcrypt.compare = async () => true;

const User         = require('../../models/User');
const Agency       = require('../../models/Agency');
const Caregiver    = require('../../models/Caregiver');
const Patient      = require('../../models/Patient');
const FamilyMember = require('../../models/FamilyMember');
const Hospital     = require('../../models/Hospital');
const Booking      = require('../../models/Booking');
const EmergencyAlert    = require('../../models/EmergencyAlert');
const EmergencyIncident = require('../../models/EmergencyIncident');

// ─── Counter for unique email/id generation ────────────────────────────────────
let counter = 0;
const uid = () => `${Date.now()}_${++counter}`;

// ─── User Factories ────────────────────────────────────────────────────────────

const createAdminUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('TestPass@123', 10);
  return User.create({
    name: 'Test Admin',
    email: `admin_${uid()}@test.com`,
    password: hash,
    role: 'admin',
    isEmailVerified: true,
    ...overrides,
  });
};

const createAgencyUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('TestPass@123', 10);
  return User.create({
    name: 'Test Agency User',
    email: `agency_${uid()}@test.com`,
    password: hash,
    role: 'agency',
    isEmailVerified: true,
    ...overrides,
  });
};

const createCaregiverUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('TestPass@123', 10);
  return User.create({
    name: 'Test Caregiver User',
    email: `caregiver_${uid()}@test.com`,
    password: hash,
    role: 'caregiver',
    isEmailVerified: true,
    ...overrides,
  });
};

const createPatientUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('TestPass@123', 10);
  return User.create({
    name: 'Test Patient User',
    email: `patient_${uid()}@test.com`,
    password: hash,
    role: 'user',
    isEmailVerified: true,
    ...overrides,
  });
};

const createFamilyUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('TestPass@123', 10);
  return User.create({
    name: 'Test Family User',
    email: `family_${uid()}@test.com`,
    password: hash,
    role: 'family',
    isEmailVerified: true,
    ...overrides,
  });
};

const createHospitalUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('TestPass@123', 10);
  return User.create({
    name: 'Test Hospital User',
    email: `hospital_${uid()}@test.com`,
    password: hash,
    role: 'hospital',
    isEmailVerified: true,
    ...overrides,
  });
};

// ─── Profile / Entity Factories ────────────────────────────────────────────────

const createAgencyDoc = async (agencyUserId, overrides = {}) => {
  return Agency.create({
    user: agencyUserId,
    agencyName: `TestAgency_${uid()}`,
    licenseNumber: `LIC_${uid()}`,
    status: 'approved',
    ...overrides,
  });
};

const createCaregiverDoc = async (caregiverUserId, agencyId, overrides = {}) => {
  return Caregiver.create({
    user: caregiverUserId,
    agency: agencyId,
    name: `TestCaregiver_${uid()}`,
    serviceType: 'nurse',
    experience: 3,
    rates: { hourly: 200, daily: 1500, weekly: 8000, monthly: 28000 },
    isActive: true,
    isVerified: true,
    ...overrides,
  });
};

const createPatientDoc = async (patientUserId, overrides = {}) => {
  return Patient.create({
    user: patientUserId,
    name: `TestPatient_${uid()}`,
    ...overrides,
  });
};

const createFamilyMemberDoc = async (familyUserId, patientUserId, overrides = {}) => {
  return FamilyMember.create({
    user: familyUserId,
    patient: patientUserId,
    name: `TestFamilyMember_${uid()}`,
    relationship: 'spouse',
    canReceiveEmergencyAlerts: true,
    canReceiveHealthReports: true,
    isEmergencyContact: true,
    ...overrides,
  });
};

const createHospitalDoc = async (hospitalUserId, overrides = {}) => {
  return Hospital.create({
    user: hospitalUserId,
    hospitalName: `TestHospital_${uid()}`,
    registrationNumber: `HOSP_${uid()}`,
    status: 'approved',
    emergencyContact: '9999999999',
    ...overrides,
  });
};

// ─── Booking Factory ───────────────────────────────────────────────────────────

const createBooking = async (patientUserId, caregiverId, agencyId, overrides = {}) => {
  return Booking.create({
    user: patientUserId,
    caregiver: caregiverId,
    agency: agencyId,
    serviceType: 'nurse',
    durationType: 'daily',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    rateApplied: 200,
    totalAmount: 200,
    platformCommission: 20,
    agencyAmount: 180,
    status: 'ongoing',
    ...overrides,
  });
};

// ─── Emergency Document Factories ─────────────────────────────────────────────

const createEmergencyAlert = async (bookingId, caregiverId, patientId, agencyId, overrides = {}) => {
  return EmergencyAlert.create({
    bookingId,
    caregiverId,
    patientId,
    agencyId,
    alertType: 'Medical Emergency',
    severityLevel: 'Critical',
    description: 'Test patient is unresponsive',
    status: 'Open',
    responseNotes: [],
    ...overrides,
  });
};

const createEmergencyIncident = async (triggeredByUserId, overrides = {}) => {
  return EmergencyIncident.create({
    triggeredBy: triggeredByUserId,
    triggerRole: 'user',
    location: { lat: 28.6139, lng: 77.2090, address: 'New Delhi, India', accuracy: 10 },
    type: 'medical',
    description: 'Test SOS incident',
    status: 'active',
    severity: 'high',
    notifiedUsers: [],
    locationHistory: [{ lat: 28.6139, lng: 77.2090, recordedAt: new Date() }],
    ...overrides,
  });
};

// ─── Composite: Full Test Environment ─────────────────────────────────────────
/**
 * Creates a complete relational test fixture set:
 * Returns all entities + their tokens.
 */
const buildFullFixture = async () => {
  const { generateAccessToken } = require('../../utils/generateToken');

  // Users
  const adminUser      = await createAdminUser();
  const agencyUser     = await createAgencyUser();
  const agency2User    = await createAgencyUser({ name: 'Agency2 User' });
  const caregiverUser  = await createCaregiverUser();
  const patientUser    = await createPatientUser();
  const familyUser     = await createFamilyUser();
  const hospitalUser   = await createHospitalUser();

  // Profiles
  const agencyDoc     = await createAgencyDoc(agencyUser._id);
  const agency2Doc    = await createAgencyDoc(agency2User._id);
  const caregiverDoc  = await createCaregiverDoc(caregiverUser._id, agencyDoc._id);
  const patientDoc    = await createPatientDoc(patientUser._id, { assignedHospital: null });
  const familyDoc     = await createFamilyMemberDoc(familyUser._id, patientUser._id);
  
  // Link family member to both User and Patient profiles
  await User.findByIdAndUpdate(patientUser._id, { $addToSet: { familyMembers: familyDoc._id } });
  await Patient.findByIdAndUpdate(patientDoc._id, { $addToSet: { familyMembers: familyDoc._id } });

  const hospitalDoc   = await createHospitalDoc(hospitalUser._id);

  // Booking (ongoing — required for alerts)
  const ongoingBooking = await createBooking(patientUser._id, caregiverDoc._id, agencyDoc._id, { status: 'ongoing' });
  const pendingBooking = await createBooking(patientUser._id, caregiverDoc._id, agencyDoc._id, { status: 'pending' });

  // Tokens
  const tokens = {
    admin:     generateAccessToken(adminUser._id),
    agency:    generateAccessToken(agencyUser._id),
    agency2:   generateAccessToken(agency2User._id),
    caregiver: generateAccessToken(caregiverUser._id),
    patient:   generateAccessToken(patientUser._id),
    family:    generateAccessToken(familyUser._id),
    hospital:  generateAccessToken(hospitalUser._id),
  };

  return {
    users: { adminUser, agencyUser, agency2User, caregiverUser, patientUser, familyUser, hospitalUser },
    docs: { agencyDoc, agency2Doc, caregiverDoc, patientDoc, familyDoc, hospitalDoc },
    bookings: { ongoingBooking, pendingBooking },
    tokens,
  };
};

module.exports = {
  createAdminUser,
  createAgencyUser,
  createCaregiverUser,
  createPatientUser,
  createFamilyUser,
  createHospitalUser,
  createAgencyDoc,
  createCaregiverDoc,
  createPatientDoc,
  createFamilyMemberDoc,
  createHospitalDoc,
  createBooking,
  createEmergencyAlert,
  createEmergencyIncident,
  buildFullFixture,
};
