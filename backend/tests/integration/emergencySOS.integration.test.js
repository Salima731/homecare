/**
 * tests/integration/emergencySOS.integration.test.js
 * ──────────────────────────────────────────────────
 * Supertest integration tests for all /api/emergency (SOS) endpoints.
 * Uses real in-memory MongoDB. No mocks for models.
 *
 * Run: npx jest tests/integration/emergencySOS.integration.test.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const request  = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('../setup/db');
const { buildTestApp, createMockIo }              = require('../setup/testApp');
const { buildFullFixture, createEmergencyIncident, createHospitalDoc, createHospitalUser }  = require('../setup/fixtures');

const EmergencyIncident = require('../../models/EmergencyIncident');
const Notification = require('../../models/Notification');
const User = require('../../models/User');

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

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// ─── POST /api/emergency/sos ────────────────────────────────────────────────
describe('POST /api/emergency/sos', () => {
  let validBody;

  beforeEach(() => {
    validBody = {
      lat: 28.6139,
      lng: 77.2090,
      address: 'New Delhi, India',
      accuracy: 10,
      type: 'medical',
      description: 'Fall incident in living room',
      patientId: fixtures.users.patientUser._id.toString(),
      severity: 'high',
    };
  });

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).post('/api/emergency/sos').send(validBody);
    expect(res.status).toBe(401);
  });

  test('400 — missing lat/lng coordinates rejected', async () => {
    const res = await request(app)
      .post('/api/emergency/sos')
      .set(auth(fixtures.tokens.patient))
      .send({ ...validBody, lat: null, lng: null });
    expect(res.status).toBe(400);
  });

  test('201 — successfully triggers SOS incident', async () => {
    const res = await request(app)
      .post('/api/emergency/sos')
      .set(auth(fixtures.tokens.patient))
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.triggeredBy.toString()).toBe(fixtures.users.patientUser._id.toString());
    expect(res.body.data.location.lat).toBe(28.6139);
  });

  test('Socket & Notifications — correct socket alerts emitted and notification created', async () => {
    const res = await request(app)
      .post('/api/emergency/sos')
      .set(auth(fixtures.tokens.patient))
      .send(validBody);

    const incidentId = res.body.data._id;

    // Check sockets for admin room
    const adminCalls = mockIo._emitted['admin_room'] || [];
    expect(adminCalls.some(c => c.event === 'sos_alert')).toBe(true);

    // Check notification in database
    const notification = await Notification.findOne({
      recipient: fixtures.users.familyUser._id,
      type: 'emergency_sos'
    });
    expect(notification).not.toBeNull();
    expect(notification.data.incidentId.toString()).toBe(incidentId.toString());
  });
});

// ─── GET /api/emergency/my ──────────────────────────────────────────────────
describe('GET /api/emergency/my', () => {
  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get('/api/emergency/my');
    expect(res.status).toBe(401);
  });

  test('200 — user gets their triggered incidents', async () => {
    await createEmergencyIncident(fixtures.users.patientUser._id);
    await createEmergencyIncident(fixtures.users.patientUser._id);
    await createEmergencyIncident(fixtures.users.adminUser._id); // non-patient

    const res = await request(app)
      .get('/api/emergency/my')
      .set(auth(fixtures.tokens.patient));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

// ─── GET /api/emergency (getAllIncidents) ────────────────────────────────────
describe('GET /api/emergency', () => {
  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get('/api/emergency');
    expect(res.status).toBe(401);
  });

  test('403 — caregiver, family or patient role blocked', async () => {
    const res = await request(app)
      .get('/api/emergency')
      .set(auth(fixtures.tokens.caregiver));
    expect(res.status).toBe(403);
  });

  test('200 — admin retrieves all incidents', async () => {
    await createEmergencyIncident(fixtures.users.patientUser._id);
    await createEmergencyIncident(fixtures.users.caregiverUser._id);

    const res = await request(app)
      .get('/api/emergency')
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  test('200 — hospital retrieves only incidents matching their hospital ID', async () => {
    const hospitalDoc = fixtures.docs.hospitalDoc;
    await createEmergencyIncident(fixtures.users.patientUser._id, { notifiedHospital: hospitalDoc._id });
    await createEmergencyIncident(fixtures.users.patientUser._id, { notifiedHospital: new mongoose.Types.ObjectId() });

    const res = await request(app)
      .get('/api/emergency')
      .set(auth(fixtures.tokens.hospital));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].notifiedHospital._id.toString()).toBe(hospitalDoc._id.toString());
  });
});

// ─── GET /api/emergency/patient/:patientId ──────────────────────────────────
describe('GET /api/emergency/patient/:patientId', () => {
  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get(`/api/emergency/patient/${fixtures.users.patientUser._id}`);
    expect(res.status).toBe(401);
  });

  test('403 — unlinked family member blocked', async () => {
    const foreignUser = await createHospitalUser();
    const foreignToken = require('../../utils/generateToken').generateAccessToken(foreignUser._id);

    const res = await request(app)
      .get(`/api/emergency/patient/${fixtures.users.patientUser._id}`)
      .set(auth(foreignToken));

    expect(res.status).toBe(403);
  });

  test('200 — authorized family member retrieves patient incidents', async () => {
    await createEmergencyIncident(fixtures.users.patientUser._id, { patient: fixtures.users.patientUser._id });

    const res = await request(app)
      .get(`/api/emergency/patient/${fixtures.users.patientUser._id}`)
      .set(auth(fixtures.tokens.family));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('200 — admin retrieves patient incidents', async () => {
    await createEmergencyIncident(fixtures.users.patientUser._id, { patient: fixtures.users.patientUser._id });

    const res = await request(app)
      .get(`/api/emergency/patient/${fixtures.users.patientUser._id}`)
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

// ─── GET /api/emergency/:id ─────────────────────────────────────────────────
describe('GET /api/emergency/:id', () => {
  let incident;

  beforeEach(async () => {
    incident = await createEmergencyIncident(fixtures.users.patientUser._id, {
      notifiedUsers: [fixtures.users.familyUser._id]
    });
  });

  test('401 — unauthenticated request rejected', async () => {
    const res = await request(app).get(`/api/emergency/${incident._id}`);
    expect(res.status).toBe(401);
  });

  test('403 — unrelated user blocked', async () => {
    const res = await request(app)
      .get(`/api/emergency/${incident._id}`)
      .set(auth(fixtures.tokens.caregiver));
    expect(res.status).toBe(403);
  });

  test('200 — triggerer can view details', async () => {
    const res = await request(app)
      .get(`/api/emergency/${incident._id}`)
      .set(auth(fixtures.tokens.patient));
    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(incident._id.toString());
  });

  test('200 — notified user (family) can view details', async () => {
    const res = await request(app)
      .get(`/api/emergency/${incident._id}`)
      .set(auth(fixtures.tokens.family));
    expect(res.status).toBe(200);
  });

  test('200 — admin can view details', async () => {
    const res = await request(app)
      .get(`/api/emergency/${incident._id}`)
      .set(auth(fixtures.tokens.admin));
    expect(res.status).toBe(200);
  });
});

// ─── POST /api/emergency/:id/location ───────────────────────────────────────
describe('POST /api/emergency/:id/location', () => {
  let incident;

  beforeEach(async () => {
    incident = await createEmergencyIncident(fixtures.users.patientUser._id, {
      notifiedUsers: [fixtures.users.familyUser._id]
    });
  });

  test('403 — non-triggerer cannot update location', async () => {
    const res = await request(app)
      .post(`/api/emergency/${incident._id}/location`)
      .set(auth(fixtures.tokens.caregiver))
      .send({ lat: 28.6145, lng: 77.2095, address: 'New Location' });
    expect(res.status).toBe(403);
  });

  test('200 — triggerer updates coordinates successfully', async () => {
    const res = await request(app)
      .post(`/api/emergency/${incident._id}/location`)
      .set(auth(fixtures.tokens.patient))
      .send({ lat: 28.6145, lng: 77.2095, address: 'New Location' });

    expect(res.status).toBe(200);
    expect(res.body.data.lat).toBe(28.6145);
    expect(res.body.data.lng).toBe(77.2095);
    expect(res.body.data.locationHistory).toHaveLength(2); // Initial location + updated location
  });
});

// ─── PUT /api/emergency/:id/acknowledge ─────────────────────────────────────
describe('PUT /api/emergency/:id/acknowledge', () => {
  let incident;

  beforeEach(async () => {
    incident = await createEmergencyIncident(fixtures.users.patientUser._id);
  });

  test('200 — responder acknowledges SOS', async () => {
    const res = await request(app)
      .put(`/api/emergency/${incident._id}/acknowledge`)
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('acknowledged');
    expect(res.body.data.respondedBy.toString()).toBe(fixtures.users.adminUser._id.toString());
  });

  test('400 — fail to acknowledge non-active incident', async () => {
    incident.status = 'resolved';
    await incident.save();

    const res = await request(app)
      .put(`/api/emergency/${incident._id}/acknowledge`)
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/emergency/:id/respond ─────────────────────────────────────────
describe('PUT /api/emergency/:id/respond', () => {
  let incident;

  beforeEach(async () => {
    incident = await createEmergencyIncident(fixtures.users.patientUser._id);
  });

  test('200 — responder marks SOS as responding', async () => {
    const res = await request(app)
      .put(`/api/emergency/${incident._id}/respond`)
      .set(auth(fixtures.tokens.admin));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('responding');
  });
});

// ─── PUT /api/emergency/:id/resolve ─────────────────────────────────────────
describe('PUT /api/emergency/:id/resolve', () => {
  let incident;

  beforeEach(async () => {
    incident = await createEmergencyIncident(fixtures.users.patientUser._id);
  });

  test('200 — resolver resolves SOS successfully', async () => {
    const res = await request(app)
      .put(`/api/emergency/${incident._id}/resolve`)
      .set(auth(fixtures.tokens.admin))
      .send({ resolutionNote: 'False alarm resolved', isFalseAlarm: true });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('false_alarm');
    expect(res.body.data.resolutionNote).toBe('False alarm resolved');
  });
});
