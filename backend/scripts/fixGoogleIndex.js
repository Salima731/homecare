const mongoose = require('mongoose');
require('dotenv').config();

const fixIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Require the model file to register the schema
    const User = require('../models/User');
    
    // Drop the problematic index
    try {
      await User.collection.dropIndex('googleId_1');
      console.log('Successfully dropped old googleId index');
    } catch (err) {
      console.log('Index googleId_1 not found or already dropped');
    }
    
    // Re-sync indexes
    await User.syncIndexes();
    console.log('Indexes synced successfully with sparse property');
    
    process.exit(0);
  } catch (err) {
    console.error('Error fixing index:', err);
    process.exit(1);
  }
};

fixIndex();
