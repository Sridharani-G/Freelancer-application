const express = require('express');
const router = express.Router();
const { createReview, getUserReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('client'), createReview);
router.get('/user/:userId', getUserReviews);

module.exports = router;
