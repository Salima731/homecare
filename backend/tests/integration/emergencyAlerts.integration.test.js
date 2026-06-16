/**
 * tests/integration/emergencyAlerts.integration.test.js
 * ──────────────────────────────────────────────────────
 * Supertest integration tests for /api/emergency-alerts
 * Uses real in-memory MongoDB. No mocks for models.
 *
 * Run: npx jest tests/integration/emergencyAlerts.integration.test.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const request  = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('../setup/db');
const { buildTestApp, createMockIo }              = require('../setup/testApp');
const { buildFullFixture, createEmergencyAlert }  = require('../setup/fixtures');

const EmergencyAlert = require('../../models/EmergencyAlert');

// ─── App & Fixtures ──────────────────────────────────────────────────────────
let app, mockIo, fixtures;

beforeAll(async () => {
  await connectTestDB();
  mockIo = createMockIo();
  app    = buildTestApp(mockIo);
  process.env.JWT_SECRET      = process.env.JWT_SECRET || 'test-jwt-secret-e2e';
  process.env.JWT_EXPIRES_IN  = '1h';
});

beforeEach(async () => {
  await clearTestDB();
  mockIo._emitted = {};
  fixtures = await buildFullFixture();
});

afterAll(async () => {
  await closeTestDB();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const auth = (token) => ({ Authorization: `Bearer ${token}` });

// ─── POST /api/emergency-alerts ───────────────────────────────────────────────
describe('POST /api/emergency-alerts', () => {
  let validBody;

  beforeEach(() => {
    validBody = {
      bookingId:     fixtures.bookings.ongoingBooking._id.toString(),
      alertType:     'Medical Emergency',
      severityLevel: 'Critical',
      description:   'Patient is unresponsive and not breathing',
    };
  });

  // ── Authentication ───────────────────────────────────────────────────────────
  test('401 — unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/emergency-alerts').send(validBody);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ── Role enforcement ─────────────────────────────────────────────────────────
  test('403 — non-caregiver (patient) cannot raise alert', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.patient))
      .send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Only caregivers/i);
  });

  test('403 — non-caregiver (admin) cannot raise alert', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.admin))
      .send(validBody);
    expect(res.status).toBe(403);
  });

  test('403 — non-caregiver (family) cannot raise alert', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.family))
      .send(validBody);
    expect(res.status).toBe(403);
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  test('400 — booking in "pending" status is rejected', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send({ ...validBody, bookingId: fixtures.bookings.pendingBooking._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ongoing bookings/i);
  });

  test('400 — missing description is rejected (Mongoose validation)', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send({ ...validBody, description: '' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('400 — invalid alertType enum value', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send({ ...validBody, alertType: 'INVALID_TYPE' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('400 — invalid severityLevel enum value', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send({ ...validBody, severityLevel: 'EXTREME' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // ── Successful creation ───────────────────────────────────────────────────────
  test('201 — caregiver raises alert on ongoing booking', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.status).toBe('Open');
    expect(res.body.data.alertType).toBe('Medical Emergency');
    expect(res.body.data.severityLevel).toBe('Critical');
  });

  // ── DB persistence ────────────────────────────────────────────────────────────
  test('DB — alert document is persisted correctly', async () => {
    const res = await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send(validBody);

    const alertInDB = await EmergencyAlert.findById(res.body.data._id);
    expect(alertInDB).not.toBeNull();
    expect(alertInDB.caregiverId.toString()).toBe(fixtures.docs.caregiverDoc._id.toString());
    expect(alertInDB.patientId.toString()).toBe(fixtures.docs.patientDoc._id.toString());
    expect(alertInDB.agencyId.toString()).toBe(fixtures.docs.agencyDoc._id.toString());
    expect(alertInDB.description).toBe('Patient is unresponsive and not breathing');
    expect(alertInDB.createdAt).toBeInstanceOf(Date);
    expect(alertInDB.updatedAt).toBeInstanceOf(Date);
  });

  // ── Socket event ─────────────────────────────────────────────────────────────
  test('Socket — emergency_alert broadcast is emitted on creation', async () => {
    await request(app)
      .post('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver))
      .send(validBody);

    const broadcastCalls = mockIo._emitted['broadcast'] || [];
    const hasEmergencyAlert = broadcastCalls.some(e => e.event === 'emergency_alert');
    expect(hasEmergencyAlert).toBe(true);
  });

  // ── All valid alertTypes ──────────────────────────────────────────────────────
  const validTypes = [
    'Medical Emergency', 'Fall Incident', 'Breathing Difficulty',
    'Medication Reaction', 'Injury', 'Hospital Transfer Required', 'Other',
  ];
  validTypes.forEach((alertType) => {
    test(`201 — alertType "${alertType}" is accepted`, async () => {
      const res = await request(app)
        .post('/api/emergency-alerts')
        .set(auth(fixtures.tokens.caregiver))
        .send({ ...validBody, alertType });
      expect(res.status).toBe(201);
    });
  });
});

// ─── GET /api/emergency-alerts ────────────────────────────────────────────────
describe('GET /api/emergency-alerts', () => {

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get('/api/emergency-alerts');
    expect(res.status).toBe(401);
  });

  test('200 — admin sees all alerts', async () => {
    // Seed two alerts
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);

    const res = await request(app)
      .get('/api/emergency-alerts')
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  test('200 — caregiver sees only own alerts', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);

    // Create a second caregiver's alert with different caregiverId
    const fakeId = new mongoose.Types.ObjectId();
    await EmergencyAlert.create({
      bookingId: fixtures.bookings.ongoingBooking._id,
      caregiverId: fakeId,
      patientId: patientDoc._id,
      agencyId: agencyDoc._id,
      alertType: 'Fall Incident',
      severityLevel: 'Low',
      description: 'Other caregiver alert',
      status: 'Open',
    });

    const res = await request(app)
      .get('/api/emergency-alerts')
      .set(auth(fixtures.tokens.caregiver));

    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.caregiverId._id === caregiverDoc._id.toString() || a.caregiverId === caregiverDoc._id.toString())).toBe(true);
    expect(res.body.count).toBe(1);
  });

  test('200 — agency sees only its own agency alerts', async () => {
    const { caregiverDoc, patientDoc, agencyDoc, agency2Doc } = fixtures.docs;

    // Agency 1 alert
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);

    // Agency 2 alert
    const fakeBookingId = new mongoose.Types.ObjectId();
    await EmergencyAlert.create({
      bookingId: fakeBookingId,
      caregiverId: caregiverDoc._id,
      patientId: patientDoc._id,
      agencyId: agency2Doc._id,
      alertType: 'Injury',
      severityLevel: 'Medium',
      description: 'Agency 2 alert',
      status: 'Open',
    });

    const res = await request(app)
      .get('/api/emergency-alerts')
      .set(auth(fixtures.tokens.agency));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    const agencyIds = res.body.data.map(a => a.agencyId?._id || a.agencyId);
    expect(agencyIds.every(id => id.toString() === agencyDoc._id.toString())).toBe(true);
  });

  test('200 — filter by status=Open works correctly', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id, { status: 'Open' });
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id, { status: 'Resolved', resolvedAt: new Date(), resolvedBy: fixtures.users.adminUser._id });

    const res = await request(app)
      .get('/api/emergency-alerts?status=Open')
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.status === 'Open')).toBe(true);
  });

  test('200 — filter by severityLevel=Critical', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id, { severityLevel: 'Critical' });
    await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id, { severityLevel: 'Low' });

    const res = await request(app)
      .get('/api/emergency-alerts?severityLevel=Critical')
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.severityLevel === 'Critical')).toBe(true);
  });
});

// ─── GET /api/emergency-alerts/:id ───────────────────────────────────────────
describe('GET /api/emergency-alerts/:id', () => {

  test('401 — unauthenticated request', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    const alert = await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);
    const res = await request(app).get(`/api/emergency-alerts/${alert._id}`);
    expect(res.status).toBe(401);
  });

  test('200 — admin can view any alert by ID', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    const alert = await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);

    const res = await request(app)
      .get(`/api/emergency-alerts/${alert._id}`)
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(alert._id.toString());
    expect(res.body.data.caregiverId).toBeDefined();
    expect(res.body.data.patientId).toBeDefined();
  });

  test('200 — caregiver can view own alert', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    const alert = await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);

    const res = await request(app)
      .get(`/api/emergency-alerts/${alert._id}`)
      .set(auth(fixtures.tokens.caregiver));

    expect(res.status).toBe(200);
  });

  test('403 — caregiver cannot view another caregivers alert', async () => {
    const { patientDoc, agencyDoc } = fixtures.docs;
    const foreignCaregiverId = new mongoose.Types.ObjectId();
    const alert = await EmergencyAlert.create({
      bookingId: fixtures.bookings.ongoingBooking._id,
      caregiverId: foreignCaregiverId,
      patientId: patientDoc._id,
      agencyId: agencyDoc._id,
      alertType: 'Injury',
      severityLevel: 'High',
      description: 'Foreign caregiver alert',
      status: 'Open',
    });

    const res = await request(app)
      .get(`/api/emergency-alerts/${alert._id}`)
      .set(auth(fixtures.tokens.caregiver));

    expect(res.status).toBe(403);
  });

  test('404 — non-existent alert ID returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/emergency-alerts/${fakeId}`)
      .set(auth(fixtures.tokens.admin));
    expect(res.status).toBe(404);
  });

  test('Response includes populated caregiverId.name and patientId.name', async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    const alert = await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);

    const res = await request(app)
      .get(`/api/emergency-alerts/${alert._id}`)
      .set(auth(fixtures.tokens.admin));

    expect(res.body.data.caregiverId.name).toBeDefined();
    expect(res.body.data.patientId.name).toBeDefined();
  });
});

// ─── PUT /api/emergency-alerts/:id/status ─────────────────────────────────────
describe('PUT /api/emergency-alerts/:id/status', () => {

  let alert;
  beforeEach(async () => {
    const { caregiverDoc, patientDoc, agencyDoc } = fixtures.docs;
    alert = await createEmergencyAlert(fixtures.bookings.ongoingBooking._id, caregiverDoc._id, patientDoc._id, agencyDoc._id);
  });

  test('401 — unauthenticated request', async () => {
    const res = await request(app).put(`/api/emergency-alerts/${alert._id}/status`).send({ status: 'Resolved' });
    expect(res.status).toBe(401);
  });

  test('403 — caregiver cannot update alert status', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.caregiver))
      .send({ status: 'Resolved' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Only agencies and admins/i);
  });

  test('403 — family cannot update alert status', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.family))
      .send({ status: 'Resolved' });
    expect(res.status).toBe(403);
  });

  test('403 — hospital cannot update alert status', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.hospital))
      .send({ status: 'Resolved' });
    expect(res.status).toBe(403);
  });

  test('200 — admin updates status to In Progress', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.admin))
      .send({ status: 'In Progress', note: 'Investigating' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('In Progress');
  });

  test('200 — admin resolves alert and sets resolvedAt/resolvedBy in DB', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.admin))
      .send({ status: 'Resolved', note: 'Patient stabilized' });

    expect(res.status).toBe(200);
    const inDB = await EmergencyAlert.findById(alert._id);
    expect(inDB.status).toBe('Resolved');
    expect(inDB.resolvedAt).toBeInstanceOf(Date);
    expect(inDB.resolvedBy.toString()).toBe(fixtures.users.adminUser._id.toString());
    expect(inDB.responseNotes[0].note).toBe('Patient stabilized');
    expect(inDB.responseNotes[0].role).toBe('admin');
  });

  test('200 — agency resolves its own alert', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.agency))
      .send({ status: 'Resolved', note: 'Agency resolved' });
    expect(res.status).toBe(200);
  });

  test('403 — agency2 cannot update agency1 alert', async () => {
    const res = await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.agency2))
      .send({ status: 'Resolved' });
    expect(res.status).toBe(403);
  });

  test('DB — multiple response notes accumulate correctly', async () => {
    await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.admin))
      .send({ note: 'First note' });
    await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.admin))
      .send({ note: 'Second note' });

    const inDB = await EmergencyAlert.findById(alert._id);
    expect(inDB.responseNotes.length).toBe(2);
    expect(inDB.responseNotes[0].note).toBe('First note');
    expect(inDB.responseNotes[1].note).toBe('Second note');
  });

  test('Socket — emergency_alert_resolved event emitted on Resolve', async () => {
    mockIo._emitted = {};
    await request(app)
      .put(`/api/emergency-alerts/${alert._id}/status`)
      .set(auth(fixtures.tokens.admin))
      .send({ status: 'Resolved', note: 'Resolved' });

    // Check that socket emit was called (to caregiver or family user rooms)
    expect(mockIo.to).toHaveBeenCalled();
  });
});
