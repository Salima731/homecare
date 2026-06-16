const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── All collection names that ARE backed by a Mongoose model ──────────────────
const MODEL_COLLECTIONS = new Set([
  'agencies',
  'appointments',
  'attendancerecords',
  'bookings',
  'carereports',
  'caregivers',
  'complaints',
  'departments',
  'doctors',
  'emergencyalerts',
  'emergencyincidents',
  'familymembers',
  'healthlogs',
  'healthprofiles',
  'hospitals',
  'medicalrecords',
  'medicationlogs',
  'messages',
  'notifications',
  'otps',
  'patients',
  'patientreferrals',
  'payments',
  'prescriptions',
  'recommendationcaches',
  'reviews',
  'schedules',
  'settings',
  'trustscores',
  'users',
]);

const DROP = process.argv.includes('--drop');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const allCollections = await db.listCollections().toArray();
  const allNames = allCollections.map((c) => c.name);

  const orphaned = allNames.filter((name) => !MODEL_COLLECTIONS.has(name));
  const valid = allNames.filter((name) => MODEL_COLLECTIONS.has(name));

  console.log('\n✅ VALID collections (' + valid.length + '):');
  valid.forEach((n) => console.log('   ', n));

  console.log('\n🗑️  ORPHANED collections (' + orphaned.length + '):');
  orphaned.forEach((n) => console.log('   ', n));

  if (orphaned.length === 0) {
    console.log('\n🎉 No orphaned collections found!');
  } else if (DROP) {
    console.log('\n🔥 Dropping orphaned collections...');
    for (const name of orphaned) {
      await db.dropCollection(name);
      console.log('   ❌ Dropped:', name);
    }
    console.log('\n✅ Done! All orphaned collections removed.');
  } else {
    console.log('\n⚠️  Run with --drop flag to delete them:');
    console.log('   node scripts/cleanCollections.js --drop\n');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
