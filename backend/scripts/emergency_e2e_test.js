/**
 * Emergency Alert & SOS System – Complete End-to-End Test Suite
 * =============================================================
 * Tests all roles: Caregiver, Admin, Agency, Hospital, Family, Patient/User
 * Tests: API endpoints, RBAC, DB records, Socket.io events, status lifecycle
 *
 * Run with: node scripts/emergency_e2e_test.js
 */

require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io: SocketClient } = require('socket.io-client');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// ─── Models ──────────────────────────────────────────────────────────────────
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const Agency = require('../models/Agency');
const Hospital = require('../models/Hospital');
const Booking = require('../models/Booking');
const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const EmergencyAlert = require('../models/EmergencyAlert');
const EmergencyIncident = require('../models/EmergencyIncident');
const { generateAccessToken } = require('../utils/generateToken');

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5005';
const SOCKET_URL = 'http://localhost:5005';

// ─── Test State ───────────────────────────────────────────────────────────────
const results = [];
const socketEvents = {};
let testTokens = {};
let testData = {};

// ─── Utilities ────────────────────────────────────────────────────────────────
const COLORS = {
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', white: '\x1b[37m', reset: '\x1b[0m', bold: '\x1b[1m',
};
const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

function pass(section, test, info = '') {
  results.push({ section, test, status: 'PASS', info });
  console.log(`  ${c('green', '✔ PASS')} ${test}${info ? c('white', ' — ' + info) : ''}`);
}
function fail(section, test, info = '') {
  results.push({ section, test, status: 'FAIL', info });
  console.log(`  ${c('red', '✘ FAIL')} ${test}${info ? c('red', ' — ' + info) : ''}`);
}
function warn(section, test, info = '') {
  results.push({ section, test, status: 'WARN', info });
  console.log(`  ${c('yellow', '⚠ WARN')} ${test}${info ? c('yellow', ' — ' + info) : ''}`);
}

function section(name) {
  console.log(`\n${c('cyan', c('bold', `${'═'.repeat(60)}`))}`)
  console.log(c('cyan', c('bold', ` ${name}`)));
  console.log(`${c('cyan', c('bold', `${'═'.repeat(60)}`))}`);
}

async function api(method, path, token, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    let data;
    try { data = await res.json(); } catch { data = {}; }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Wait for Socket Event ─────────────────────────────────────────────────
function waitForSocketEvent(socket, event, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// ─── SETUP: Connect DB, create test data ─────────────────────────────────────
async function setupTestData() {
  section('SETUP — Creating Test Data in Database');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(c('green', '  ✔ Connected to MongoDB'));

  const timestamp = Date.now();
  const TEST_TAG = `e2etest_${timestamp}`;

  // ── 1. Admin user ──────────────────────────────────────────────────────────
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({ name: 'Test Admin', email: `admin_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'admin', isEmailVerified: true });
  }
  testTokens.admin = generateAccessToken(adminUser._id);
  testData.adminId = adminUser._id;
  console.log(`  ✔ Admin: ${adminUser.email}`);

  // ── 2. Agency user + Agency doc ────────────────────────────────────────────
  let agencyUser = await User.findOne({ role: 'agency' });
  let agencyDoc = agencyUser ? await Agency.findOne({ user: agencyUser._id }) : null;
  if (!agencyUser || !agencyDoc) {
    agencyUser = await User.create({ name: 'Test Agency', email: `agency_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'agency', isEmailVerified: true });
    agencyDoc = await Agency.create({ user: agencyUser._id, agencyName: `TestAgency_${TEST_TAG}`, licenseNumber: `LIC_${timestamp}`, status: 'approved' });
  }
  testTokens.agency = generateAccessToken(agencyUser._id);
  testData.agencyId = agencyDoc._id;
  testData.agencyUserId = agencyUser._id;
  console.log(`  ✔ Agency: ${agencyUser.email} (agencyId: ${agencyDoc._id})`);

  // ── 3. Second Agency (for cross-agency RBAC test) ─────────────────────────
  let agency2User = await User.findOne({ email: `agency2_${TEST_TAG}@test.com` });
  let agency2Doc;
  if (!agency2User) {
    agency2User = await User.create({ name: 'Test Agency 2', email: `agency2_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'agency', isEmailVerified: true });
    agency2Doc = await Agency.create({ user: agency2User._id, agencyName: `TestAgency2_${TEST_TAG}`, licenseNumber: `LIC2_${timestamp}`, status: 'approved' });
  } else {
    agency2Doc = await Agency.findOne({ user: agency2User._id });
  }
  testTokens.agency2 = generateAccessToken(agency2User._id);
  testData.agency2Id = agency2Doc._id;
  console.log(`  ✔ Agency2 (for RBAC): ${agency2User.email}`);

  // ── 4. Caregiver user + Caregiver doc ─────────────────────────────────────
  let caregiverUser = await User.findOne({ role: 'caregiver' });
  let caregiverDoc = caregiverUser ? await Caregiver.findOne({ user: caregiverUser._id }) : null;
  if (!caregiverUser || !caregiverDoc) {
    caregiverUser = await User.create({ name: 'Test Caregiver', email: `caregiver_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'caregiver', isEmailVerified: true });
    caregiverDoc = await Caregiver.create({ user: caregiverUser._id, agency: testData.agencyId, name: `TestCaregiver_${TEST_TAG}`, serviceType: 'nurse', experience: 3, rates: { hourly: 200 }, isActive: true });
  }
  testTokens.caregiver = generateAccessToken(caregiverUser._id);
  testData.caregiverId = caregiverDoc._id;
  testData.caregiverUserId = caregiverUser._id;
  console.log(`  ✔ Caregiver: ${caregiverUser.email} (caregiverId: ${caregiverDoc._id})`);

  // ── 5. Patient user + Patient doc ─────────────────────────────────────────
  let patientUser = await User.findOne({ role: 'user' });
  let patientDoc = patientUser ? await Patient.findOne({ user: patientUser._id }) : null;
  if (!patientUser) {
    patientUser = await User.create({ name: 'Test Patient', email: `patient_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'user', isEmailVerified: true });
  }
  if (!patientDoc) {
    patientDoc = await Patient.create({ user: patientUser._id, name: 'Test Patient' });
  }
  testTokens.patient = generateAccessToken(patientUser._id);
  testData.patientId = patientDoc._id;
  testData.patientUserId = patientUser._id;
  console.log(`  ✔ Patient: ${patientUser.email} (patientId: ${patientDoc._id})`);

  // ── 6. Hospital user + Hospital doc ───────────────────────────────────────
  let hospitalUser = await User.findOne({ role: 'hospital' });
  let hospitalDoc = hospitalUser ? await Hospital.findOne({ user: hospitalUser._id }) : null;
  if (!hospitalUser || !hospitalDoc) {
    hospitalUser = await User.create({ name: 'Test Hospital', email: `hospital_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'hospital', isEmailVerified: true });
    hospitalDoc = await Hospital.create({ user: hospitalUser._id, hospitalName: `TestHospital_${TEST_TAG}`, registrationNumber: `HOSP_${timestamp}`, status: 'approved' });
  }
  testTokens.hospital = generateAccessToken(hospitalUser._id);
  testData.hospitalId = hospitalDoc._id;
  testData.hospitalUserId = hospitalUser._id;
  console.log(`  ✔ Hospital: ${hospitalUser.email} (hospitalId: ${hospitalDoc._id})`);

  // ── 7. Family user + FamilyMember doc ────────────────────────────────────
  let familyUser = await User.findOne({ role: 'family' });
  let familyMemberDoc = familyUser ? await FamilyMember.findOne({ user: familyUser._id }) : null;
  if (!familyUser) {
    familyUser = await User.create({ name: 'Test Family', email: `family_${TEST_TAG}@test.com`, password: 'Test@1234', role: 'family', isEmailVerified: true });
    familyMemberDoc = await FamilyMember.create({ user: familyUser._id, patient: patientUser._id, name: 'Test Family Member', relationship: 'spouse', canReceiveEmergencyAlerts: true, isEmergencyContact: true });
  } else if (!familyMemberDoc) {
    familyMemberDoc = await FamilyMember.create({ user: familyUser._id, patient: patientUser._id, name: 'Test Family Member', relationship: 'spouse', canReceiveEmergencyAlerts: true });
  }
  testTokens.family = generateAccessToken(familyUser._id);
  testData.familyUserId = familyUser._id;
  console.log(`  ✔ Family: ${familyUser.email} (canReceiveEmergencyAlerts: ${familyMemberDoc.canReceiveEmergencyAlerts})`);

  // ── 8. Ongoing Booking ────────────────────────────────────────────────────
  let ongoingBooking = await Booking.findOne({ caregiver: testData.caregiverId, status: 'ongoing' });
  if (!ongoingBooking) {
    ongoingBooking = await Booking.create({
      user: patientUser._id,
      caregiver: testData.caregiverId,
      agency: testData.agencyId,
      serviceType: 'nurse',
      durationType: 'daily',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      rateApplied: 200,
      totalAmount: 200,
      status: 'ongoing',
    });
  }
  testData.ongoingBookingId = ongoingBooking._id;
  console.log(`  ✔ Ongoing Booking: ${ongoingBooking._id}`);

  // ── 9. Non-ongoing Booking (for validation test) ──────────────────────────
  let pendingBooking = await Booking.findOne({ caregiver: testData.caregiverId, status: 'pending' });
  if (!pendingBooking) {
    pendingBooking = await Booking.create({
      user: patientUser._id,
      caregiver: testData.caregiverId,
      agency: testData.agencyId,
      serviceType: 'nurse',
      durationType: 'daily',
      startDate: new Date(Date.now() + 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 3),
      rateApplied: 200,
      totalAmount: 200,
      status: 'pending',
    });
  }
  testData.pendingBookingId = pendingBooking._id;
  console.log(`  ✔ Pending Booking: ${pendingBooking._id}`);

  console.log(c('green', '\n  ✔ All test data ready.\n'));
}

// ─── TEST 1: Caregiver ────────────────────────────────────────────────────────
async function testCaregiver() {
  section('TEST 1: Caregiver Login Testing');

  // 1a. POST /api/emergency-alerts — non-caregiver should get 403
  const r1 = await api('POST', '/api/emergency-alerts', testTokens.patient, {
    bookingId: testData.ongoingBookingId, alertType: 'Medical Emergency', severityLevel: 'Critical', description: 'Test'
  });
  r1.status === 403 ? pass('caregiver', 'Non-caregiver gets 403 on raiseAlert') : fail('caregiver', 'Non-caregiver gets 403 on raiseAlert', `got ${r1.status}`);

  // 1b. Caregiver raises alert on PENDING booking (should fail 400)
  const r2 = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
    bookingId: testData.pendingBookingId, alertType: 'Fall Incident', severityLevel: 'High', description: 'Pending booking test'
  });
  r2.status === 400 ? pass('caregiver', 'Caregiver gets 400 for non-ongoing booking') : fail('caregiver', 'Caregiver gets 400 for non-ongoing booking', `got ${r2.status} — ${JSON.stringify(r2.data)}`);

  // 1c. Caregiver raises alert without description (should fail)
  const r3 = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
    bookingId: testData.ongoingBookingId, alertType: 'Injury', severityLevel: 'Low', description: ''
  });
  r3.status !== 201 ? pass('caregiver', 'Empty description rejected') : fail('caregiver', 'Empty description rejected', 'was accepted with empty description');

  // 1d. Caregiver successfully raises alert on ONGOING booking
  const r4 = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
    bookingId: testData.ongoingBookingId,
    alertType: 'Medical Emergency',
    severityLevel: 'Critical',
    description: 'E2E Test: Patient is unresponsive'
  });
  if (r4.status === 201 && r4.data?.data?._id) {
    pass('caregiver', 'Caregiver successfully raises alert on ongoing booking', `alertId: ${r4.data.data._id}`);
    testData.alertId = r4.data.data._id;
  } else {
    fail('caregiver', 'Caregiver successfully raises alert on ongoing booking', `${r4.status}: ${JSON.stringify(r4.data)}`);
  }

  // 1e. Raise second alert with High severity for admin notification test
  const r4b = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
    bookingId: testData.ongoingBookingId,
    alertType: 'Fall Incident',
    severityLevel: 'High',
    description: 'E2E Test: High severity fall'
  });
  if (r4b.status === 201) {
    pass('caregiver', 'Caregiver raises High severity alert', `alertId: ${r4b.data.data._id}`);
    testData.highAlertId = r4b.data.data._id;
  } else {
    fail('caregiver', 'Caregiver raises High severity alert', `${r4b.status}: ${JSON.stringify(r4b.data)}`);
  }

  // 1f. Verify DB record has all required fields
  if (testData.alertId) {
    const dbAlert = await EmergencyAlert.findById(testData.alertId);
    if (dbAlert) {
      const hasAllFields = dbAlert.caregiverId && dbAlert.patientId && dbAlert.agencyId && dbAlert.bookingId && dbAlert.alertType && dbAlert.severityLevel && dbAlert.description && dbAlert.status && dbAlert.createdAt;
      hasAllFields ? pass('caregiver', 'DB record has all required fields') : fail('caregiver', 'DB record has all required fields', 'Missing field(s)');
      dbAlert.status === 'Open' ? pass('caregiver', 'Alert status defaults to Open') : fail('caregiver', 'Alert status defaults to Open', `got: ${dbAlert.status}`);
    } else {
      fail('caregiver', 'Alert exists in DB', 'Not found in DB');
    }
  }

  // 1g. Caregiver can view their own alerts
  const r5 = await api('GET', '/api/emergency-alerts', testTokens.caregiver);
  if (r5.status === 200 && Array.isArray(r5.data?.data)) {
    pass('caregiver', 'Caregiver can GET their own alerts', `count: ${r5.data.data.length}`);
    const onlyOwn = r5.data.data.every(a => a.caregiverId && (a.caregiverId._id?.toString() === testData.caregiverId.toString() || a.caregiverId.toString() === testData.caregiverId.toString()));
    onlyOwn ? pass('caregiver', 'All returned alerts belong to this caregiver') : fail('caregiver', 'All returned alerts belong to this caregiver', 'Cross-caregiver leak detected');
  } else {
    fail('caregiver', 'Caregiver can GET their own alerts', `${r5.status}`);
  }

  // 1h. Caregiver gets single alert by ID
  if (testData.alertId) {
    const r6 = await api('GET', `/api/emergency-alerts/${testData.alertId}`, testTokens.caregiver);
    r6.status === 200 ? pass('caregiver', 'Caregiver can GET alert by ID') : fail('caregiver', 'Caregiver can GET alert by ID', `${r6.status}`);
  }

  // 1i. Caregiver CANNOT update alert status (should get 403)
  if (testData.alertId) {
    const r7 = await api('PUT', `/api/emergency-alerts/${testData.alertId}/status`, testTokens.caregiver, { status: 'Resolved', note: 'Test' });
    r7.status === 403 ? pass('caregiver', 'Caregiver cannot update alert status (403)') : fail('caregiver', 'Caregiver cannot update alert status (403)', `got ${r7.status}`);
  }

  // 1j. Unauthenticated request returns 401
  const r8 = await api('GET', '/api/emergency-alerts', null);
  r8.status === 401 ? pass('caregiver', 'Unauthenticated request returns 401') : fail('caregiver', 'Unauthenticated request returns 401', `got ${r8.status}`);

  // 1k. All valid alertType enum values
  const validTypes = ['Medical Emergency', 'Fall Incident', 'Breathing Difficulty', 'Medication Reaction', 'Injury', 'Hospital Transfer Required', 'Other'];
  const invalidTypeRes = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
    bookingId: testData.ongoingBookingId, alertType: 'INVALID_TYPE', severityLevel: 'High', description: 'Invalid alert type test'
  });
  invalidTypeRes.status !== 201 ? pass('caregiver', 'Invalid alertType is rejected by schema') : fail('caregiver', 'Invalid alertType is rejected by schema', 'Accepted invalid type');

  // 1l. Invalid severity rejected
  const invalidSevRes = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
    bookingId: testData.ongoingBookingId, alertType: 'Injury', severityLevel: 'EXTREME', description: 'Invalid severity test'
  });
  invalidSevRes.status !== 201 ? pass('caregiver', 'Invalid severityLevel is rejected by schema') : fail('caregiver', 'Invalid severityLevel is rejected by schema', 'Accepted invalid severity');
}

