const express = require('express');
const router = express.Router();
const { getStats, getUsers, updateUser, deleteUser, getAllJobs, getFreelancers, getAuditLogs, getPublicStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/freelancers', getFreelancers);
router.get('/public-stats', getPublicStats);
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/jobs', getAllJobs);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
