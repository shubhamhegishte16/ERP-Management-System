const express = require('express');
const router = express.Router();
const { getMyProductivity, getTeamProductivity, getHeatmap, getTeamSummary } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/me', protect, getMyProductivity);
router.get('/team', protect, authorize('manager', 'admin'), getTeamProductivity);
router.get('/heatmap/:userId', protect, getHeatmap);
router.get('/summary', protect, authorize('manager', 'admin'), getTeamSummary);

module.exports = router;
