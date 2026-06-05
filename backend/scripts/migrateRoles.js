const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // Find all users missing new notification settings and update them
    console.log('Updating user notification settings...');
    const result = await User.updateMany(
      { 'notificationSettings.healthAlerts': { $exists: false } },
      {
        $set: {
          'notificationSettings.healthAlerts': true,
          'notificationSettings.emergencyAlerts': true,
          'notificationSettings.medicationReminders': true,
        },
      }
    );
    console.log(`Updated ${result.modifiedCount} users.`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
