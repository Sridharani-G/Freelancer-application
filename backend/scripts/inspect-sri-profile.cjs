require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');

(async () => {
  await connectDB();
  const users = await User.find({
    $or: [
      { name: { $regex: 'sri', $options: 'i' } },
      { email: { $regex: 'sri', $options: 'i' } },
    ],
  }).select('_id name email role').lean();

  const results = [];
  for (const user of users) {
    const profile = await FreelancerProfile.findOne({ user: user._id }).lean();
    results.push({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      profile: profile ? {
        _id: profile._id,
        title: profile.title,
        bio: profile.bio,
        portfolioLength: profile.portfolio?.length || 0,
        portfolio: profile.portfolio || [],
      } : null,
    });
  }

  fs.writeFileSync(path.join(__dirname, 'inspect-sri-profile.json'), JSON.stringify(results, null, 2));
  console.log('wrote', path.join(__dirname, 'inspect-sri-profile.json'));
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
