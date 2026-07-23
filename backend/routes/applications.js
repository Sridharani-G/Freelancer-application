const express = require('express');
const router = express.Router();
const {
    applyJob, getJobApplications, getMyApplications, updateApplicationStatus, withdrawApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('freelancer'), applyJob);
router.get('/my', protect, authorize('freelancer'), getMyApplications);
router.get('/job/:jobId', protect, authorize('client', 'admin'), getJobApplications);
router.put('/:id/status', protect, authorize('client'), updateApplicationStatus);
router.delete('/:id', protect, authorize('freelancer'), withdrawApplication);

module.exports = router;
