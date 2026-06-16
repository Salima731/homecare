const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const targetId = new mongoose.Types.ObjectId('6a205d606306495ce46476e2');
  const targetStr = '6a205d606306495ce46476e2';

  console.log('Searching for references to:', targetStr);

  for (const col of collections) {
    if (col.name === 'patients') continue; // We know it exists here
    
    // Find documents where any field equals targetId or targetStr
    const docs = await db.collection(col.name).find({
      $or: [
        { patient: targetId },
        { patientId: targetId },
        { user: targetId },
        { patient: targetStr },
        { patientId: targetStr },
        { user: targetStr }
      ]
    }).toArray();

    if (docs.length > 0) {
      console.log(`🎉 Found ${docs.length} reference(s) in collection "${col.name}":`);
      docs.forEach(doc => {
        console.log(` - Document ID: ${doc._id}, Summary:`, JSON.stringify(doc).slice(0, 300));
      });
    }
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
