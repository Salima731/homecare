const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('../models/Hospital');
const User = require('../models/User');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ role: 'hospital' });
    console.log('Hospital Users in database:', users.map(u => ({ id: u._id, email: u.email, name: u.name })));

    const hospitals = await Hospital.find({});
    console.log('Hospitals in database:', hospitals.map(h => ({ id: h._id, name: h.hospitalName, status: h.status, isVerified: h.isVerified, user: h.user })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
