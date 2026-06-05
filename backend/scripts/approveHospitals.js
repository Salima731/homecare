const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('../models/Hospital');
const User = require('../models/User');

const approveHospitals = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for syncing and approving hospitals...');

    // Find all users with role 'hospital'
    const hospitalUsers = await User.find({ role: 'hospital' });
    console.log(`Found ${hospitalUsers.length} hospital user(s) in User collection.`);

    let createdCount = 0;
    for (const user of hospitalUsers) {
      // Check if profile exists
      let profile = await Hospital.findOne({ user: user._id });
      if (!profile) {
        console.log(`No hospital profile for user: ${user.name}. Creating one...`);
        profile = await Hospital.create({
          user: user._id,
          hospitalName: user.name,
          registrationNumber: `REG-${user._id.toString().substring(0, 8).toUpperCase()}`,
          status: 'approved',
          isVerified: true
        });
        createdCount++;
      } else {
        profile.status = 'approved';
        profile.isVerified = true;
        await profile.save();
      }
    }

    // Double check all hospital profiles are updated
    const finalUpdate = await Hospital.updateMany(
      {},
      { $set: { status: 'approved', isVerified: true } }
    );

    console.log(`Successfully created ${createdCount} profile(s). Updated ${finalUpdate.modifiedCount} profile(s) to approved/verified status.`);
    process.exit(0);
  } catch (err) {
    console.error('Error approving hospitals:', err);
    process.exit(1);
  }
};

approveHospitals();
