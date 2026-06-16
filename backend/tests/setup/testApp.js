/**
 * tests/setup/testApp.js
 * ----------------------
 * Creates a stripped-down Express app identical to server.js
 * but without real Socket.io (replaced with a mock io object).
 * Used by Supertest integration tests.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express        = require('express');
const cookieParser   = require('cookie-parser');
const cors           = require('cors');

// Routes
const emergencyAlertRoutes = require('../../routes/emergencyAlertRoutes');
const emergencyRoutes      = require('../../routes/emergencyRoutes');

const { notFound, errorHandler } = require('../../middleware/errorMiddleware');

/**
 * Build a testable Express app.
 * @param {Object} mockIo - Optional mock Socket.io object (records emits)
 */
const buildTestApp = (mockIo = null) => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: '*', credentials: true }));

  // Attach mock io to every request
  app.use((req, _res, next) => {
    req.io = mockIo || createMockIo();
    next();
  });

  app.use('/api/emergency-alerts', emergencyAlertRoutes);
  app.use('/api/emergency',        emergencyRoutes);

  // Health check
  app.get('/api/health', (_req, res) => res.json({ success: true }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

/**
 * Creates a jest-spy mock of Socket.io's server object.
 * Captures all emit() calls for assertion.
 */
const createMockIo = () => {
  const io = {
    emit: jest.fn((event, data) => {
      if (!io._emitted['broadcast']) io._emitted['broadcast'] = [];
      io._emitted['broadcast'].push({ event, data });
    }),
    to: jest.fn((room) => ({
      emit: jest.fn((event, data) => {
        if (!io._emitted[room]) io._emitted[room] = [];
        io._emitted[room].push({ event, data });
      }),
    })),
    _emitted: {},
  };

  return io;
};

module.exports = { buildTestApp, createMockIo };
