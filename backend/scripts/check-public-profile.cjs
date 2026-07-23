require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const Review = require('../models/Review');

(async () => {
  await connectDB();
  const user = await User.findOne({ name: 'sri' }).select('-password -refreshToken').lean();
  const profile = await FreelancerProfile.findOne({ user: user._id }).populate('user', 'name avatar location role').lean();
  const reviews = await Review.find({ reviewee: user._id, isPublic: true }).populate('reviewer', 'name avatar').sort({ createdAt: -1 }).lean();
  const payload = { success: true, profile: profile ? { ...profile, reviews, user: profile.user || user } : { user, reviews } };
  console.log(JSON.stringify({ userId: user._id.toString(), portfolioLength: payload.profile.portfolio?.length || 0, portfolio: payload.profile.portfolio || [] }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
