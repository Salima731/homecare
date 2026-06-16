/**
 * tests/unit/emergencyController.test.js
 * ────────────────────────────────────────
 * Unit tests for emergencyController.js (SOS Incident system)
 * All Mongoose operations mocked — no real DB required.
 *
 * Run: npx jest tests/unit/emergencyController.test.js
 */

jest.mock('../../models/EmergencyIncident');
jest.mock('../../models/User');
jest.mock('../../models/Hospital');
jest.mock('../../models/FamilyMember');
jest.mock('../../models/Caregiver');
jest.mock('../../utils/asyncHandler', () => (fn) => fn);
jest.mock('../../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../utils/paginate', () => ({
  paginate: jest.fn(),
}));

const mongoose          = require('mongoose');
const EmergencyIncident = require('../../models/EmergencyIncident');
const User              = require('../../models/User');
const Hospital          = require('../../models/Hospital');
const FamilyMember      = require('../../models/FamilyMember');
const { paginate }      = require('../../utils/paginate');

const {
  triggerSOS,
  updateLocation,
  acknowledgeSOS,
  markResponding,
  resolveSOS,
  getMyIncidents,
  getAllIncidents,
  getIncidentById,
  getPatientIncidents,
} = require('../../controllers/emergencyController');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeId = () => new mongoose.Types.ObjectId();

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeMockIo = () => ({
  emit: jest.fn(),
  to: jest.fn(() => ({ emit: jest.fn() })),
});

