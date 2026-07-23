const express = require('express');
const router = express.Router();
const {
    createDirectHireRequest,
    getDirectHireRequestsForFreelancer,
    getDirectHireRequestsForClient,
    updateDirectHireRequestStatus,
} = require('../controllers/directHireController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('client'), createDirectHireRequest);
router.get('/freelancer', protect, authorize('freelancer'), getDirectHireRequestsForFreelancer);
router.get('/client', protect, authorize('client'), getDirectHireRequestsForClient);
router.put('/:id/status', protect, authorize('client', 'freelancer'), updateDirectHireRequestStatus);

module.exports = router;
