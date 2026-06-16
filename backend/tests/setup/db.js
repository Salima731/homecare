/**
 * tests/setup/db.js
 * -----------------
 * MongoDB in-memory server setup for isolated test runs.
 * Uses @shelf/jest-mongodb or mongodb-memory-server.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

/**
 * Start an in-memory MongoDB instance and connect Mongoose.
 */
const connectTestDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

/**
 * Drop the entire database — call between tests to ensure isolation.
 */
const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Disconnect Mongoose and stop the in-memory server.
 */
const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

module.exports = { connectTestDB, clearTestDB, closeTestDB };
