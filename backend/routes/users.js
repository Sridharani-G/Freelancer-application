const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getFreelancerProfileById, getUserById } = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/:id/freelancer-profile', optionalAuth, getFreelancerProfileById);
router.get('/:id', protect, getUserById);

module.exports = router;
