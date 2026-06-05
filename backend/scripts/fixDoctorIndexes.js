const mongoose = require('mongoose');
require('dotenv').config();

const fixDoctorIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load Doctor model so Mongoose registers the updated schema
    const Doctor = require('../models/Doctor');

    const collection = Doctor.collection;

    // List existing indexes for diagnostics
    const existingIndexes = await collection.indexes();
    console.log('\n📋 Existing indexes on doctors collection:');
    existingIndexes.forEach(idx => console.log(' -', JSON.stringify(idx)));

    // ── 1. Drop old non-sparse licenseNumber index ──────────────────────────
    try {
      await collection.dropIndex('licenseNumber_1');
      console.log('\n🗑  Dropped old licenseNumber_1 index');
    } catch (err) {
      console.log('\nℹ️  licenseNumber_1 index not found or already dropped:', err.message);
    }

    // ── 2. Drop old non-sparse user index (if it exists as non-sparse) ──────
    try {
      await collection.dropIndex('user_1');
      console.log('🗑  Dropped old user_1 index');
    } catch (err) {
      console.log('ℹ️  user_1 index not found or already dropped:', err.message);
    }

    // ── 3. Rebuild all indexes from the current schema (both now sparse) ─────
    await Doctor.syncIndexes();
    console.log('✅ Doctor indexes synced — licenseNumber and user are now sparse unique');

    // Show the final state
    const newIndexes = await collection.indexes();
    console.log('\n📋 Updated indexes on doctors collection:');
    newIndexes.forEach(idx => console.log(' -', JSON.stringify(idx)));

    process.exit(0);
  } catch (err) {
    console.error('🔥 Error fixing Doctor indexes:', err);
    process.exit(1);
  }
};

fixDoctorIndexes();
