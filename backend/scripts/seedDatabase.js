const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Agency = require('../models/Agency');
const Caregiver = require('../models/Caregiver');
const TrustScore = require('../models/TrustScore');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clean existing seed data
    const emails = ['agency@example.com', 'sarah@example.com', 'michael@example.com', 'elena@example.com'];
    const users = await User.find({ email: { $in: emails } });
    const userIds = users.map(u => u._id);
    
    await Caregiver.deleteMany({ user: { $in: userIds } });
    await TrustScore.deleteMany({}); // Clear all trust scores for a fresh start
    await User.deleteMany({ email: { $in: emails } });
    await Agency.deleteMany({ $or: [{ email: 'contact@elitecare.com' }, { licenseNumber: 'LNC-2026-001' }] });
    console.log('Cleaned old seed data');
    const agencyPassword = await bcrypt.hash('password123', 12);
    const agencyUser = await User.create({
      name: 'Elite Care Agency',
      email: 'agency@example.com',
      password: 'password123', // Mongoose pre-save will hash this too, but we'll use a direct string to be safe if pre-save is bypassed
      role: 'agency',
      isEmailVerified: true
    });

    // 2. Create Agency Profile
    const agencyProfile = await Agency.create({
      user: agencyUser._id,
      agencyName: 'Elite Home Care Services',
      licenseNumber: 'LNC-2026-001',
      description: 'Providing premium home care and nursing services since 2010.',
      phone: '+1 234 567 8900',
      email: 'contact@elitecare.com',
      address: {
        street: '456 Healthcare Blvd',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      status: 'approved',
      rating: 4.9
    });

    // 3. Create Caregivers
    const caregivers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        serviceType: 'nurse',
        bio: 'Licensed Registered Nurse with 10 years of experience in geriatric care.',
        hourly: 35, daily: 250, weekly: 1500, monthly: 5500,
        specializations: ['Dementia Care', 'Wound Care', 'Post-Op Recovery']
      },
      {
        name: 'Michael Chen',
        email: 'michael@example.com',
        serviceType: 'elder_care',
        bio: 'Compassionate companion specializing in active aging and nutrition for seniors.',
        hourly: 25, daily: 180, weekly: 1100, monthly: 4000,
        specializations: ['Meal Prep', 'Physical Therapy Support', 'Medication Reminders']
      },
      {
        name: 'Elena Rodriguez',
        email: 'elena@example.com',
        serviceType: 'babysitter',
        bio: 'Certified childcare specialist with a background in early childhood education.',
        hourly: 20, daily: 150, weekly: 900, monthly: 3200,
        specializations: ['Infant Care', 'Tutoring', 'Creative Play']
      }
    ];

    for (const data of caregivers) {
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: 'password123',
        role: 'caregiver',
        isEmailVerified: true
      });

      const caregiver = await Caregiver.create({
        user: user._id,
        agency: agencyProfile._id,
        name: data.name,
        serviceType: data.serviceType,
        bio: data.bio,
        experience: 5 + Math.floor(Math.random() * 10),
        rates: {
          hourly: data.hourly,
          daily: data.daily,
          weekly: data.weekly,
          monthly: data.monthly
        },
        location: {
          city: 'New York',
          state: 'NY'
        },
        languages: ['English', 'Spanish'],
        specializations: data.specializations,
        isVerified: true,
        isActive: true,
        avgRating: 4.5 + Math.random() * 0.5
      });

      await TrustScore.create({
        caregiver: caregiver._id,
        score: 80 + Math.floor(Math.random() * 20),
        grade: 'A'
      });
    }

    console.log('Seeding completed successfully!');
    console.log('Agency Login: agency@example.com / password123');
    console.log('Caregiver Logins: sarah@example.com, michael@example.com, elena@example.com / password123');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
