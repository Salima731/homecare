const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const targetId = new mongoose.Types.ObjectId('6a205d606306495ce46476e2');

  console.log('Searching for target ID:', targetId);

  for (const col of collections) {
    const doc = await db.collection(col.name).findOne({ _id: targetId });
    if (doc) {
      console.log(`🎉 Found document in collection "${col.name}":`, JSON.stringify(doc, null, 2));
      await mongoose.disconnect();
      return;
    }
  }

  console.log('❌ ID not found in any collection.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
