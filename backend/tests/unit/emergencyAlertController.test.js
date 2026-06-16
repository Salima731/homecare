/**
 * tests/unit/emergencyAlertController.test.js
 * ─────────────────────────────────────────────
 * Unit tests for emergencyAlertController.js
 * All Mongoose operations and services are mocked — no DB connection needed.
 *
 * Run: npx jest tests/unit/emergencyAlertController.test.js
 */

// ─── Setup ────────────────────────────────────────────────────────────────────
jest.mock('../../models/EmergencyAlert');
jest.mock('../../models/Booking');
jest.mock('../../models/Patient');
jest.mock('../../models/Caregiver');
jest.mock('../../models/User');
jest.mock('../../models/Hospital');
jest.mock('../../models/Agency');
jest.mock('../../utils/asyncHandler', () => (fn) => fn);
jest.mock('../../services/notificationService', () => ({
  notifications: {},
  notifyMany: jest.fn().mockResolvedValue([]),
}));

const mongoose = require('mongoose');
const EmergencyAlert = require('../../models/EmergencyAlert');
const Booking        = require('../../models/Booking');
const Patient        = require('../../models/Patient');
const Caregiver      = require('../../models/Caregiver');
const User           = require('../../models/User');
const Hospital       = require('../../models/Hospital');
const { notifyMany } = require('../../services/notificationService');

const {
  raiseAlert,
  getAlerts,
  getAlertById,
  updateAlertStatus,
} = require('../../controllers/emergencyAlertController');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeId = () => new mongoose.Types.ObjectId();

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  user:   { _id: makeId(), role: 'caregiver' },
  body:   {},
  query:  {},
  params: {},
  io:     { emit: jest.fn(), to: jest.fn(() => ({ emit: jest.fn() })) },
  ...overrides,
});

const next = jest.fn();

