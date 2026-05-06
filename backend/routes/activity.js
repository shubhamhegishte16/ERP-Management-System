const express = require('express');
const router = express.Router();
const { logActivity, getMyActivity, getHourlyBreakdown, getTeamActivity } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, logActivity);
router.get('/me', protect, getMyActivity);
router.get('/hourly/:userId', protect, getHourlyBreakdown);
router.get('/team', protect, authorize('manager', 'admin'), getTeamActivity);

module.exports = router;
