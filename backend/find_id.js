require("dotenv").config({ path: "./.env" });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Patient = require('./models/Patient');

const run = async () => {
  await connectDB();
  const id = '6a205d606306495ce46476e2';
  
  const user = await User.findById(id);
  console.log('USER:', user ? user.name : 'Not Found');
  
  const patient = await Patient.findById(id);
  console.log('PATIENT:', patient ? patient.name : 'Not Found');
  
  const patientByUser = await Patient.findOne({ user: id });
  console.log('PATIENT BY USER:', patientByUser ? patientByUser.name : 'Not Found');
  
  process.exit(0);
};

run();
