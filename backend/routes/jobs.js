const express = require('express');
const router = express.Router();
const {
    getJobs, getJob, createJob, updateJob, deleteJob, toggleSaveJob, getAIMatches, getMyJobs,
    updateProjectProgress, clientProjectAction,
} = require('../controllers/jobController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getJobs);
router.get('/my-jobs', protect, authorize('client'), getMyJobs);
router.put('/:id/progress', protect, authorize('freelancer'), updateProjectProgress);
router.put('/:id/client-action', protect, authorize('client'), clientProjectAction);
router.get('/:id', optionalAuth, getJob);
router.post('/', protect, authorize('client'), createJob);
router.put('/:id', protect, authorize('client'), updateJob);
router.delete('/:id', protect, authorize('client', 'admin'), deleteJob);
router.post('/:id/save', protect, toggleSaveJob);
router.get('/:id/ai-matches', protect, authorize('client', 'admin'), getAIMatches);

module.exports = router;
