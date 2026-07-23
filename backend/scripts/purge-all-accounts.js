const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Review = require('../models/Review');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

(async () => {
  try {
    const state = await connectDB();
    console.log('Connected to MongoDB:', state?.uri || 'unknown');

    const collections = [
      { name: 'users', model: User },
      { name: 'freelancerProfiles', model: FreelancerProfile },
      { name: 'clientProfiles', model: ClientProfile },
      { name: 'jobs', model: Job },
      { name: 'applications', model: Application },
      { name: 'reviews', model: Review },
      { name: 'messages', model: Message },
      { name: 'notifications', model: Notification },
      { name: 'auditLogs', model: AuditLog },
    ];

    for (const item of collections) {
      const count = await item.model.countDocuments();
      console.log(`${item.name}: ${count} before deletion`);
    }

    console.log('Deleting all user-related data...');
    for (const item of collections) {
      await item.model.deleteMany({});
      const countAfter = await item.model.countDocuments();
      console.log(`${item.name}: ${countAfter} after deletion`);
    }

    await mongoose.connection.close();
    console.log('Deletion complete and connection closed.');
  } catch (error) {
    console.error('Purge failed:', error);
    process.exit(1);
  }
})();