const makeReq = (overrides = {}) => ({
  user:   { _id: makeId(), role: 'user' },
  body:   {},
  query:  {},
  params: {},
  io:     makeMockIo(),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Unit — emergencyController', () => {

  // ─── triggerSOS ─────────────────────────────────────────────────────────────
  describe('triggerSOS()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('should return 400 when lat/lng is missing', async () => {
      const req = makeReq({ body: { type: 'medical', description: 'No GPS' } });
      const res = makeRes();

      await expect(triggerSOS(req, res)).rejects.toThrow('GPS coordinates (lat, lng) are required');
    });

    test('should create EmergencyIncident and return 201 on success', async () => {
      const userId = makeId();
      const incidentDoc = {
        _id: makeId(),
        triggeredBy: userId,
        location: { lat: 28.6, lng: 77.2 },
        status: 'active',
        severity: 'high',
        notifiedUsers: [],
        createdAt: new Date(),
      };

      Hospital.findOne           = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(null)),
      });
      User.findById              = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      EmergencyIncident.create   = jest.fn().mockResolvedValue(incidentDoc);

      const req = makeReq({
        user: { _id: userId, role: 'user' },
        body: { lat: 28.6, lng: 77.2, address: 'Test', type: 'medical', severity: 'high', description: 'Help' },
      });
      const res = makeRes();

      await triggerSOS(req, res);

      expect(EmergencyIncident.create).toHaveBeenCalledTimes(1);
      const createArg = EmergencyIncident.create.mock.calls[0][0];
      expect(createArg.location.lat).toBe(28.6);
      expect(createArg.location.lng).toBe(77.2);
      expect(createArg.status).toBe('active');
    });

    test('should emit sos_alert to admin_room via socket', async () => {
      const userId = makeId();
      EmergencyIncident.create = jest.fn().mockResolvedValue({
        _id: makeId(), triggeredBy: userId, location: {}, status: 'active',
        notifiedUsers: [], createdAt: new Date(),
      });
      Hospital.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(null)),
      });
      User.findById    = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const toSpy   = jest.fn(() => ({ emit: jest.fn() }));
      const emitSpy = jest.fn();
      const req = makeReq({
        user: { _id: userId, role: 'user' },
        body: { lat: 19.0, lng: 72.8, type: 'medical', severity: 'high', description: 'Test' },
        io: { emit: emitSpy, to: toSpy },
      });
      const res = makeRes();

      await triggerSOS(req, res);

      // admin_room should receive sos_alert
      expect(toSpy).toHaveBeenCalledWith('admin_room');
    });

    test('should emit sos_alert to hospital room if nearest hospital found', async () => {
      const hospitalDoc = { _id: makeId(), hospitalName: 'Test Hospital', emergencyContact: '9999' };
      Hospital.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(hospitalDoc)),
      });
      User.findById     = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      EmergencyIncident.create = jest.fn().mockResolvedValue({
        _id: makeId(), triggeredBy: makeId(), notifiedUsers: [], location: {}, createdAt: new Date(),
      });

      const toSpy = jest.fn(() => ({ emit: jest.fn() }));
      const req   = makeReq({
        user: { _id: makeId(), role: 'user' },
        body: { lat: 28.6, lng: 77.2, type: 'medical', severity: 'high', description: 'Test' },
        io: { emit: jest.fn(), to: toSpy },
      });
      const res = makeRes();

      await triggerSOS(req, res);

      expect(toSpy).toHaveBeenCalledWith(`hospital_${hospitalDoc._id}`);
    });
  });

  // ─── updateLocation ──────────────────────────────────────────────────────────
  describe('updateLocation()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('should return 400 when lat/lng missing', async () => {
      const req = makeReq({ body: {}, params: { id: makeId().toString() } });
      const res = makeRes();

      await expect(updateLocation(req, res)).rejects.toThrow('lat and lng are required');
    });

    test('should return 404 if incident not found', async () => {
      EmergencyIncident.findById = jest.fn().mockResolvedValue(null);

      const req = makeReq({
        body: { lat: 28.6, lng: 77.2 },
        params: { id: makeId().toString() },
      });
      const res = makeRes();

      await expect(updateLocation(req, res)).rejects.toThrow('Emergency incident not found');
    });

    test('should return 403 if updater is not the SOS initiator', async () => {
      const initiatorId = makeId();
      const otherUserId = makeId();
      const incident = {
        _id: makeId(), triggeredBy: initiatorId, location: {}, locationHistory: [], notifiedUsers: [],
        save: jest.fn(),
      };

      EmergencyIncident.findById = jest.fn().mockResolvedValue(incident);

      const req = makeReq({
        user: { _id: otherUserId, role: 'user' },
        body: { lat: 28.6, lng: 77.2 },
        params: { id: incident._id.toString() },
      });
      const res = makeRes();

      await expect(updateLocation(req, res)).rejects.toThrow('Only the SOS initiator can update location');
    });

    test('should update location and append to locationHistory', async () => {
      const userId = makeId();
      const incident = {
        _id: makeId(), triggeredBy: userId, location: {}, locationHistory: [], notifiedUsers: [],
        save: jest.fn().mockResolvedValue({}),
      };

      EmergencyIncident.findById = jest.fn().mockResolvedValue(incident);

      const req = makeReq({
        user: { _id: userId, role: 'user' },
        body: { lat: 28.7, lng: 77.1, address: 'New location' },
        params: { id: incident._id.toString() },
        io: { emit: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) },
      });
      const res = makeRes();

      await updateLocation(req, res);

      expect(incident.location.lat).toBe(28.7);
      expect(incident.locationHistory.length).toBe(1);
      expect(incident.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── acknowledgeSOS ──────────────────────────────────────────────────────────
  describe('acknowledgeSOS()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('should return 400 if status is not active', async () => {
      EmergencyIncident.findById = jest.fn().mockResolvedValue({
        _id: makeId(), status: 'acknowledged', save: jest.fn(),
      });

      const req = makeReq({ params: { id: makeId().toString() } });
      const res = makeRes();

      await expect(acknowledgeSOS(req, res)).rejects.toThrow("Cannot acknowledge");
    });

    test('should set status to acknowledged and set respondedBy', async () => {
      const adminId = makeId();
      const incident = {
        _id: makeId(), triggeredBy: makeId(), status: 'active',
        save: jest.fn().mockResolvedValue({}),
      };

      EmergencyIncident.findById = jest.fn().mockResolvedValue(incident);

      const req = makeReq({
        user: { _id: adminId, role: 'admin' },
        params: { id: incident._id.toString() },
        io: { to: jest.fn(() => ({ emit: jest.fn() })) },
      });
      const res = makeRes();

      await acknowledgeSOS(req, res);

      expect(incident.status).toBe('acknowledged');
      expect(incident.respondedBy.toString()).toBe(adminId.toString());
      expect(incident.respondedAt).toBeInstanceOf(Date);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── markResponding ──────────────────────────────────────────────────────────
  describe('markResponding()', () => {

    test('should set status to responding', async () => {
      const incident = {
        _id: makeId(), triggeredBy: makeId(), status: 'acknowledged',
        respondedBy: null, respondedAt: null,
        save: jest.fn().mockResolvedValue({}),
      };
      EmergencyIncident.findById = jest.fn().mockResolvedValue(incident);

      const req = makeReq({ params: { id: incident._id.toString() },
        io: { to: jest.fn(() => ({ emit: jest.fn() })) } });
      const res = makeRes();

      await markResponding(req, res);

      expect(incident.status).toBe('responding');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ─── resolveSOS ──────────────────────────────────────────────────────────────
  describe('resolveSOS()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('should set status to resolved and save resolutionNote', async () => {
      const incident = {
        _id: makeId(), triggeredBy: makeId(), status: 'responding', notifiedUsers: [],
        save: jest.fn().mockResolvedValue({}),
      };
      EmergencyIncident.findById = jest.fn().mockResolvedValue(incident);

      const req = makeReq({
        body: { isFalseAlarm: false, resolutionNote: 'All clear' },
        params: { id: incident._id.toString() },
        io: { to: jest.fn(() => ({ emit: jest.fn() })), emit: jest.fn() },
      });
      const res = makeRes();

      await resolveSOS(req, res);

      expect(incident.status).toBe('resolved');
      expect(incident.resolutionNote).toBe('All clear');
      expect(incident.resolvedAt).toBeInstanceOf(Date);
    });

    test('should set status to false_alarm when isFalseAlarm=true', async () => {
      const incident = {
        _id: makeId(), triggeredBy: makeId(), status: 'active', notifiedUsers: [],
        save: jest.fn().mockResolvedValue({}),
      };
      EmergencyIncident.findById = jest.fn().mockResolvedValue(incident);

      const req = makeReq({
        body: { isFalseAlarm: true, resolutionNote: 'False alarm confirmed' },
        params: { id: incident._id.toString() },
        io: { to: jest.fn(() => ({ emit: jest.fn() })), emit: jest.fn() },
      });
      const res = makeRes();

      await resolveSOS(req, res);

      expect(incident.status).toBe('false_alarm');
    });
  });

  // ─── getMyIncidents ──────────────────────────────────────────────────────────
  describe('getMyIncidents()', () => {

    test('should filter by triggeredBy = req.user._id', async () => {
      const userId = makeId();
      paginate.mockResolvedValue({ docs: [], pagination: { total: 0, page: 1, limit: 10 } });

      const req = makeReq({ user: { _id: userId, role: 'user' }, query: {} });
      const res = makeRes();

      await getMyIncidents(req, res);

      const filterArg = paginate.mock.calls[0][1];
      expect(filterArg.triggeredBy.toString()).toBe(userId.toString());
    });
  });

  // ─── getAllIncidents ─────────────────────────────────────────────────────────
  describe('getAllIncidents()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('Admin sees all — no filter', async () => {
      paginate.mockResolvedValue({ docs: [], pagination: {} });

      const req = makeReq({ user: { _id: makeId(), role: 'admin' }, query: {} });
      const res = makeRes();

      await getAllIncidents(req, res);

      const filterArg = paginate.mock.calls[0][1];
      expect(Object.keys(filterArg)).toHaveLength(0);
    });

    test('Hospital sees only its incidents — notifiedHospital filter', async () => {
      const hospitalDoc = { _id: makeId() };
      Hospital.findOne  = jest.fn().mockResolvedValue(hospitalDoc);
      paginate.mockResolvedValue({ docs: [], pagination: {} });

      const req = makeReq({ user: { _id: makeId(), role: 'hospital' }, query: {} });
      const res = makeRes();

      await getAllIncidents(req, res);

      const filterArg = paginate.mock.calls[0][1];
      expect(filterArg.notifiedHospital.toString()).toBe(hospitalDoc._id.toString());
    });
  });

  // ─── getIncidentById ─────────────────────────────────────────────────────────
  describe('getIncidentById()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('Admin can access any incident', async () => {
      const adminId = makeId();
      const incident = {
        _id: makeId(), triggeredBy: { _id: makeId() }, notifiedUsers: [],
      };

      const mockQ = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(incident)),
      };
      EmergencyIncident.findById = jest.fn().mockReturnValue(mockQ);

      const req = makeReq({ user: { _id: adminId, role: 'admin' }, params: { id: incident._id.toString() } });
      const res = makeRes();

      await getIncidentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Non-involved user gets 403', async () => {
      const userId   = makeId();
      const incident = {
        _id: makeId(), triggeredBy: { _id: makeId() }, notifiedUsers: [makeId()],
      };

      const mockQ = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(incident)),
      };
      EmergencyIncident.findById = jest.fn().mockReturnValue(mockQ);

      const req = makeReq({ user: { _id: userId, role: 'user' }, params: { id: incident._id.toString() } });
      const res = makeRes();

      await expect(getIncidentById(req, res)).rejects.toThrow('Access denied to this incident');
    });

    test('SOS initiator can access their own incident', async () => {
      const userId   = makeId();
      const incident = { _id: makeId(), triggeredBy: { _id: userId }, notifiedUsers: [] };

      const mockQ = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(incident)),
      };
      EmergencyIncident.findById = jest.fn().mockReturnValue(mockQ);

      const req = makeReq({ user: { _id: userId, role: 'user' }, params: { id: incident._id.toString() } });
      const res = makeRes();

      await getIncidentById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