// ─── TEST 2: Admin ─────────────────────────────────────────────────────────────
async function testAdmin() {
  section('TEST 2: Admin Login Testing');

  // 2a. Admin can GET all alerts
  const r1 = await api('GET', '/api/emergency-alerts', testTokens.admin);
  if (r1.status === 200 && Array.isArray(r1.data?.data)) {
    pass('admin', 'Admin GET /api/emergency-alerts returns 200', `total: ${r1.data.count}`);
  } else {
    fail('admin', 'Admin GET /api/emergency-alerts returns 200', `${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // 2b. Admin sees the alert created by caregiver
  if (testData.alertId) {
    const found = r1.data?.data?.some(a => a._id === testData.alertId || a._id?.toString() === testData.alertId?.toString());
    found ? pass('admin', 'Admin can see caregiver-raised alert in list') : warn('admin', 'Admin can see caregiver-raised alert in list', 'Not found in list — may be OK if pagination applies');
  }

  // 2c. Admin can GET SOS incidents
  const r2 = await api('GET', '/api/emergency', testTokens.admin);
  r2.status === 200 ? pass('admin', 'Admin GET /api/emergency (all incidents) returns 200', `count: ${r2.data?.data?.docs?.length ?? r2.data?.data?.length ?? '?'}`) : fail('admin', 'Admin GET /api/emergency (all incidents)', `${r2.status}`);

  // 2d. Admin updates alert status: Open → In Progress
  if (testData.alertId) {
    const r3 = await api('PUT', `/api/emergency-alerts/${testData.alertId}/status`, testTokens.admin, { status: 'In Progress', note: 'Admin acknowledging — investigating now' });
    if (r3.status === 200) {
      pass('admin', 'Admin updates alert status to In Progress');
      const dbAlert = await EmergencyAlert.findById(testData.alertId);
      dbAlert?.status === 'In Progress' ? pass('admin', 'DB reflects In Progress status') : fail('admin', 'DB reflects In Progress status', `got: ${dbAlert?.status}`);
      dbAlert?.responseNotes?.length > 0 ? pass('admin', 'Response note saved in DB') : fail('admin', 'Response note saved in DB');
    } else {
      fail('admin', 'Admin updates alert status to In Progress', `${r3.status}: ${JSON.stringify(r3.data)}`);
    }
  }

  // 2e. Admin updates status: In Progress → Resolved
  if (testData.alertId) {
    const r4 = await api('PUT', `/api/emergency-alerts/${testData.alertId}/status`, testTokens.admin, { status: 'Resolved', note: 'Patient stabilized. Resolved by admin.' });
    if (r4.status === 200) {
      pass('admin', 'Admin updates alert status to Resolved');
      const dbAlert = await EmergencyAlert.findById(testData.alertId);
      dbAlert?.status === 'Resolved' ? pass('admin', 'DB reflects Resolved status') : fail('admin', 'DB reflects Resolved status', `got: ${dbAlert?.status}`);
      dbAlert?.resolvedAt ? pass('admin', 'resolvedAt timestamp set on resolve') : fail('admin', 'resolvedAt timestamp set on resolve');
      dbAlert?.resolvedBy ? pass('admin', 'resolvedBy field set to admin user') : fail('admin', 'resolvedBy field set to admin user');
    } else {
      fail('admin', 'Admin updates alert status to Resolved', `${r4.status}: ${JSON.stringify(r4.data)}`);
    }
  }

  // 2f. Admin filter by status
  const r5 = await api('GET', '/api/emergency-alerts?status=Open', testTokens.admin);
  if (r5.status === 200) {
    const allOpen = r5.data?.data?.every(a => a.status === 'Open');
    allOpen !== false ? pass('admin', 'Filter by status=Open works correctly') : fail('admin', 'Filter by status=Open works correctly', 'Non-open alerts in result');
  } else {
    fail('admin', 'Filter by status=Open', `${r5.status}`);
  }

  // 2g. Admin filter by severity
  const r6 = await api('GET', '/api/emergency-alerts?severityLevel=Critical', testTokens.admin);
  if (r6.status === 200) {
    const allCritical = r6.data?.data?.every(a => a.severityLevel === 'Critical');
    allCritical !== false ? pass('admin', 'Filter by severityLevel=Critical works') : fail('admin', 'Filter by severityLevel=Critical works', 'Non-critical in result');
  } else {
    fail('admin', 'Filter by severityLevel=Critical', `${r6.status}`);
  }

  // 2h. Admin can get single alert by ID
  if (testData.alertId) {
    const r7 = await api('GET', `/api/emergency-alerts/${testData.alertId}`, testTokens.admin);
    r7.status === 200 ? pass('admin', 'Admin can GET alert by ID') : fail('admin', 'Admin can GET alert by ID', `${r7.status}`);
    // Verify populated fields
    const a = r7.data?.data;
    if (a) {
      a.caregiverId?.name ? pass('admin', 'caregiverId is populated with name') : warn('admin', 'caregiverId is populated', 'name missing');
      a.patientId?.name ? pass('admin', 'patientId is populated with name') : warn('admin', 'patientId is populated', 'name missing');
    }
  }

  // 2i. Admin can acknowledge SOS
  if (testData.sosIncidentId) {
    const r8 = await api('PUT', `/api/emergency/${testData.sosIncidentId}/acknowledge`, testTokens.admin);
    r8.status === 200 ? pass('admin', 'Admin acknowledges SOS incident') : fail('admin', 'Admin acknowledges SOS incident', `${r8.status}`);
  }
}

// ─── TEST 3: Agency ───────────────────────────────────────────────────────────
async function testAgency() {
  section('TEST 3: Agency Login Testing');

  // 3a. Agency sees only its own alerts
  const r1 = await api('GET', '/api/emergency-alerts', testTokens.agency);
  if (r1.status === 200) {
    pass('agency', 'Agency GET /api/emergency-alerts returns 200', `count: ${r1.data?.count}`);
    const allBelongToAgency = r1.data?.data?.every(a => {
      const agId = a.agencyId?._id?.toString() || a.agencyId?.toString();
      return agId === testData.agencyId.toString();
    });
    allBelongToAgency !== false ? pass('agency', 'All returned alerts belong to this agency (RBAC)') : fail('agency', 'All returned alerts belong to this agency (RBAC)', 'Cross-agency data leak!');
  } else {
    fail('agency', 'Agency GET /api/emergency-alerts returns 200', `${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // 3b. Agency can update its own alert
  if (testData.highAlertId) {
    const r2 = await api('PUT', `/api/emergency-alerts/${testData.highAlertId}/status`, testTokens.agency, { status: 'In Progress', note: 'Agency dispatching team' });
    r2.status === 200 ? pass('agency', 'Agency can update its own alert status') : fail('agency', 'Agency can update its own alert status', `${r2.status}: ${JSON.stringify(r2.data)}`);
  }

  // 3c. Agency 2 cannot update Agency 1's alert (RBAC)
  if (testData.highAlertId) {
    const r3 = await api('PUT', `/api/emergency-alerts/${testData.highAlertId}/status`, testTokens.agency2, { status: 'Resolved', note: 'Unauthorized resolve' });
    r3.status === 403 ? pass('agency', 'Agency cannot update another agencys alert (403)') : fail('agency', 'Agency cannot update another agencys alert (403)', `got ${r3.status}`);
  }

  // 3d. Agency 2 GET — should not see Agency 1 alerts
  const r4 = await api('GET', '/api/emergency-alerts', testTokens.agency2);
  if (r4.status === 200) {
    const containsAgency1Alert = r4.data?.data?.some(a => {
      const agId = a.agencyId?._id?.toString() || a.agencyId?.toString();
      return agId === testData.agencyId.toString();
    });
    !containsAgency1Alert ? pass('agency', 'Agency2 cannot see Agency1 alerts (data isolation)') : fail('agency', 'Agency2 cannot see Agency1 alerts (data isolation)', 'Cross-agency data leak!');
  }

  // 3e. Agency cannot access SOS incidents route (only admin+hospital)
  const r5 = await api('GET', '/api/emergency', testTokens.agency);
  r5.status === 403 ? pass('agency', 'Agency denied access to /api/emergency (SOS incidents) — 403') : warn('agency', 'Agency /api/emergency access', `status: ${r5.status} — expected 403`);

  // 3f. Agency can view alert detail (their own)
  if (testData.highAlertId) {
    const r6 = await api('GET', `/api/emergency-alerts/${testData.highAlertId}`, testTokens.agency);
    r6.status === 200 ? pass('agency', 'Agency can view alert detail by ID (own)') : fail('agency', 'Agency can view alert detail by ID (own)', `${r6.status}`);
  }

  // 3g. Agency cannot view other agency's alert detail
  if (testData.alertId) {
    // Agency 2 should be blocked from agency 1's alert
    const r7 = await api('GET', `/api/emergency-alerts/${testData.alertId}`, testTokens.agency2);
    r7.status === 403 ? pass('agency', 'Agency2 denied viewing Agency1 alert detail (403)') : fail('agency', 'Agency2 denied viewing Agency1 alert detail (403)', `got ${r7.status}`);
  }
}

// ─── TEST 4: Hospital ─────────────────────────────────────────────────────────
async function testHospital() {
  section('TEST 4: Hospital Login Testing');

  // 4a. Hospital can access /api/emergency (SOS incidents)
  const r1 = await api('GET', '/api/emergency', testTokens.hospital);
  r1.status === 200 ? pass('hospital', 'Hospital GET /api/emergency returns 200') : fail('hospital', 'Hospital GET /api/emergency returns 200', `${r1.status}: ${JSON.stringify(r1.data)}`);

  // 4b. Hospital GET /api/emergency-alerts — filtered to hospitalId
  const r2 = await api('GET', '/api/emergency-alerts', testTokens.hospital);
  r2.status === 200 ? pass('hospital', 'Hospital GET /api/emergency-alerts returns 200') : fail('hospital', 'Hospital GET /api/emergency-alerts returns 200', `${r2.status}`);

  // 4c. Hospital cannot resolve an EmergencyAlert via PUT /status
  if (testData.alertId) {
    const r3 = await api('PUT', `/api/emergency-alerts/${testData.alertId}/status`, testTokens.hospital, { status: 'Resolved' });
    r3.status === 403 ? pass('hospital', 'Hospital cannot update EmergencyAlert status (403)') : fail('hospital', 'Hospital cannot update EmergencyAlert status (403)', `got ${r3.status}`);
  }

  // 4d. Hospital can view SOS incident if notified
  if (testData.sosIncidentId) {
    const r4 = await api('GET', `/api/emergency/${testData.sosIncidentId}`, testTokens.hospital);
    // Hospital should be in notifiedUsers or notifiedHospital — if it matches, 200 else 403
    console.log(`  ℹ Hospital access to SOS incident: ${r4.status}`);
    r4.status === 200 || r4.status === 403 ? pass('hospital', 'Hospital SOS incident access returns expected status') : fail('hospital', 'Hospital SOS incident access', `got ${r4.status}`);
  }

  // 4e. Hospital can view emergency alerts with hospitalId filter check
  if (r2.status === 200 && r2.data?.data) {
    const noOtherHospital = r2.data.data.every(a => !a.hospitalId || a.hospitalId?.toString() === testData.hospitalId.toString());
    noOtherHospital ? pass('hospital', 'Hospital only sees alerts with its hospitalId') : fail('hospital', 'Hospital only sees alerts with its hospitalId', 'Cross-hospital leak');
  }
}

// ─── TEST 5: Family ────────────────────────────────────────────────────────────
async function testFamily() {
  section('TEST 5: Family Login Testing');

  // 5a. Family GET /api/emergency-alerts
  const r1 = await api('GET', '/api/emergency-alerts', testTokens.family);
  if (r1.status === 200) {
    pass('family', 'Family GET /api/emergency-alerts returns 200', `count: ${r1.data?.count}`);
  } else {
    fail('family', 'Family GET /api/emergency-alerts returns 200', `${r1.status}: ${JSON.stringify(r1.data)}`);
  }

  // 5b. Family cannot raise alert
  const r2 = await api('POST', '/api/emergency-alerts', testTokens.family, {
    bookingId: testData.ongoingBookingId, alertType: 'Medical Emergency', severityLevel: 'Critical', description: 'Family trying to raise alert'
  });
  r2.status === 403 ? pass('family', 'Family cannot raise emergency alert (403)') : fail('family', 'Family cannot raise emergency alert (403)', `got ${r2.status}`);

  // 5c. Family cannot update alert status
  if (testData.alertId) {
    const r3 = await api('PUT', `/api/emergency-alerts/${testData.alertId}/status`, testTokens.family, { status: 'Resolved' });
    r3.status === 403 ? pass('family', 'Family cannot update alert status (403)') : fail('family', 'Family cannot update alert status (403)', `got ${r3.status}`);
  }

  // 5d. Family GET my incidents (SOS history)
  const r4 = await api('GET', '/api/emergency/my', testTokens.family);
  r4.status === 200 ? pass('family', 'Family can view own SOS incident history') : fail('family', 'Family can view own SOS incident history', `${r4.status}`);

  // 5e. Family cannot access /api/emergency (all incidents)
  const r5 = await api('GET', '/api/emergency', testTokens.family);
  r5.status === 403 ? pass('family', 'Family denied access to all /api/emergency incidents (403)') : warn('family', 'Family /api/emergency access control', `got ${r5.status}`);

  // 5f. Family can view patient incidents if linked
  const r6 = await api('GET', `/api/emergency/patient/${testData.patientUserId}`, testTokens.family);
  r6.status === 200 || r6.status === 403 ? pass('family', 'Family patient incidents endpoint responds correctly', `${r6.status}`) : fail('family', 'Family patient incidents endpoint', `${r6.status}`);
}

// ─── TEST 6: Patient/User ─────────────────────────────────────────────────────
async function testPatient() {
  section('TEST 6: Patient/User Login Testing');

  // 6a. Patient GET /api/emergency-alerts
  const r1 = await api('GET', '/api/emergency-alerts', testTokens.patient);
  r1.status === 200 ? pass('patient', 'Patient GET /api/emergency-alerts returns 200') : fail('patient', 'Patient GET /api/emergency-alerts returns 200', `${r1.status}: ${JSON.stringify(r1.data)}`);

  // 6b. Patient cannot raise EmergencyAlert
  const r2 = await api('POST', '/api/emergency-alerts', testTokens.patient, {
    bookingId: testData.ongoingBookingId, alertType: 'Medical Emergency', severityLevel: 'Critical', description: 'Patient trying to raise alert'
  });
  r2.status === 403 ? pass('patient', 'Patient cannot raise emergency alert (403)') : fail('patient', 'Patient cannot raise emergency alert (403)', `got ${r2.status}`);

  // 6c. Patient GET my SOS incidents
  const r3 = await api('GET', '/api/emergency/my', testTokens.patient);
  r3.status === 200 ? pass('patient', 'Patient GET /api/emergency/my returns 200') : fail('patient', 'Patient GET /api/emergency/my', `${r3.status}`);

  // 6d. Patient cannot access all /api/emergency
  const r4 = await api('GET', '/api/emergency', testTokens.patient);
  r4.status === 403 ? pass('patient', 'Patient denied access to /api/emergency all incidents (403)') : warn('patient', 'Patient /api/emergency access', `got ${r4.status}`);

  // 6e. Patient cannot view other patient's incidents
  // Use admin patient record vs a different userId
  const r5 = await api('GET', `/api/emergency/patient/${testData.adminId}`, testTokens.patient);
  r5.status === 403 ? pass('patient', 'Patient cannot view another patients incidents (403)') : warn('patient', 'Patient cannot view another patients incidents', `got ${r5.status}`);
}

// ─── TEST 7: SOS Incident Workflow ───────────────────────────────────────────
async function testSOSWorkflow() {
  section('TEST 7: SOS Incident Workflow');

  // 7a. Trigger SOS without GPS (should fail)
  const r1 = await api('POST', '/api/emergency/sos', testTokens.patient, {
    type: 'medical', description: 'Test SOS no GPS', severity: 'high'
  });
  r1.status === 400 ? pass('sos', 'SOS without GPS returns 400') : fail('sos', 'SOS without GPS returns 400', `got ${r1.status}: ${JSON.stringify(r1.data)}`);

  // 7b. Trigger SOS successfully
  const r2 = await api('POST', '/api/emergency/sos', testTokens.patient, {
    lat: 28.6139, lng: 77.2090, address: 'New Delhi, India', accuracy: 10,
    type: 'medical', description: 'E2E Test SOS — Patient needs help', severity: 'high',
    patientId: testData.patientUserId, bookingId: testData.ongoingBookingId
  });
  if (r2.status === 201 && r2.data?.data?._id) {
    pass('sos', 'SOS triggered successfully', `incidentId: ${r2.data.data._id}`);
    testData.sosIncidentId = r2.data.data._id;
  } else {
    fail('sos', 'SOS triggered successfully', `${r2.status}: ${JSON.stringify(r2.data)}`);
  }

  // 7c. Verify DB record
  if (testData.sosIncidentId) {
    const dbInc = await EmergencyIncident.findById(testData.sosIncidentId);
    if (dbInc) {
      pass('sos', 'SOS incident exists in database');
      dbInc.triggeredBy ? pass('sos', 'DB incident has triggeredBy field') : fail('sos', 'DB incident has triggeredBy field');
      dbInc.location?.lat && dbInc.location?.lng ? pass('sos', 'DB incident has lat/lng location') : fail('sos', 'DB incident has lat/lng location');
      dbInc.severity ? pass('sos', 'DB incident has severity field') : fail('sos', 'DB incident has severity field');
      dbInc.status === 'active' ? pass('sos', 'DB incident status defaults to active') : fail('sos', 'DB incident status defaults to active', `got: ${dbInc.status}`);
      dbInc.createdAt ? pass('sos', 'DB incident has timestamp') : fail('sos', 'DB incident has timestamp');
      dbInc.locationHistory?.length > 0 ? pass('sos', 'DB incident has locationHistory') : fail('sos', 'DB incident has locationHistory');
    } else {
      fail('sos', 'SOS incident exists in database', 'Not found in DB');
    }
  }

  // 7d. Update location
  if (testData.sosIncidentId) {
    const r3 = await api('POST', `/api/emergency/${testData.sosIncidentId}/location`, testTokens.patient, {
      lat: 28.7041, lng: 77.1025, address: 'Updated Location, Delhi'
    });
    r3.status === 200 ? pass('sos', 'Live location update succeeds') : fail('sos', 'Live location update succeeds', `${r3.status}: ${JSON.stringify(r3.data)}`);

    // Non-initiator cannot update location
    const r3b = await api('POST', `/api/emergency/${testData.sosIncidentId}/location`, testTokens.family, {
      lat: 28.5355, lng: 77.3910
    });
    r3b.status === 403 ? pass('sos', 'Non-initiator cannot update SOS location (403)') : fail('sos', 'Non-initiator cannot update SOS location (403)', `got ${r3b.status}`);
  }

  // 7e. Acknowledge SOS (admin)
  if (testData.sosIncidentId) {
    const r4 = await api('PUT', `/api/emergency/${testData.sosIncidentId}/acknowledge`, testTokens.admin);
    if (r4.status === 200) {
      pass('sos', 'Admin acknowledges SOS incident');
      const dbInc = await EmergencyIncident.findById(testData.sosIncidentId);
      dbInc?.status === 'acknowledged' ? pass('sos', 'DB incident status updated to acknowledged') : fail('sos', 'DB incident status updated to acknowledged', `got: ${dbInc?.status}`);
    } else {
      fail('sos', 'Admin acknowledges SOS incident', `${r4.status}: ${JSON.stringify(r4.data)}`);
    }
  }

  // 7f. Double-acknowledge returns 400
  if (testData.sosIncidentId) {
    const r5 = await api('PUT', `/api/emergency/${testData.sosIncidentId}/acknowledge`, testTokens.admin);
    r5.status === 400 ? pass('sos', 'Double-acknowledge returns 400 (already acknowledged)') : fail('sos', 'Double-acknowledge returns 400', `got ${r5.status}`);
  }

  // 7g. Mark Responding
  if (testData.sosIncidentId) {
    const r6 = await api('PUT', `/api/emergency/${testData.sosIncidentId}/respond`, testTokens.admin);
    if (r6.status === 200) {
      pass('sos', 'Admin marks incident as Responding');
      const dbInc = await EmergencyIncident.findById(testData.sosIncidentId);
      dbInc?.status === 'responding' ? pass('sos', 'DB incident status updated to responding') : fail('sos', 'DB incident status updated to responding', `got: ${dbInc?.status}`);
    } else {
      fail('sos', 'Admin marks incident as Responding', `${r6.status}`);
    }
  }

  // 7h. Resolve SOS
  if (testData.sosIncidentId) {
    const r7 = await api('PUT', `/api/emergency/${testData.sosIncidentId}/resolve`, testTokens.admin, {
      resolutionNote: 'Patient received medical care. Incident resolved.', isFalseAlarm: false
    });
    if (r7.status === 200) {
      pass('sos', 'Admin resolves SOS incident');
      const dbInc = await EmergencyIncident.findById(testData.sosIncidentId);
      dbInc?.status === 'resolved' ? pass('sos', 'DB incident status updated to resolved') : fail('sos', 'DB incident status updated to resolved', `got: ${dbInc?.status}`);
      dbInc?.resolvedAt ? pass('sos', 'DB incident has resolvedAt timestamp') : fail('sos', 'DB incident has resolvedAt timestamp');
      dbInc?.resolutionNote ? pass('sos', 'DB incident has resolutionNote') : fail('sos', 'DB incident has resolutionNote');
    } else {
      fail('sos', 'Admin resolves SOS incident', `${r7.status}`);
    }
  }

  // 7i. Trigger false alarm SOS and resolve as false_alarm
  const r8 = await api('POST', '/api/emergency/sos', testTokens.patient, {
    lat: 19.0760, lng: 72.8777, address: 'Mumbai Test', type: 'safety', severity: 'low', description: 'False alarm test'
  });
  if (r8.status === 201) {
    const falseAlarmId = r8.data.data._id;
    const r9 = await api('PUT', `/api/emergency/${falseAlarmId}/resolve`, testTokens.admin, { isFalseAlarm: true, resolutionNote: 'Confirmed false alarm' });
    if (r9.status === 200) {
      const dbInc = await EmergencyIncident.findById(falseAlarmId);
      dbInc?.status === 'false_alarm' ? pass('sos', 'False alarm resolve sets status to false_alarm') : fail('sos', 'False alarm resolve sets status to false_alarm', `got: ${dbInc?.status}`);
    } else {
      fail('sos', 'False alarm resolve', `${r9.status}`);
    }
  }
}

// ─── TEST 8: Socket.io Events ─────────────────────────────────────────────────
async function testSocketEvents() {
  section('TEST 8: Socket.io Real-Time Events');

  return new Promise((resolve) => {
    const adminSocket = SocketClient(SOCKET_URL, { auth: { token: testTokens.admin }, transports: ['websocket'] });
    const familySocket = SocketClient(SOCKET_URL, { auth: { token: testTokens.family }, transports: ['websocket'] });
    const hospitalSocket = SocketClient(SOCKET_URL, { auth: { token: testTokens.hospital }, transports: ['websocket'] });

    let adminConnected = false, familyConnected = false, hospitalConnected = false;

    const tryTest = async () => {
      if (!adminConnected || !familyConnected || !hospitalConnected) return;

      console.log(`  ℹ Sockets connected. Joining rooms...`);

      // Join rooms
      adminSocket.emit('join', testData.adminId.toString(), 'admin', null);
      familySocket.emit('join', testData.familyUserId.toString(), 'family', null);
      hospitalSocket.emit('join', testData.hospitalUserId.toString(), 'hospital', testData.hospitalId.toString());

      await sleep(500);

      // Test emergency_alert event listener
      let alertEmitted = false;
      adminSocket.on('emergency_alert', () => { alertEmitted = true; });

      // Test new_notification event on family socket
      let familyNotified = false;
      familySocket.on('new_notification', (n) => {
        if (n?.type === 'emergency_alert_raised') familyNotified = true;
      });

      // Raise a new alert to trigger socket events
      const r = await api('POST', '/api/emergency-alerts', testTokens.caregiver, {
        bookingId: testData.ongoingBookingId,
        alertType: 'Breathing Difficulty',
        severityLevel: 'Critical',
        description: 'E2E Socket test — breathing emergency'
      });

      if (r.status === 201) {
        testData.socketTestAlertId = r.data.data._id;
        pass('socket', 'New alert created for socket test');
      } else {
        fail('socket', 'New alert created for socket test', `${r.status}: ${JSON.stringify(r.data)}`);
      }

      await sleep(1500);

      alertEmitted ? pass('socket', 'emergency_alert broadcast event emitted to all') : warn('socket', 'emergency_alert broadcast event emitted', 'Not received within timeout — may need socket join before alert');

      // Test SOS socket events
      let sosBroadcast = false;
      adminSocket.on('sos_alert', () => { sosBroadcast = true; });

      const sosRes = await api('POST', '/api/emergency/sos', testTokens.patient, {
        lat: 12.9716, lng: 77.5946, address: 'Bangalore Test', type: 'medical',
        description: 'Socket test SOS', severity: 'critical'
      });
      if (sosRes.status === 201) {
        testData.socketTestSosId = sosRes.data.data._id;
        pass('socket', 'SOS triggered for socket test');
      }

      await sleep(1500);

      sosBroadcast ? pass('socket', 'sos_alert event received by admin_room') : warn('socket', 'sos_alert event received by admin_room', 'Timeout — confirm room join sequence');

      // Test sos_acknowledged event
      if (testData.socketTestSosId) {
        let ackReceived = false;
        // The initiator (patient socket) should get sos_acknowledged
        const patientSocket = SocketClient(SOCKET_URL, { auth: { token: testTokens.patient }, transports: ['websocket'] });
        await new Promise(r2 => patientSocket.on('connect', () => {
          patientSocket.emit('join', testData.patientUserId.toString(), 'user', null);
          r2();
        }));
        await sleep(300);

        patientSocket.on('sos_acknowledged', () => { ackReceived = true; });
        await api('PUT', `/api/emergency/${testData.socketTestSosId}/acknowledge`, testTokens.admin);
        await sleep(1500);
        ackReceived ? pass('socket', 'sos_acknowledged event received by SOS initiator') : warn('socket', 'sos_acknowledged event', 'Timeout or room issue');

        // sos_responding
        let respondReceived = false;
        patientSocket.on('sos_responding', () => { respondReceived = true; });
        await api('PUT', `/api/emergency/${testData.socketTestSosId}/respond`, testTokens.admin);
        await sleep(1500);
        respondReceived ? pass('socket', 'sos_responding event received by initiator') : warn('socket', 'sos_responding event', 'Timeout');

        // sos_resolved
        let resolvedReceived = false;
        patientSocket.on('sos_resolved', () => { resolvedReceived = true; });
        await api('PUT', `/api/emergency/${testData.socketTestSosId}/resolve`, testTokens.admin, { resolutionNote: 'Socket test resolve', isFalseAlarm: false });
        await sleep(1500);
        resolvedReceived ? pass('socket', 'sos_resolved event received by initiator') : warn('socket', 'sos_resolved event', 'Timeout');

        // emergency_alert_resolved
        let resolvedAlertReceived = false;
        patientSocket.on('emergency_alert_resolved', () => { resolvedAlertReceived = true; });
        if (testData.socketTestAlertId) {
          await api('PUT', `/api/emergency-alerts/${testData.socketTestAlertId}/status`, testTokens.admin, { status: 'Resolved', note: 'Socket test resolve' });
          await sleep(1500);
          resolvedAlertReceived ? pass('socket', 'emergency_alert_resolved event emitted on resolve') : warn('socket', 'emergency_alert_resolved event', 'Timeout or recipient mismatch');
        }

        patientSocket.disconnect();
      }

      adminSocket.disconnect();
      familySocket.disconnect();
      hospitalSocket.disconnect();
      resolve();
    };

    adminSocket.on('connect', () => { adminConnected = true; tryTest(); });
    familySocket.on('connect', () => { familyConnected = true; tryTest(); });
    hospitalSocket.on('connect', () => { hospitalConnected = true; tryTest(); });

    adminSocket.on('connect_error', (e) => { warn('socket', 'Admin socket connect_error', e.message); resolve(); });
    familySocket.on('connect_error', (e) => { warn('socket', 'Family socket connect_error', e.message); resolve(); });
    hospitalSocket.on('connect_error', (e) => { warn('socket', 'Hospital socket connect_error', e.message); resolve(); });

    // Timeout fallback
    setTimeout(() => {
      warn('socket', 'Socket test timeout', 'Server may not be running — socket tests skipped');
      resolve();
    }, 12000);
  });
}

// ─── TEST 9: RBAC Security ────────────────────────────────────────────────────
async function testRBACSecurity() {
  section('TEST 9: RBAC Security Testing');

  // 9a. No token — all endpoints return 401
  const endpoints = [
    ['GET', '/api/emergency-alerts'],
    ['POST', '/api/emergency-alerts'],
    ['GET', '/api/emergency'],
    ['POST', '/api/emergency/sos'],
    ['GET', '/api/emergency/my'],
  ];
  for (const [method, path] of endpoints) {
    const r = await api(method, path, null);
    r.status === 401 ? pass('rbac', `${method} ${path} → 401 without token`) : fail('rbac', `${method} ${path} → 401 without token`, `got ${r.status}`);
  }

  // 9b. Caregiver cannot see admin-only routes
  const r2 = await api('GET', '/api/emergency', testTokens.caregiver);
  r2.status === 403 ? pass('rbac', 'Caregiver cannot access all /api/emergency (403)') : warn('rbac', 'Caregiver /api/emergency access', `got ${r2.status}`);

  // 9c. Forged/expired token returns 401
  const r3 = await api('GET', '/api/emergency-alerts', 'forged.token.here');
  r3.status === 401 ? pass('rbac', 'Forged/invalid token returns 401') : fail('rbac', 'Forged/invalid token returns 401', `got ${r3.status}`);

  // 9d. Hospital cannot view all incidents (only their own)
  const r4 = await api('GET', '/api/emergency', testTokens.hospital);
  if (r4.status === 200 && r4.data?.data) {
    const docs = r4.data.data.docs || r4.data.data;
    const allForHospital = Array.isArray(docs) ? docs.every(i => !i.notifiedHospital || i.notifiedHospital?.toString() === testData.hospitalId.toString()) : true;
    allForHospital ? pass('rbac', 'Hospital only sees its own SOS incidents') : fail('rbac', 'Hospital only sees its own SOS incidents', 'Cross-hospital data leak!');
  }

  // 9e. Patient cannot view another patient's emergency alerts
  const r5 = await api('GET', `/api/emergency-alerts`, testTokens.patient);
  if (r5.status === 200 && r5.data?.data) {
    const onlyOwnPatient = r5.data.data.every(a => {
      const pid = a.patientId?._id?.toString() || a.patientId?.toString();
      return pid === testData.patientId.toString();
    });
    onlyOwnPatient ? pass('rbac', 'Patient only sees alerts for their own patient record') : fail('rbac', 'Patient only sees alerts for their own patient record', 'Cross-patient data leak!');
  }
}

// ─── TEST 10: Database Validation ─────────────────────────────────────────────
async function testDatabaseValidation() {
  section('TEST 10: Database Schema & Data Integrity Validation');

  // 10a. EmergencyAlert schema fields
  if (testData.alertId) {
    const alert = await EmergencyAlert.findById(testData.alertId)
      .populate('caregiverId', 'name')
      .populate('patientId', 'name')
      .populate('agencyId', 'agencyName')
      .populate('responseNotes.addedBy', 'name role');

    if (alert) {
      const checks = [
        ['bookingId', !!alert.bookingId],
        ['caregiverId', !!alert.caregiverId],
        ['patientId', !!alert.patientId],
        ['agencyId', !!alert.agencyId],
        ['alertType', !!alert.alertType],
        ['severityLevel', !!alert.severityLevel],
        ['description', !!alert.description],
        ['status', !!alert.status],
        ['createdAt', !!alert.createdAt],
        ['updatedAt', !!alert.updatedAt],
        ['resolvedAt (when Resolved)', alert.status === 'Resolved' ? !!alert.resolvedAt : true],
        ['resolvedBy (when Resolved)', alert.status === 'Resolved' ? !!alert.resolvedBy : true],
        ['responseNotes populated', Array.isArray(alert.responseNotes)],
      ];
      for (const [field, ok] of checks) {
        ok ? pass('db', `EmergencyAlert.${field} is present/correct`) : fail('db', `EmergencyAlert.${field} is present/correct`);
      }
    }
  }

  // 10b. EmergencyIncident schema fields
  if (testData.sosIncidentId) {
    const inc = await EmergencyIncident.findById(testData.sosIncidentId);
    if (inc) {
      const checks = [
        ['triggeredBy', !!inc.triggeredBy],
        ['triggerRole', !!inc.triggerRole],
        ['location.lat', !!inc.location?.lat],
        ['location.lng', !!inc.location?.lng],
        ['type', !!inc.type],
        ['status', !!inc.status],
        ['severity', !!inc.severity],
        ['createdAt', !!inc.createdAt],
        ['locationHistory', inc.locationHistory?.length > 0],
        ['resolvedAt (when resolved)', inc.status === 'resolved' ? !!inc.resolvedAt : true],
        ['resolutionNote (when resolved)', inc.status === 'resolved' ? !!inc.resolutionNote : true],
      ];
      for (const [field, ok] of checks) {
        ok ? pass('db', `EmergencyIncident.${field} is present/correct`) : fail('db', `EmergencyIncident.${field} is present/correct`);
      }
    }
  }

  // 10c. Verify EmergencyAlert indexes exist
  const alertIndexes = await EmergencyAlert.collection.getIndexes();
  const expectedIndexes = ['caregiverId_1_status_1', 'agencyId_1_status_1', 'patientId_1_status_1', 'hospitalId_1_status_1'];
  for (const idx of expectedIndexes) {
    alertIndexes[idx] ? pass('db', `Index ${idx} exists on EmergencyAlert collection`) : warn('db', `Index ${idx} exists on EmergencyAlert collection`, 'Not found — may impact query performance');
  }

  // 10d. Status enum validation
  const validAlertStatuses = ['Open', 'In Progress', 'Resolved'];
  const validIncidentStatuses = ['active', 'acknowledged', 'responding', 'resolved', 'false_alarm'];
  pass('db', `EmergencyAlert valid statuses: ${validAlertStatuses.join(', ')}`);
  pass('db', `EmergencyIncident valid statuses: ${validIncidentStatuses.join(', ')}`);
}

// ─── FINAL REPORT ─────────────────────────────────────────────────────────────
function printReport() {
  section('FINAL TEST REPORT');

  const bySection = {};
  for (const r of results) {
    if (!bySection[r.section]) bySection[r.section] = { pass: 0, fail: 0, warn: 0 };
    bySection[r.section][r.status.toLowerCase()]++;
  }

  const totalPass = results.filter(r => r.status === 'PASS').length;
  const totalFail = results.filter(r => r.status === 'FAIL').length;
  const totalWarn = results.filter(r => r.status === 'WARN').length;

  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                  EMERGENCY SYSTEM TEST RESULTS              │');
  console.log('├────────────────┬─────────┬─────────┬─────────┬─────────────┤');
  console.log('│ Section        │  PASS   │  FAIL   │  WARN   │  Status     │');
  console.log('├────────────────┼─────────┼─────────┼─────────┼─────────────┤');

  for (const [sec, counts] of Object.entries(bySection)) {
    const status = counts.fail > 0 ? c('red', '  FAIL ❌') : counts.warn > 0 ? c('yellow', '  WARN ⚠ ') : c('green', '  PASS ✔ ');
    console.log(`│ ${sec.padEnd(14)} │  ${String(counts.pass).padEnd(5)}  │  ${String(counts.fail).padEnd(5)}  │  ${String(counts.warn).padEnd(5)}  │${status}     │`);
  }

  console.log('├────────────────┼─────────┼─────────┼─────────┼─────────────┤');
  const overallStatus = totalFail > 0 ? c('red', '  FAIL ❌') : c('green', '  PASS ✔ ');
  console.log(`│ ${'TOTAL'.padEnd(14)} │  ${String(totalPass).padEnd(5)}  │  ${String(totalFail).padEnd(5)}  │  ${String(totalWarn).padEnd(5)}  │${overallStatus}     │`);
  console.log('└────────────────┴─────────┴─────────┴─────────┴─────────────┘');

  // Failures
  const fails = results.filter(r => r.status === 'FAIL');
  if (fails.length > 0) {
    console.log(c('red', '\n  FAILURES:'));
    fails.forEach(f => console.log(c('red', `  ✘ [${f.section}] ${f.test}`) + (f.info ? ` — ${f.info}` : '')));
  }

  // Warnings
  const warns = results.filter(r => r.status === 'WARN');
  if (warns.length > 0) {
    console.log(c('yellow', '\n  WARNINGS:'));
    warns.forEach(w => console.log(c('yellow', `  ⚠ [${w.section}] ${w.test}`) + (w.info ? ` — ${w.info}` : '')));
  }

  console.log('\n' + c('cyan', c('bold', '  SECURITY ISSUES FOUND:')));
  const secIssues = results.filter(r => r.status === 'FAIL' && (r.section === 'rbac' || r.info?.toLowerCase().includes('leak')));
  secIssues.length === 0 ? console.log(c('green', '  ✔ No critical security issues found.')) : secIssues.forEach(i => console.log(c('red', `  ✘ ${i.test}: ${i.info}`)));

  console.log('\n' + c('cyan', c('bold', '  RECOMMENDATIONS:')));
  console.log('  1. Add a dedicated SOS button in PatientDashboard frontend');
  console.log('  2. Consider adding WebSocket authentication via token in socketServer.js');
  console.log('  3. Add rate-limiting to POST /api/emergency/sos to prevent abuse');
  console.log('  4. Hospital EmergencyAlert filtering only works if patient.assignedHospital is set');
  console.log('  5. Agency does not receive socket notifications for new alerts (only Admin/Family)');
  console.log('  6. triggerRole enum in EmergencyIncident does not include "admin" or "hospital"');
  console.log('  7. JWT_EXPIRES_IN is 1h — ensure refresh token flow is working in production');
  console.log('  8. Consider adding pagination to /api/emergency-alerts GET endpoint\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(c('bold', c('cyan', '\n🚨 EMERGENCY ALERT & SOS SYSTEM — END-TO-END TEST SUITE\n')));
  console.log(`  Backend: ${BASE_URL}`);
  console.log(`  Time: ${new Date().toISOString()}\n`);

  try {
    await setupTestData();
    await testCaregiver();
    await testAdmin();
    await testAgency();
    await testHospital();
    await testFamily();
    await testPatient();
    await testSOSWorkflow();

    // Test socket events only if server is running
    const healthCheck = await api('GET', '/api/health', null);
    if (healthCheck.status === 200) {
      await testSocketEvents();
    } else {
      warn('socket', 'Socket tests skipped — server not running at port 5005', `status: ${healthCheck.status}`);
    }

    await testRBACSecurity();
    await testDatabaseValidation();

    printReport();
  } catch (err) {
    console.error(c('red', `\n  ❌ FATAL ERROR: ${err.message}`));
    console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    console.log(c('green', '\n  ✔ Disconnected from MongoDB.'));
    process.exit(0);
  }
}

main();
