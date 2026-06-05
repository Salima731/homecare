const mongoose = require('mongoose');
require('dotenv').config();

const Hospital = require('../models/Hospital');
const Department = require('../models/Department');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hospitals = await Hospital.find({});
    console.log('Hospitals in DB:', hospitals.map(h => ({ id: h._id, name: h.hospitalName })));

    const departments = await Department.find({});
    console.log('Departments in DB:', departments.map(d => ({
      id: d._id,
      name: d.name,
      code: d.code,
      hospital: d.hospital,
      isActive: d.isActive
    })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