// ─── Test Suite ───────────────────────────────────────────────────────────────
describe('Unit — emergencyAlertController', () => {

  // ─── raiseAlert ─────────────────────────────────────────────────────────────
  describe('raiseAlert()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('should return 403 if caller is not a caregiver', async () => {
      const req = makeReq({ user: { _id: makeId(), role: 'user' }, body: { bookingId: makeId() } });
      const res = makeRes();

      await expect(raiseAlert(req, res, next)).rejects.toThrow('Only caregivers can raise emergency alerts');
    });

    test('should return 404 if caregiver profile not found', async () => {
      const req = makeReq({ user: { _id: makeId(), role: 'caregiver' }, body: { bookingId: makeId() } });
      const res = makeRes();

      Caregiver.findOne = jest.fn().mockResolvedValue(null);

      await expect(raiseAlert(req, res, next)).rejects.toThrow('Caregiver profile not found');
    });

    test('should return 404 if booking not found', async () => {
      const userId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };
      Caregiver.findOne = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById  = jest.fn().mockResolvedValue(null);

      const req = makeReq({ user: { _id: userId, role: 'caregiver' }, body: { bookingId: makeId() } });
      const res = makeRes();

      await expect(raiseAlert(req, res, next)).rejects.toThrow('Booking not found');
    });

    test('should return 403 if booking belongs to a different caregiver', async () => {
      const userId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };
      const differentCaregiverId = makeId();

      Caregiver.findOne = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById  = jest.fn().mockResolvedValue({
        _id: makeId(),
        caregiver: differentCaregiverId,
        status: 'ongoing',
        user: makeId(),
        agency: makeId(),
      });

      const req = makeReq({ user: { _id: userId, role: 'caregiver' }, body: { bookingId: makeId() } });
      const res = makeRes();

      await expect(raiseAlert(req, res, next)).rejects.toThrow('Not authorized to raise alerts for this booking');
    });

    test('should return 400 if booking is not in ongoing status', async () => {
      const userId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };

      Caregiver.findOne = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById  = jest.fn().mockResolvedValue({
        _id: makeId(),
        caregiver: caregiverDoc._id,
        status: 'pending',
        user: makeId(),
        agency: makeId(),
      });

      const req = makeReq({ user: { _id: userId, role: 'caregiver' }, body: { bookingId: makeId() } });
      const res = makeRes();

      await expect(raiseAlert(req, res, next)).rejects.toThrow('Emergency alerts can only be raised for ongoing bookings');
    });

    test('should return 404 if patient record not found', async () => {
      const userId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };
      const booking = { _id: makeId(), caregiver: caregiverDoc._id, status: 'ongoing', user: makeId(), agency: makeId() };

      Caregiver.findOne = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById  = jest.fn().mockResolvedValue(booking);
      Patient.findOne   = jest.fn().mockResolvedValue(null);

      const req = makeReq({ user: { _id: userId, role: 'caregiver' }, body: { bookingId: booking._id } });
      const res = makeRes();

      await expect(raiseAlert(req, res, next)).rejects.toThrow('Patient not found');
    });

    test('should create alert and return 201 on success', async () => {
      const userId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };
      const patientDoc   = { _id: makeId(), user: makeId(), assignedHospital: null, familyMembers: [] };
      const booking      = { _id: makeId(), caregiver: caregiverDoc._id, status: 'ongoing', user: patientDoc.user, agency: makeId() };
      const createdAlert = { _id: makeId(), status: 'Open', ...booking };

      Caregiver.findOne     = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById      = jest.fn().mockResolvedValue(booking);
      Patient.findOne       = jest.fn().mockResolvedValue(patientDoc);
      User.find             = jest.fn().mockResolvedValue([]);
      EmergencyAlert.create = jest.fn().mockResolvedValue(createdAlert);

      const req = makeReq({
        user: { _id: userId, role: 'caregiver' },
        body: {
          bookingId:     booking._id.toString(),
          alertType:     'Medical Emergency',
          severityLevel: 'Critical',
          description:   'Patient is unresponsive',
        },
      });
      const res = makeRes();

      await raiseAlert(req, res, next);

      expect(EmergencyAlert.create).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('should link hospitalId if patient has assignedHospital', async () => {
      const userId = makeId();
      const hospitalId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };
      const patientDoc   = { _id: makeId(), user: makeId(), assignedHospital: hospitalId, familyMembers: [] };
      const booking      = { _id: makeId(), caregiver: caregiverDoc._id, status: 'ongoing', user: patientDoc.user, agency: makeId() };

      Caregiver.findOne     = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById      = jest.fn().mockResolvedValue(booking);
      Patient.findOne       = jest.fn().mockResolvedValue(patientDoc);
      User.find             = jest.fn().mockResolvedValue([]);
      EmergencyAlert.create = jest.fn().mockResolvedValue({ _id: makeId() });

      const req = makeReq({
        user: { _id: userId, role: 'caregiver' },
        body: { bookingId: booking._id.toString(), alertType: 'Fall Incident', severityLevel: 'High', description: 'Test' },
      });
      const res = makeRes();

      await raiseAlert(req, res, next);

      const createArg = EmergencyAlert.create.mock.calls[0][0];
      expect(createArg.hospitalId?.toString()).toBe(hospitalId.toString());
    });

    test('should emit sos alert socket event on creation', async () => {
      const userId = makeId();
      const caregiverDoc = { _id: makeId(), user: userId };
      const patientDoc   = { _id: makeId(), user: makeId(), assignedHospital: null, familyMembers: [] };
      const booking      = { _id: makeId(), caregiver: caregiverDoc._id, status: 'ongoing', user: patientDoc.user, agency: makeId() };
      const createdAlert = { _id: makeId() };

      Caregiver.findOne     = jest.fn().mockResolvedValue(caregiverDoc);
      Booking.findById      = jest.fn().mockResolvedValue(booking);
      Patient.findOne       = jest.fn().mockResolvedValue(patientDoc);
      User.find             = jest.fn().mockResolvedValue([{ _id: makeId() }]);
      EmergencyAlert.create = jest.fn().mockResolvedValue(createdAlert);

      const emitSpy = jest.fn();
      const req = makeReq({
        user: { _id: userId, role: 'caregiver' },
        body: { bookingId: booking._id.toString(), alertType: 'Injury', severityLevel: 'Critical', description: 'Test' },
        io: { emit: emitSpy, to: jest.fn(() => ({ emit: jest.fn() })) },
      });
      const res = makeRes();

      await raiseAlert(req, res, next);

      expect(emitSpy).toHaveBeenCalledWith('emergency_alert', expect.objectContaining({
        alertId: createdAlert._id,
        severityLevel: 'Critical',
      }));
    });
  });

  // ─── getAlerts ───────────────────────────────────────────────────────────────
  describe('getAlerts()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('Admin sees all alerts — no filter applied', async () => {
      const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
      EmergencyAlert.find = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'admin' }, query: {} });
      const res = makeRes();

      await getAlerts(req, res, next);

      const filterArg = EmergencyAlert.find.mock.calls[0][0];
      expect(filterArg).toEqual({});
    });

    test('Caregiver filter applied — caregiverId', async () => {
      const caregiverDoc = { _id: makeId() };
      Caregiver.findOne = jest.fn().mockResolvedValue(caregiverDoc);
      const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
      EmergencyAlert.find = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'caregiver' }, query: {} });
      const res = makeRes();

      await getAlerts(req, res, next);

      const filterArg = EmergencyAlert.find.mock.calls[0][0];
      expect(filterArg.caregiverId.toString()).toBe(caregiverDoc._id.toString());
    });

    test('Agency filter applied — agencyId', async () => {
      const agencyDoc = { _id: makeId() };
      const Agency = require('../../models/Agency');
      Agency.findOne = jest.fn().mockResolvedValue(agencyDoc);
      const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
      EmergencyAlert.find = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'agency' }, query: {} });
      const res = makeRes();

      await getAlerts(req, res, next);

      const filterArg = EmergencyAlert.find.mock.calls[0][0];
      expect(filterArg.agencyId.toString()).toBe(agencyDoc._id.toString());
    });

    test('Hospital filter applied — hospitalId', async () => {
      const hospitalDoc = { _id: makeId() };
      Hospital.findOne = jest.fn().mockResolvedValue(hospitalDoc);
      const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
      EmergencyAlert.find = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'hospital' }, query: {} });
      const res = makeRes();

      await getAlerts(req, res, next);

      const filterArg = EmergencyAlert.find.mock.calls[0][0];
      expect(filterArg.hospitalId.toString()).toBe(hospitalDoc._id.toString());
    });

    test('User/family filter — patientId in their patients', async () => {
      const patientDoc = { _id: makeId() };
      Patient.find = jest.fn().mockResolvedValue([patientDoc]);
      const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
      EmergencyAlert.find = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'user' }, query: {} });
      const res = makeRes();

      await getAlerts(req, res, next);

      const filterArg = EmergencyAlert.find.mock.calls[0][0];
      expect(filterArg.patientId.$in).toContainEqual(patientDoc._id);
    });

    test('Unknown role returns 403', async () => {
      const req = makeReq({ user: { _id: makeId(), role: 'driver' }, query: {} });
      const res = makeRes();

      await expect(getAlerts(req, res, next)).rejects.toThrow('Not authorized to view emergency alerts');
    });

    test('Date range filter is applied when startDate and endDate provided', async () => {
      const mockQuery = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([]) };
      EmergencyAlert.find = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({
        user: { _id: makeId(), role: 'admin' },
        query: { startDate: '2025-01-01', endDate: '2025-12-31' },
      });
      const res = makeRes();

      await getAlerts(req, res, next);

      const filterArg = EmergencyAlert.find.mock.calls[0][0];
      expect(filterArg.createdAt).toBeDefined();
      expect(filterArg.createdAt.$gte).toEqual(new Date('2025-01-01'));
    });
  });

  // ─── updateAlertStatus ───────────────────────────────────────────────────────
  describe('updateAlertStatus()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('Non-agency/admin role returns 403', async () => {
      const req = makeReq({ user: { _id: makeId(), role: 'caregiver' }, body: { status: 'Resolved' }, params: { id: makeId().toString() } });
      const res = makeRes();

      await expect(updateAlertStatus(req, res, next)).rejects.toThrow('Only agencies and admins can update emergency alert statuses');
    });

    test('Admin can resolve any alert and sets resolvedAt/resolvedBy', async () => {
      const alertId  = makeId();
      const adminId  = makeId();
      const saveMock = jest.fn().mockResolvedValue({});
      const alert    = {
        _id: alertId, status: 'Open', agencyId: makeId(), responseNotes: [],
        save: saveMock,
      };

      EmergencyAlert.findById = jest.fn().mockResolvedValue(alert);
      Caregiver.findById      = jest.fn().mockResolvedValue(null);
      Patient.findById        = jest.fn().mockResolvedValue(null);

      const req = makeReq({
        user:   { _id: adminId, role: 'admin' },
        body:   { status: 'Resolved', note: 'Resolved by admin' },
        params: { id: alertId.toString() },
      });
      const res = makeRes();

      await updateAlertStatus(req, res, next);

      expect(alert.status).toBe('Resolved');
      expect(alert.resolvedAt).toBeInstanceOf(Date);
      expect(alert.resolvedBy.toString()).toBe(adminId.toString());
      expect(alert.responseNotes.length).toBe(1);
      expect(saveMock).toHaveBeenCalled();
    });

    test('Agency can only update its own agency alerts', async () => {
      const agencyDoc = { _id: makeId() };
      const alert     = { _id: makeId(), agencyId: makeId(), status: 'Open', responseNotes: [], save: jest.fn() };

      const Agency = require('../../models/Agency');
      Agency.findOne      = jest.fn().mockResolvedValue(agencyDoc);
      EmergencyAlert.findById = jest.fn().mockResolvedValue(alert);

      const req = makeReq({
        user:   { _id: makeId(), role: 'agency' },
        body:   { status: 'In Progress' },
        params: { id: alert._id.toString() },
      });
      const res = makeRes();

      await expect(updateAlertStatus(req, res, next)).rejects.toThrow('Not authorized to update this alert');
    });

    test('Response note is appended with addedBy and role', async () => {
      const adminId = makeId();
      const alert   = { _id: makeId(), status: 'Open', agencyId: makeId(), responseNotes: [], save: jest.fn() };

      EmergencyAlert.findById = jest.fn().mockResolvedValue(alert);
      Caregiver.findById      = jest.fn().mockResolvedValue(null);
      Patient.findById        = jest.fn().mockResolvedValue(null);

      const req = makeReq({
        user:   { _id: adminId, role: 'admin' },
        body:   { note: 'Investigating now' },
        params: { id: alert._id.toString() },
      });
      const res = makeRes();

      await updateAlertStatus(req, res, next);

      expect(alert.responseNotes[0].note).toBe('Investigating now');
      expect(alert.responseNotes[0].addedBy.toString()).toBe(adminId.toString());
      expect(alert.responseNotes[0].role).toBe('admin');
    });
  });

  // ─── getAlertById ────────────────────────────────────────────────────────────
  describe('getAlertById()', () => {

    beforeEach(() => jest.clearAllMocks());

    test('Returns 404 if alert not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(null)),
      };
      EmergencyAlert.findById = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'admin' }, params: { id: makeId().toString() } });
      const res = makeRes();

      await expect(getAlertById(req, res, next)).rejects.toThrow('Emergency alert not found');
    });

    test('Admin can access any alert', async () => {
      const alert = { _id: makeId(), caregiverId: { _id: makeId() }, agencyId: { _id: makeId() }, patientId: { _id: makeId() } };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(alert)),
      };
      EmergencyAlert.findById = jest.fn().mockReturnValue(mockQuery);

      const req = makeReq({ user: { _id: makeId(), role: 'admin' }, params: { id: alert._id.toString() } });
      const res = makeRes();

      await getAlertById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: alert }));
    });

    test('Caregiver cannot view another caregivers alert — 403', async () => {
      const foreignCaregiverId = makeId();
      const alert = { _id: makeId(), caregiverId: { _id: foreignCaregiverId }, agencyId: { _id: makeId() }, patientId: { _id: makeId() } };
      const myCaregiver = { _id: makeId() };

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(alert)),
      };
      EmergencyAlert.findById = jest.fn().mockReturnValue(mockQuery);
      Caregiver.findOne = jest.fn().mockResolvedValue(myCaregiver);

      const req = makeReq({ user: { _id: makeId(), role: 'caregiver' }, params: { id: alert._id.toString() } });
      const res = makeRes();

      await expect(getAlertById(req, res, next)).rejects.toThrow('Not authorized to view this alert');
    });
  });
});
